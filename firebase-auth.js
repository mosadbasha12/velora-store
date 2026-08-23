import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification, sendPasswordResetEmail, updateProfile, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, linkWithCredential } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const cfg = window.VELORA_FIREBASE_CONFIG || {};
const configured = cfg.apiKey && !String(cfg.apiKey).includes('YOUR_') && cfg.projectId && !String(cfg.projectId).includes('YOUR_');
const gate = document.getElementById('authGate'), modal = document.getElementById('authModal'), message = document.getElementById('authMessage'), gateStatus = document.getElementById('authGateStatus');
const requestedView = new URLSearchParams(location.search).get('view') || (location.pathname.endsWith('store.html') ? 'customer' : 'admin');
let auth, db, confirmationResult, recaptcha;
const setMessage = (text, error = false) => { if (message) { message.textContent = text; message.className = `auth-message${error ? ' error' : ''}`; } };
const openModal = (tab = 'login') => { modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); document.querySelector(`[data-auth-tab="${tab}"]`)?.click(); };
const closeModal = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); setMessage(''); };
const showGate = (text = '') => { gate.hidden = false; gateStatus.textContent = text; document.querySelector('.app-shell').hidden = true; };
const hideGate = () => { gate.hidden = true; document.querySelector('.app-shell').hidden = false; };
document.getElementById('openAuth')?.addEventListener('click', () => openModal('login'));
document.getElementById('openSignup')?.addEventListener('click', () => openModal('signup'));
document.getElementById('closeAuth')?.addEventListener('click', closeModal);
modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.querySelectorAll('[data-auth-tab]').forEach(tab => tab.addEventListener('click', () => { const signup = tab.dataset.authTab === 'signup'; document.querySelectorAll('[data-auth-tab]').forEach(x => x.classList.toggle('active', x === tab)); document.getElementById('loginForm').hidden = signup; document.getElementById('signupForm').hidden = !signup; document.getElementById('authTitle').textContent = signup ? 'إنشاء حساب' : 'تسجيل الدخول'; setMessage(''); }));

if (!configured) {
  showGate('أضف إعدادات Firebase في firebase-config.js لتفعيل الحسابات.');
} else {
  const app = initializeApp(cfg); auth = getAuth(app); db = getFirestore(app);
  const profileRef = uid => doc(db, 'users', uid);
  const readRole = async user => (await getDoc(profileRef(user.uid))).data()?.role || 'customer';
  const route = async user => {
    if (!user.emailVerified) { showGate('أكد بريدك الإلكتروني أولاً، ثم أعد فتح الصفحة.'); document.getElementById('resendVerification').hidden = false; return; }
    const role = await readRole(user);
    const adminAllowed = ['owner', 'manager', 'editor'].includes(role);
    if (requestedView === 'admin' && !adminAllowed) { location.replace('./store.html'); return; }
    localStorage.setItem('velora-account-role', requestedView === 'customer' ? 'customer' : role);
    document.querySelector('.profile strong').textContent = user.displayName || user.email;
    document.querySelector('.profile small').textContent = user.email;
    document.getElementById('profileEmail').textContent = user.email;
    hideGate();
  };
  onAuthStateChanged(auth, async user => { if (!user) { showGate(); return; } await route(user); });
  document.getElementById('resendVerification').addEventListener('click', async () => { const user = auth.currentUser; if (!user) return openModal('login'); try { await sendEmailVerification(user); gateStatus.textContent = 'تم إرسال رسالة تأكيد جديدة إلى بريدك.'; } catch { gateStatus.textContent = 'تعذر إرسال الرسالة الآن.'; } });
  document.getElementById('loginForm').addEventListener('submit', async e => { e.preventDefault(); const f = new FormData(e.currentTarget); try { const result = await signInWithEmailAndPassword(auth, f.get('email'), f.get('password')); if (!result.user.emailVerified) { await sendEmailVerification(result.user); setMessage('تم إرسال رسالة تأكيد إلى بريدك. افتحها ثم أعد تحميل الصفحة.', true); return; } closeModal(); } catch (err) { setMessage('بيانات الدخول غير صحيحة أو الحساب غير متاح.', true); } });
  document.getElementById('forgotPassword').addEventListener('click', async () => { const email = document.querySelector('#loginForm [name=email]').value.trim(); if (!email) return setMessage('اكتب البريد الإلكتروني أولاً.', true); try { await sendPasswordResetEmail(auth, email); setMessage('تم إرسال رابط إعادة تعيين كلمة المرور.'); } catch { setMessage('تعذر إرسال رابط إعادة التعيين.', true); } });
  document.getElementById('sendPhoneCode').addEventListener('click', async () => { const phone = document.querySelector('#signupForm [name=phone]').value.trim(); if (!phone) return setMessage('اكتب رقم الهاتف بصيغة دولية.', true); try { if (!recaptcha) recaptcha = new RecaptchaVerifier(auth, 'phoneRecaptcha', { size: 'invisible' }); confirmationResult = await signInWithPhoneNumber(auth, phone, recaptcha); document.getElementById('phoneCodeWrap').hidden = false; setMessage('تم إرسال كود SMS. اكتبه ثم اضغط إنشاء الحساب.'); } catch { setMessage('تعذر إرسال كود الهاتف. تأكد من تفعيل Phone provider في Firebase.', true); } });
  document.getElementById('signupForm').addEventListener('submit', async e => { e.preventDefault(); const f = new FormData(e.currentTarget); try { const result = await createUserWithEmailAndPassword(auth, f.get('email'), f.get('password')); await updateProfile(result.user, { displayName: f.get('name') }); if (confirmationResult && f.get('phoneCode')) { const phoneCredential = PhoneAuthProvider.credential(confirmationResult.verificationId, f.get('phoneCode')); await linkWithCredential(result.user, phoneCredential); } await setDoc(profileRef(result.user.uid), { uid: result.user.uid, name: f.get('name'), email: f.get('email'), phone: f.get('phone'), role: 'customer', emailVerified: false, phoneVerified: Boolean(confirmationResult && f.get('phoneCode')), createdAt: serverTimestamp() }); await sendEmailVerification(result.user); setMessage('تم إنشاء الحساب. راجع بريدك الإلكتروني وأكمل تأكيد الهاتف إن لم يتم.'); } catch (err) { setMessage('تعذر إنشاء الحساب. تحقق من البيانات وكود الهاتف.', true); } });
  document.getElementById('logoutAccount')?.addEventListener('click', async () => { await signOut(auth); closeModal(); });
}
