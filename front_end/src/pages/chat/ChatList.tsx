import { useEffect, useState } from "react";
import { listUserRooms, type ChatRoom } from "../../services/chatService";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/button";
import { useNavigate } from "react-router";

export default function ChatList() {
	const { user, isAuth } = useAuth();
	const [rooms, setRooms] = useState<ChatRoom[]>([]);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		const run = async () => {
			if (!user) return;
			setLoading(true);
			try {
				const data = await listUserRooms(user.id);
				setRooms(data);
			} finally {
				setLoading(false);
			}
		};
		run();
	}, [user?.id]);

	if (!isAuth) {
		return (
			<div className="containerx py-12">
				<p className="text-center text-gray-600 mb-4">Mesajları görmek için giriş yapın.</p>
				<div className="flex justify-center">
					<Button isLink href="/auth/login">Giriş Yap</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="containerx py-8">
			<h1 className="text-2xl font-semibold mb-6">Mesajlar</h1>
			{loading ? (
				<p>Yükleniyor...</p>
			) : rooms.length === 0 ? (
				<p className="text-gray-600">Henüz sohbet yok.</p>
			) : (
				<ul className="divide-y divide-gray-200 bg-white rounded-xl border">
					{rooms.map((r) => {
						const otherId = r.participantIds.find((id) => id !== user!.id)!;
						const other = r.participants?.[otherId];
						return (
							<li key={r.id} className="p-4 flex items-center justify-between">
								<div>
									<p className="font-medium">{other?.userName || other?.email}</p>
									<p className="text-sm text-gray-500 line-clamp-1">{r.lastMessage || "Yeni sohbet"}</p>
								</div>
								<Button onClick={() => navigate(`/chat/${r.id}`)} classNames="!py-2 !px-4">Aç</Button>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}


