# Velora Dashboard

واجهة أولية تفاعلية مستوحاة من الصور المرفقة، بهوية سوداء وذهبية لمتجر أزياء فاخر.

## التشغيل

افتح `index.html` مباشرة في المتصفح.

## الهيكل

- `index.html` و`styles.css` و`app.js`: الواجهة الأمامية.
- `backend-java`: بداية Spring Boot API باستخدام Java 17.
- `backend-python`: خدمة FastAPI للتحليلات.
- `assets`: الأصول المرجعية المرفقة.

## الخطوة التالية

ربط بطاقات الإحصائيات والرسم البياني بقاعدة بيانات حقيقية، ثم إضافة تسجيل الدخول والصلاحيات وواجهات المنتجات والطلبات.
## Firebase authentication setup

The original static Velora prototype now includes Firebase email/password authentication, email verification, optional SMS phone verification, Firestore user profiles, and role-aware routing. No Clerk is used.

1. Create a Firebase Web App and enable Email/Password and Phone providers in Firebase Authentication.
2. Copy `firebase-config.example.js` to `firebase-config.js` and fill in the Web App config.
3. Add the owner profile manually in Firestore at `users/{ownerUid}` with `role: "owner"`. This is intentional: a browser must never be allowed to promote itself to owner.
4. Publish `firestore.rules` from Firebase Console or with the Firebase CLI.

The Firebase web configuration is not a password. Never put an Admin SDK private key or the owner's password in this repository.
