
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: "accra-hostel-connect.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

function initializeFirebase() {
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
        if (typeof window !== 'undefined') {
            if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
                try {
                    initializeAppCheck(app, {
                        provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
                        isTokenAutoRefreshEnabled: true,
                    });
                } catch (error) {
                    console.error("Firebase App Check initialization failed:", error);
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

initializeFirebase();

// Getter functions to ensure services are initialized
export const getFirebaseApp = () => {
    if (!app) initializeFirebase();
    return app;
}

export const getFirebaseAuth = () => {
    if (!auth) initializeFirebase();
    return auth;
}

export const getFirebaseDb = () => {
    if (!db) initializeFirebase();
    return db;
}

export const getFirebaseStorage = () => {
    if (!storage) initializeFirebase();
    return storage;
}
