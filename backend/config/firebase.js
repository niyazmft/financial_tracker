const admin = require('firebase-admin');
const path = require('path');

// Get the JSON string from the environment variable and Parse it and initialize Firebase Admin SDK
const serviceAccountJsonString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
if (!serviceAccountJsonString) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable is not set.");
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountJsonString);
} catch (e) {
  console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY_JSON:", e);
  throw new Error("Invalid Firebase Service Account JSON format.");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
