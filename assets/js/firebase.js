// Configuración de Firebase (reemplaza con tus datos)
const firebaseConfig = {
  apiKey: "AIzaSyDXwwYZcmQf7-_AzPitPbIxIwKgZgSSm8Y",
  authDomain: "vitrina-5a1b8.firebaseapp.com",
  projectId: "vitrina-5a1b8",
  storageBucket: "vitrina-5a1b8.firebasestorage.app",
  messagingSenderId: "141244353424",
  appId: "1:141244353424:web:9510b980ffc75616cec115"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias a Firestore
const db = firebase.firestore();
const storage = firebase.storage();