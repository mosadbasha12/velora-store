import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signOut } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFirestore, doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const config = window.VELORA_FIREBASE_CONFIG;
const root = document.getElementById('storeAuth');
const form = document.getElementById('storeAuthForm');
const title = document.getElementById('storeAuthTitle');
const submit = form.querySelector('button[type="submit"]');
const phoneWrap = document.getElementById('storePhoneWrap');
const message = document.getElementById('storeAuthMessage');
let mode = 'login';
let auth;
let db;

function setMessage(text, error = false) { message.textContent = text; message.classList.toggle('error', error); }
function openAuth(nextMode = 'login') { mode = nextMode; root.hidden = false; document.body.classList.add('auth-open'); updateForm(); }
function closeAuth() { root.hidden = true; document.body.classList.remove('auth-open'); setMessage(''); }
function updateForm() {
  const register = mode === 'register';
  title.textContent = register ? 'Create your account' : 'Welcome to Velora';
  submit.textContent = register ? 'Create account' : 'Sign in';
  document.getElementById('storeReset').hidden = register;
  phoneWrap.hidden = !register;
  document.querySelectorAll('[data-auth-tab]').forEach(button => button.classList.toggle('active', button.dataset.authTab === mode));
}
function explain(error) {
  const code = error?.code || '';
  if (code.includes('invalid-credential')) return 'The email or password is incorrect.';
  if (code.includes('email-already-in-use')) return 'This email is already registered. Try signing in.';
  if (code.includes('weak-password')) return 'Choose a password with at least 6 characters.';
  return 'Something went wrong. Please try again.';
}

if (config?.apiKey) {
  const app = initializeApp(config); auth = getAuth(app); db = getFirestore(app);
  onAuthStateChanged(auth, user => {
    if (user) { closeAuth(); document.getElementById('accountButton').textContent = 'Account'; }
  });
} else setMessage('Firebase is not configured yet.', true);

document.getElementById('accountButton').addEventListener('click', () => auth?.currentUser ? signOut(auth) : openAuth());
document.getElementById('closeAuth').addEventListener('click', closeAuth);
root.addEventListener('click', event => { if (event.target === root) closeAuth(); });
document.querySelectorAll('[data-auth-tab]').forEach(button => button.addEventListener('click', () => { mode = button.dataset.authTab; updateForm(); setMessage(''); }));
document.getElementById('storeReset').addEventListener('click', async () => {
  const email = document.getElementById('storeEmail').value.trim();
  if (!email) return setMessage('Enter your email first.', true);
  try { await sendPasswordResetEmail(auth, email); setMessage('Password reset email sent.'); } catch (error) { setMessage(explain(error), true); }
});
form.addEventListener('submit', async event => {
  event.preventDefault(); setMessage(''); submit.disabled = true;
  const email = document.getElementById('storeEmail').value.trim();
  const password = document.getElementById('storePassword').value;
  try {
    if (mode === 'register') {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', result.user.uid), { email, phone: document.getElementById('storePhone').value.trim(), role: 'customer', createdAt: serverTimestamp() });
      await sendEmailVerification(result.user);
      setMessage('Account created. Please verify your email before ordering.');
    } else {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (!result.user.emailVerified) { await sendEmailVerification(result.user); setMessage('Please verify your email. A new verification link was sent.'); }
      else closeAuth();
    }
  } catch (error) { setMessage(explain(error), true); } finally { submit.disabled = false; }
});

window.addEventListener('velora:require-auth', () => openAuth());
document.addEventListener('click', event => {
  if (!auth?.currentUser && event.target.closest('.bag-button,.review-submit,#cartButton')) { event.preventDefault(); event.stopPropagation(); openAuth(); }
}, true);
