"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

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

export function getFirebaseApp(): FirebaseApp {
	if (!getApps().length) {
		initializeApp(getFirebaseConfig());
	}
	return getApps()[0]!;
}

export const firebaseApp = getFirebaseApp();
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDb = getFirestore(firebaseApp);
export const firebaseStorage = getStorage(firebaseApp);
export const firebaseRtdb = getDatabase(firebaseApp);
