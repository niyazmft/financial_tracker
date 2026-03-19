const admin = require('firebase-admin');
const path = require('path');

// Get the JSON string from the environment variable and Parse it and initialize Firebase Admin SDK
let serviceAccountJsonString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
if (!serviceAccountJsonString) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable is not set.");
}

// Auto-decode base64 if it doesn't look like raw JSON
if (serviceAccountJsonString && !serviceAccountJsonString.trim().startsWith('{')) {
    try {
        serviceAccountJsonString = Buffer.from(serviceAccountJsonString, 'base64').toString('utf8');
    } catch (e) {
        console.warn("Attempted to decode base64 service account string but failed.");
    }
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
