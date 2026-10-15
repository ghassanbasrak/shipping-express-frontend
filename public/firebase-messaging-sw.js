importScripts(
  "https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js",
);
firebase.initializeApp({
  apiKey: "AIzaSyB7hjhnvPC2lUDxugjSpe61jh7qTtfoYu4",
  authDomain: "ashamco-express.firebaseapp.com",
  projectId: "ashamco-express",
  storageBucket: "ashamco-express.firebasestorage.app",
  messagingSenderId: "850629201801",
  appId: "1:850629201801:web:c5f47572a0d8ab2cb1db58",
});
firebase.messaging();
