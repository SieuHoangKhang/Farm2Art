import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function required(name: string, value: string | undefined) {
	if (!value) throw new Error(`Missing env var ${name}`);
	return value;
}

export function getAdminApp(): App {
	if (getApps().length) return getApps()[0]!;

	const projectId = required("FIREBASE_ADMIN_PROJECT_ID", process.env.FIREBASE_ADMIN_PROJECT_ID);
	const clientEmail = required("FIREBASE_ADMIN_CLIENT_EMAIL", process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
	const privateKey = required("FIREBASE_ADMIN_PRIVATE_KEY", process.env.FIREBASE_ADMIN_PRIVATE_KEY).replace(
		/\\n/g,
		"\n"
	);

	return initializeApp({
		credential: cert({ projectId, clientEmail, privateKey }),
	});
}

export const adminApp = getAdminApp();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
