// DesaAI — Firebase web config (PLACEHOLDER values).
// Copy this file to `firebase-config.js` and replace the values with your
// own Firebase project's web app config (Firebase console > Project settings
// > Your apps > Web app). NEVER commit the real config file — it is gitignored.
// No API keys or secrets other than the public Firebase web config belong here.
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID",
};

// Optional: reCAPTCHA Enterprise site key for App Check in production.
// Leave empty for local development (the App Check debug provider is used
// instead — see README.md). Never put a debug token in this file.
export const appCheckSiteKey = "";
