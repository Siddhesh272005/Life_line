const admin = require('firebase-admin');

let initialized = false;

const normalizePrivateKey = (value) => {
  if (!value || typeof value !== 'string') return value;

  let key = value.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  return key.replace(/\\n/g, '\n');
};

const parseServiceAccount = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      parsed.private_key = normalizePrivateKey(parsed.private_key);
    }
    return parsed;
  } catch (err) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
  }
};

const isPlaceholderServiceAccount = (serviceAccount) => {
  if (!serviceAccount || typeof serviceAccount !== 'object') return true;
  const projectId = String(serviceAccount.project_id || '');
  const privateKey = String(serviceAccount.private_key || '');
  return (
    !projectId ||
    !privateKey ||
    projectId === 'your-project-id' ||
    privateKey === 'replace-with-your-private-key'
  );
};

const initFirebaseAdmin = () => {
  if (initialized) return admin;

  const serviceAccount = parseServiceAccount();
  if (!serviceAccount || isPlaceholderServiceAccount(serviceAccount)) {
    return null;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
    return admin;
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    console.warn(
      `Firebase Admin init skipped in ${process.env.NODE_ENV || 'development'}: ${error.message}`
    );
    return null;
  }
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
