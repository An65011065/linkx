import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAlQbwqFDB0XMZv8du485VBsqVxU3S-vpY",
    authDomain: "linkx-b2c62.firebaseapp.com",
    projectId: "linkx-b2c62",
    storageBucket: "linkx-b2c62.firebasestorage.app",
    messagingSenderId: "606602321768",
    appId: "1:606602321768:web:764410dd29bbb76e47c0dd",
    measurementId: "G-ZEQRBXMSSB",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);
