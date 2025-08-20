import {
	addDoc,
	collection,
	doc,
	getDocs,
	limit,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	updateDoc,
	where,
} from "firebase/firestore/lite";
import { db, authReady, ensureFirebaseAuth } from "./firebase";
import type { User } from "../features/auth/authSlice";
 
// Polling-only (no real-time stream)

export interface ChatRoom {
	id: string;
	participantIds: [string, string];
	participants: Record<string, Pick<User, "id" | "userName" | "name" | "surname" | "email">>;
	postId?: number;
	lastMessage?: string;
	updatedAt: number;
}

export interface ChatMessage {
	id: string;
	roomId: string;
	senderId: string;
	text: string;
	createdAt: number;
}

const roomsCol = collection(db, "rooms");

export const createOrGetRoom = async (opts: {
	userA: User;
	userB: User;
	postId?: number;
}): Promise<string> => {
	await ensureFirebaseAuth();
	await authReady;
	const [a, b] = [opts.userA.id, opts.userB.id].sort();
	const roomKey = `${a}_${b}${opts.postId ? `_${opts.postId}` : ""}`;
	const roomDocRef = doc(roomsCol, roomKey);
	// Avoid initial read to reduce permission-denied (read) issues; upsert room doc
	await setDoc(
		roomDocRef,
		{
			participantIds: [a, b],
			participants: {
				[a]: {
					id: opts.userA.id,
					userName: opts.userA.userName,
					name: opts.userA.name,
					surname: opts.userA.surname,
					email: opts.userA.email,
				},
				[b]: {
					id: opts.userB.id,
					userName: opts.userB.userName,
					name: opts.userB.name,
					surname: opts.userB.surname,
					email: opts.userB.email,
				},
			},
			postId: opts.postId ?? null,
			lastMessage: "",
			updatedAt: Date.now(),
		},
		{ merge: true },
	);
	return roomDocRef.id;
};

export const sendMessage = async (roomId: string, senderId: string, text: string) => {
	await ensureFirebaseAuth();
	await authReady;
	const messagesCol = collection(db, `rooms/${roomId}/messages`);
	await addDoc(messagesCol, {
		roomId,
		senderId,
		text,
		createdAt: serverTimestamp(),
		createdAtMillis: Date.now(),
	});
	const roomRef = doc(db, "rooms", roomId);
	await updateDoc(roomRef, {
		lastMessage: text,
		updatedAt: Date.now(),
	});
};

export const listenRoomMessages = (
	roomId: string,
	onChange: (messages: ChatMessage[]) => void,
) => {
	const start = async () => { await ensureFirebaseAuth(); await authReady; };
	start();
	const q = query(
		collection(db, `rooms/${roomId}/messages`),
		orderBy("createdAtMillis", "asc"),
		limit(200),
	);

	let pollTimer: number | null = null;

	const startPolling = () => {
		if (pollTimer != null) return;
		const doPoll = async () => {
			try {
				const snap = await getDocs(q);
				const items: ChatMessage[] = [];
				snap.forEach((d) => {
					const data = d.data() as any;
					items.push({
						id: d.id,
						roomId: data.roomId,
						senderId: data.senderId,
						text: data.text,
						createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
					});
				});
				onChange(items);
			} catch (e) {
				console.error("Polling messages failed:", e);
			}
		};
		// Initial fetch fast, then steady interval
		doPoll();
		pollTimer = window.setInterval(doPoll, 2000);
	};

	// Pure polling (no realtime Listen)
	startPolling();
	return () => {
		if (pollTimer != null) {
			window.clearInterval(pollTimer);
			pollTimer = null;
		}
	};
};

export const listUserRooms = async (userId: string): Promise<ChatRoom[]> => {
	await ensureFirebaseAuth();
	await authReady;
	const q = query(roomsCol, where("participantIds", "array-contains", userId));
	const snap = await getDocs(q);
	const rooms: ChatRoom[] = [];
	snap.forEach((d) => {
		const data = d.data() as any;
		rooms.push({
			id: d.id,
			participantIds: data.participantIds as [string, string],
			participants: data.participants as ChatRoom["participants"],
			postId: data.postId ?? undefined,
			lastMessage: data.lastMessage ?? "",
			updatedAt: data.updatedAt ?? Date.now(),
		});
	});
	rooms.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
	return rooms;
};


