import { useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";
import axios from "app/configs/apiConfig";
import useJwtAuth from "../jwt/useJwtAuth";

export default function FirebaseMessagingApp() {
  const { user } = useJwtAuth();
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    async function setup() {
      const vapidKey = import.meta.env.VITE_FIREBASE_APP_VAPID_KEY;
      if (
        !user ||
        !vapidKey ||
        !("Notification" in window) ||
        !(await isSupported())
      )
        return;
      const permission =
        Notification.permission === "default"
          ? await Notification.requestPermission()
          : Notification.permission;
      if (!active || permission !== "granted") return;
      const app =
        getApps().find((app) => app.name === "ashamco-messaging") ||
        initializeApp(
          {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env
              .VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID,
          },
          "ashamco-messaging",
        );
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
      );
      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });
      if (!active) return;
      if (token && token !== user.fcmToken)
        await axios.post("v1/users/device-tokens", { fcmToken: token });
      if (active && token) localStorage.setItem("fcm_token", token);
      unsubscribe = onMessage(messaging, (payload) => {
        if (active && payload.notification?.title)
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: "/favicon.png",
          });
      });
    }
    setup().catch(() => {
      /* Messaging must not block authentication on unsupported browsers or denied permissions. */
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [user?.id]);
  return null;
}
