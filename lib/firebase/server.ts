// Firebase client SDK for server-side usage (API routes)
// Same as client.ts but WITHOUT "use client" directive

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

function getFirebaseConfig() {
	const config = {
		apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
		authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
		projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
		storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
		messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
		appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
		databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
	} as const;

	const missing = Object.entries(config)
		.filter(([, v]) => !v)
		.map(([k]) => k);

	if (missing.length) {
		throw new Error(
			`Missing Firebase env vars: ${missing.join(", ")}. Copy .env.local.example -> .env.local and fill values.`
		);
	}

	return config;
}

function getServerApp(): FirebaseApp {
	const appName = "__server__";
	const existing = getApps().find((a) => a.name === appName);
	if (existing) return existing;
	return initializeApp(getFirebaseConfig(), appName);
}

export const serverApp = getServerApp();
export const serverDb = getFirestore(serverApp);
