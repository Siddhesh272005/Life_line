const admin = require('firebase-admin');

let initialized = false;

const parseServiceAccount = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
  }
};

const initFirebaseAdmin = () => {
  if (initialized) return admin;

  const serviceAccount = parseServiceAccount();
  if (!serviceAccount) {
    return null;
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  initialized = true;
  return admin;
};

const getFirebaseAdmin = () => {
  if (!initialized) {
    initFirebaseAdmin();
  }
  return initialized ? admin : null;
};

module.exports = {
  initFirebaseAdmin,
  getFirebaseAdmin,
};
