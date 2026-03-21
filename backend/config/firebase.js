const admin = require('firebase-admin');

// Get the JSON string from the environment variable and Parse it and initialize Firebase Admin SDK
let serviceAccountJsonString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
if (!serviceAccountJsonString) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable is not set.");
}

// Auto-decode base64 if it doesn't look like raw JSON
if (serviceAccountJsonString && !serviceAccountJsonString.trim().startsWith('{')) {
    try {
        serviceAccountJsonString = Buffer.from(serviceAccountJsonString, 'base64').toString('utf8');
    } catch {
        console.warn("Attempted to decode base64 service account string but failed.");
    }
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountJsonString);
} catch (e) {
  if (process.env.NODE_ENV === 'test') {
    console.warn("Using dummy Firebase credentials for test environment.");
    serviceAccount = {
        project_id: "test-project",
        private_key: "-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----\n",
        client_email: "test@example.com"
    };
  } else {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY_JSON:", e);
    throw new Error("Invalid Firebase Service Account JSON format.", { cause: e });
  }
}

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (initError) {
    if (process.env.NODE_ENV === 'test') {
        console.warn("Firebase already initialized or failed in test mode, skipping.");
    } else {
        throw initError;
    }
}

module.exports = admin;
