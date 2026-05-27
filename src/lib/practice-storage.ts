import type { PracticeSet } from "./music";

export type ConfidenceRating = "easy" | "steady" | "hard";
export type StorageMode = "indexeddb" | "localstorage" | "memory";

export interface PracticeSession {
	id: string;
	practiceSet: PracticeSet;
	startedAt: string;
	endedAt: string;
	timerSeconds: number;
	bpm: number | null;
	completed: boolean;
	confidence: ConfidenceRating;
	notesCovered: string[];
	degreesCovered: string[];
}

export interface StoredPracticeData {
	version: 1;
	sessions: PracticeSession[];
}

const DB_NAME = "kord-practice";
const DB_VERSION = 1;
const STORE_NAME = "sessions";
const FALLBACK_KEY = "kord.practice.sessions";

let memorySessions: PracticeSession[] = [];

export async function loadPracticeSessions() {
	try {
		const db = await openDb();
		const sessions = await readAllSessions(db);
		db.close();
		return { sessions, mode: "indexeddb" as StorageMode };
	} catch {
		const fallback = loadFallbackSessions();
		return fallback;
	}
}

export async function savePracticeSession(session: PracticeSession) {
	try {
		const db = await openDb();
		await putSession(db, session);
		db.close();
		return "indexeddb" as StorageMode;
	} catch {
		const current = loadFallbackSessions();
		const sessions = [
			session,
			...current.sessions.filter(
				(storedSession) => storedSession.id !== session.id,
			),
		];
		saveFallbackSessions(sessions, current.mode);
		return current.mode;
	}
}

export async function replacePracticeSessions(sessions: PracticeSession[]) {
	const orderedSessions = orderSessions(sessions);

	try {
		const db = await openDb();
		await clearSessions(db);

		for (const session of orderedSessions) {
			await putSession(db, session);
		}

		db.close();
		return "indexeddb" as StorageMode;
	} catch {
		const current = loadFallbackSessions();
		saveFallbackSessions(orderedSessions, current.mode);
		return current.mode;
	}
}

export async function clearPracticeSessions() {
	try {
		const db = await openDb();
		await clearSessions(db);
		db.close();
		return "indexeddb" as StorageMode;
	} catch {
		const current = loadFallbackSessions();
		saveFallbackSessions([], current.mode);
		return current.mode;
	}
}

export function exportPracticeData(
	sessions: PracticeSession[],
): StoredPracticeData {
	return {
		version: 1,
		sessions: orderSessions(sessions),
	};
}

export function parsePracticeImport(json: string) {
	const parsed = JSON.parse(json) as Partial<StoredPracticeData>;

	if (parsed.version !== 1 || !Array.isArray(parsed.sessions)) {
		throw new Error(
			"Backup file must be a Kord practice export with version 1.",
		);
	}

	return parsed.sessions.filter(isPracticeSession);
}

export function createSessionId() {
	if (globalThis.crypto?.randomUUID) {
		return globalThis.crypto.randomUUID();
	}

	return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function openDb() {
	if (typeof indexedDB === "undefined") {
		throw new Error("IndexedDB is not available.");
	}

	return new Promise<IDBDatabase>((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = () => {
			const db = request.result;

			if (!db.objectStoreNames.contains(STORE_NAME)) {
				const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
				store.createIndex("endedAt", "endedAt");
				store.createIndex("key", "practiceSet.key");
			}
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () =>
			reject(request.error ?? new Error("Could not open IndexedDB."));
	});
}

async function readAllSessions(db: IDBDatabase) {
	return new Promise<PracticeSession[]>((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, "readonly");
		const store = transaction.objectStore(STORE_NAME);
		const request = store.getAll();

		request.onsuccess = () =>
			resolve(orderSessions(request.result.filter(isPracticeSession)));
		request.onerror = () =>
			reject(request.error ?? new Error("Could not load sessions."));
	});
}

async function putSession(db: IDBDatabase, session: PracticeSession) {
	return new Promise<void>((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, "readwrite");
		const store = transaction.objectStore(STORE_NAME);
		const request = store.put(session);

		request.onsuccess = () => resolve();
		request.onerror = () =>
			reject(request.error ?? new Error("Could not save session."));
	});
}

async function clearSessions(db: IDBDatabase) {
	return new Promise<void>((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, "readwrite");
		const store = transaction.objectStore(STORE_NAME);
		const request = store.clear();

		request.onsuccess = () => resolve();
		request.onerror = () =>
			reject(request.error ?? new Error("Could not clear sessions."));
	});
}

function loadFallbackSessions() {
	try {
		if (typeof localStorage !== "undefined") {
			const raw = localStorage.getItem(FALLBACK_KEY);
			const sessions = raw ? JSON.parse(raw) : [];

			return {
				sessions: Array.isArray(sessions)
					? orderSessions(sessions.filter(isPracticeSession))
					: [],
				mode: "localstorage" as StorageMode,
			};
		}
	} catch {
		return { sessions: memorySessions, mode: "memory" as StorageMode };
	}

	return { sessions: memorySessions, mode: "memory" as StorageMode };
}

function saveFallbackSessions(sessions: PracticeSession[], mode: StorageMode) {
	if (mode === "localstorage" && typeof localStorage !== "undefined") {
		localStorage.setItem(FALLBACK_KEY, JSON.stringify(sessions));
		return;
	}

	memorySessions = sessions;
}

function orderSessions(sessions: PracticeSession[]) {
	return [...sessions].sort(
		(a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime(),
	);
}

function isPracticeSession(value: unknown): value is PracticeSession {
	if (!value || typeof value !== "object") {
		return false;
	}

	const candidate = value as Partial<PracticeSession>;

	return (
		typeof candidate.id === "string" &&
		typeof candidate.startedAt === "string" &&
		typeof candidate.endedAt === "string" &&
		typeof candidate.timerSeconds === "number" &&
		typeof candidate.completed === "boolean" &&
		typeof candidate.practiceSet === "object" &&
		Array.isArray(candidate.notesCovered) &&
		Array.isArray(candidate.degreesCovered)
	);
}
