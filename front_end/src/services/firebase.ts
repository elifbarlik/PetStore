import { initializeApp, getApps } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { API_URL } from "../utils";
import { getFirestore } from "firebase/firestore/lite";

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
	appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

const requiredEnvVars = {
	apiKey: "VITE_FIREBASE_API_KEY",
	authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
	projectId: "VITE_FIREBASE_PROJECT_ID",
	storageBucket: "VITE_FIREBASE_STORAGE_BUCKET",
	messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID",
	appId: "VITE_FIREBASE_APP_ID",
};

const missing = Object.entries(requiredEnvVars)
	.filter(([key]) => !firebaseConfig[key as keyof typeof firebaseConfig])
	.map(([, envKey]) => envKey);

if (missing.length) {
	console.error(
		`Missing Firebase env vars: ${missing.join(", ")}. Create a .env.local with these variables.`,
	);
	throw new Error("Firebase configuration is incomplete.");
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Use Firestore Lite (REST only). If VITE_FIREBASE_DB_ID is set, use that DB; otherwise default ("(default)")
const __dbId = (import.meta.env.VITE_FIREBASE_DB_ID as string | undefined)?.trim();
export const db = __dbId && __dbId !== "(default)" && __dbId !== "default"
	? getFirestore(app, __dbId)
	: getFirestore(app);

export const auth = getAuth(app);
// Debug: brief one-time config log (non-sensitive)
try {
    console.info("Firebase app initialized", {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
    });
} catch {}

// Ensure session persists across reloads
setPersistence(auth, browserLocalPersistence).catch((err) => {
	console.warn("Failed to set Firebase Auth persistence", err);
});

// App Check: enable if env provided; support debug mode for local dev
try {
	// Enable debug mode if requested
	if (import.meta.env.VITE_APPCHECK_DEBUG === "true") {
		// @ts-expect-error AppCheck debug flag on window
		self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
	}
	const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
	if (siteKey) {
		initializeAppCheck(app, {
			provider: new ReCaptchaV3Provider(siteKey),
			isTokenAutoRefreshEnabled: true,
		});
	}
} catch (e) {
	console.warn("App Check initialization failed", e);
}

// Expose a promise that resolves when Firebase Auth has finished initial state
let _resolveAuthReady: (() => void) | null = null;
export const authReady = new Promise<void>((resolve) => {
	_resolveAuthReady = resolve;
});
onAuthStateChanged(auth, () => {
	if (_resolveAuthReady) {
		_resolveAuthReady();
		_resolveAuthReady = null;
	}
});

// Ensure Firebase Auth is signed in when we have backend JWT in localStorage
export async function ensureFirebaseAuth(): Promise<void> {
	// Already signed in
	if (auth.currentUser) return;
	// Not authenticated on backend either
	const backendToken = localStorage.getItem("token");
	if (!backendToken) return;
	try {
		const res = await fetch(`${API_URL}/auth/firebase/custom-token`, {
			method: "POST",
			headers: { Authorization: `Bearer ${backendToken}` },
		});
		if (!res.ok) return;
		const data = (await res.json()) as { token?: string };
		if (data?.token) {
			await signInWithCustomToken(auth, data.token);
		}
	} catch (e) {
		console.warn("ensureFirebaseAuth: failed to sign in with custom token", e);
	}
}


