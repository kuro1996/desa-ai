// Type declarations for ./firebase-config.js (plain JS, gitignored).
// The real file holds the Firebase web config with PLACEHOLDER values until
// the user pastes their own. See firebase-config.example.js.
export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export declare const firebaseConfig: FirebaseWebConfig;

/** reCAPTCHA Enterprise site key for App Check ("" = App Check disabled). */
export declare const appCheckSiteKey: string;
