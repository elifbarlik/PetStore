import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { listenRoomMessages, sendMessage, type ChatMessage } from "../../services/chatService";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/button";
import { toast } from "react-toastify";

export default function ChatRoom() {
	const { id } = useParams<{ id: string }>();
	const { user, isAuth } = useAuth();
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [text, setText] = useState("");
	const [sending, setSending] = useState(false);
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

	const onSend = async (e: React.FormEvent) => {
		e.preventDefault();
		const message = text.trim();
		if (!id || !user || !message || sending) return;
		setSending(true);
		try {
			await sendMessage(id, user.id, message);
			setText("");
		} catch (error) {
			console.error("sendMessage error:", error);
			toast.error("Mesaj gönderilemedi. Lütfen tekrar deneyin.");
		} finally {
			setSending(false);
		}
	};

	return (
		<div className="containerx py-6">
			<div className="bg-white rounded-xl border flex flex-col h-[70vh]">
				<div className="p-4 border-b font-medium">Sohbet</div>
				<div className="flex-1 overflow-y-auto p-4 space-y-2">
					{messages.map((m) => (
						<div
							key={m.id}
							className={`max-w-[75%] px-3 py-2 rounded-lg ${m.senderId === user?.id ? "bg-primary text-white ml-auto" : "bg-gray-100 text-gray-800"}`}
						>
							{m.text}
						</div>
					))}
					<div ref={bottomRef} />
				</div>
				{/* A form so Enter sends the message */}
				<form onSubmit={onSend} className="p-3 border-t flex gap-2">
					<input
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder="Mesaj yazın..."
						aria-label="Mesaj"
						maxLength={2000}
						className="flex-1 border rounded-full px-4 py-2 outline-none"
					/>
					<Button type="submit" disabled={sending || !text.trim()} classNames="!px-5 disabled:!bg-gray-400">
						{sending ? "Gönderiliyor..." : "Gönder"}
					</Button>
				</form>
			</div>
		</div>
	);
}


