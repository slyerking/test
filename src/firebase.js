// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Login/SignUp System

const firebaseConfig = {
  apiKey: "AIzaSyDxhbHs27FrgBrt4Y3xrIH9y7LzInNQPRE",
  authDomain: "fabrics-prices-calculator.firebaseapp.com",
  projectId: "fabrics-prices-calculator",
  storageBucket: "fabrics-prices-calculator.firebasestorage.app",
  messagingSenderId: "1033086068899",
  appId: "1:1033086068899:web:d355dc099f96bc98a2b716"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // Login/SignUp System