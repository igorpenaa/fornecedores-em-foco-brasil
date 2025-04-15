
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCpY8HdnoTJcEc_kerKkXoLjyDbscZiLt4",
  authDomain: "fornecedores-99ee2.firebaseapp.com",
  projectId: "fornecedores-99ee2",
  storageBucket: "fornecedores-99ee2.firebasestorage.app",
  messagingSenderId: "1074549158917",
  appId: "1:1074549158917:web:bbb02d2637f182b8e2586c"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços do Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
