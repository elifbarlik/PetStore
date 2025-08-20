import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { listenRoomMessages, sendMessage, type ChatMessage } from "../../services/chatService";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/button";

export default function ChatRoom() {
	const { id } = useParams<{ id: string }>();
	const { user, isAuth } = useAuth();
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [text, setText] = useState("");
	const bottomRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!id) return;
		const unsub = listenRoomMessages(id, setMessages);
		return () => unsub();
	}, [id]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages.length]);

	if (!isAuth) {
		return (
			<div className="containerx py-12">
				<p className="text-center text-gray-600">Sohbet için giriş yapın.</p>
			</div>
		);
	}

	const onSend = async () => {
		if (!id || !user || !text.trim()) return;
		await sendMessage(id, user.id, text.trim());
		setText("");
	};

	return (
		<div className="containerx py-6">
			<div className="bg-white rounded-xl border flex flex-col h-[70vh]">
				<div className="p-4 border-b font-medium">Sohbet</div>
				<div className="flex-1 overflow-y-auto p-4 space-y-2">
					{messages.map((m) => (
						<div
							key={m.id}
							className={`max-w-[75%] px-3 py-2 rounded-lg ${m.senderId === user!.id ? "bg-primary text-white ml-auto" : "bg-gray-100 text-gray-800"}`}
						>
							{m.text}
						</div>
					))}
					<div ref={bottomRef} />
				</div>
				<div className="p-3 border-t flex gap-2">
					<input
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder="Mesaj yazın..."
						className="flex-1 border rounded-full px-4 py-2 outline-none"
					/>
					<Button onClick={onSend} classNames="!px-5">Gönder</Button>
				</div>
			</div>
		</div>
	);
}


