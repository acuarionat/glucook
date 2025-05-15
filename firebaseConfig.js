import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Importa Firestore

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCLAoeaAOaZX15LclTOiYaBLpldrAWSZ24",
  authDomain: "glucook.firebaseapp.com",
  projectId: "glucook",
  storageBucket: "glucook.firebasestorage.app",
  messagingSenderId: "430744455285",
  appId: "1:430744455285:web:abba39e9e0d9e04e72d03c",
  measurementId: "G-HCWRHVN502"
};

// Inicializa Firebase
const appFirebase = initializeApp(firebaseConfig);

// Inicializa Firestore
export const db = getFirestore(appFirebase);

// Exporta Auth
export const auth = getAuth(appFirebase);

export default appFirebase;

//android: 232171212801-eo4t5718m4ua583rs7cqjekrqbo1qlgb.apps.googleusercontent.com