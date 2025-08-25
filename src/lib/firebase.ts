
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Your web app's database configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: "accra-hostel-connect.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


let app: ReturnType<typeof initializeApp>;
let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;
let storage: ReturnType<typeof getStorage>;

function initializeFirebase() {
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);

        // Initialize App Check
        if (typeof window !== 'undefined') {
            if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
                try {
                    initializeAppCheck(app, {
                        provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
                        isTokenAutoRefreshEnabled: true,
                    });
                } catch (error) {
                    console.error("Firebase App Check initialization failed. This can happen if the reCAPTCHA key is invalid or the domain is not authorized. Please check your Firebase project settings. Error: ", error);
                }
            } else {
                console.warn("Firebase App Check is not initialized. Please set NEXT_PUBLIC_RECAPTCHA_SITE_KEY in your .env file for production security.");
            }
        }
    } else {
        app = getApp();
    }

    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app, "gs://accra-hostel-connect.appspot.com");
}

// Call initializeFirebase to set up the services.
// This will now be controlled from the root layout.
export { initializeFirebase, app, auth, db, storage };
