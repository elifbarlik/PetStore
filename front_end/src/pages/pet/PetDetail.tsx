import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { getPostById, adoptPet, type Post } from "../../services/petService";
import { MapPin, Clock, User, CheckCircle, ArrowLeft } from "lucide-react";
import { formatTime } from "../../utils";
import Button from "../../components/button";
import { useAuth } from "../../hooks/useAuth";
import { createOrGetRoom } from "../../services/chatService";
import { toast } from "react-toastify";

export default function PetDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, token, isAuth } = useAuth();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [adopting, setAdopting] = useState(false);
    const [openingChat, setOpeningChat] = useState(false);

    // Only a positive integer is a valid id ("12abc" or "-1" is treated as not found)
    const postId = id && /^\d+$/.test(id) ? Number(id) : null;

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        if (postId === null) {
            setPost(null);
            setLoading(false);
            return;
        }
        getPostById(postId).then((data) => {
            if (cancelled) return;
            setPost(data);
            setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [postId]);

    // "Geri Dön" must not leave the site when the page was opened directly
    const goBack = () => {
        const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0;
        if (historyIndex > 0) navigate(-1);
        else navigate("/ilanlar");
    };

    const handleAdopt = async () => {
        if (!post || !token || adopting) return;

        setAdopting(true);
        const result = await adoptPet(post.postId, token);
        if (result.success) {
            toast.success(result.message);
            const fresh = await getPostById(post.postId);
            if (fresh) setPost(fresh);
        } else {
            toast.error(result.message);
        }
        setAdopting(false);
    };

    const handleMessage = async () => {
        if (!post || !user || !post.user || post.user.id === user.id || openingChat) return;
        setOpeningChat(true);
        try {
            const roomId = await createOrGetRoom({ userA: user, userB: post.user, postId: post.postId });
            navigate(`/chat/${roomId}`);
        } catch (error) {
            console.error("createOrGetRoom error:", error);
            toast.error("Sohbet başlatılamadı. Lütfen daha sonra tekrar deneyin.");
        } finally {
            setOpeningChat(false);
        }
    };

    if (loading) {
        return (
            <div className="containerx py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">
                        İlan detayları yükleniyor...
                    </p>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="containerx py-12">
                <div className="text-center">
                    <p className="text-gray-500 text-lg">İlan bulunamadı</p>
                    <Button onClick={goBack} classNames="mt-4 !inline-flex items-center gap-2">
                        <ArrowLeft size={20} />
                        Geri Dön
                    </Button>
                </div>
            </div>
        );
    }

    const isOwner = Boolean(user) && (post.user?.id ?? post.userId) === user?.id;

    return (
        <div className="containerx py-12 min-h-screen">
            <button
                onClick={goBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-8"
            >
                <ArrowLeft size={20} />
                Geri Dön
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="relative overflow-hidden rounded-2xl aspect-square lg:aspect-[4/3]">
                    <img
                        src={post.imageUrl}
                        alt={post.petName}
                        className="w-full h-full object-cover"
                    />

                    {post.isAdopted && (
                        <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full text-base font-medium flex items-center gap-2 shadow-md">
                            <CheckCircle size={20} />
                            Sahiplenildi
                        </div>
                    )}

                    <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-base font-medium">
                        {post.petType}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <h1 className="text-3xl font-bold text-gray-900">
                            {post.title}
                        </h1>
                        <p className="text-primary text-xl font-semibold">
                            🐾 {post.petName}
                        </p>
                    </div>

                    <div className="prose max-w-none">
                        <p>{post.description}</p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-gray-600">
                            <User size={20} />
                            <span className="font-medium">
                                {post.user?.userName}
                            </span>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Clock size={20} />
                                <span>{formatTime(post.postTime)}</span>
                            </div>

                            {post.postLatitude != null && post.postLongitude != null && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin size={20} />
                                    <span>Konum mevcut</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                        {!isAuth ? (
                            // Anonymous visitors are sent to the login page instead of a dead button
                            <Button
                                onClick={() => navigate("/auth/login")}
                                classNames="flex-1 !py-3"
                            >
                                {post.isAdopted ? "Mesaj için giriş yapın" : "Sahiplenmek için giriş yapın"}
                            </Button>
                        ) : isOwner ? (
                            <Button
                                disabled
                                classNames="flex-1 !py-3 disabled:bg-gray-400 disabled:!cursor-not-allowed"
                            >
                                İlan Size Ait
                            </Button>
                        ) : (
                            <>
                                {!post.isAdopted && (
                                    <Button
                                        onClick={handleAdopt}
                                        disabled={adopting}
                                        classNames="flex-1 !py-3 disabled:bg-gray-400 disabled:!cursor-not-allowed"
                                    >
                                        {adopting ? "İşlem yapılıyor..." : "Sahiplen"}
                                    </Button>
                                )}
                                <Button
                                    onClick={handleMessage}
                                    disabled={openingChat}
                                    classNames="flex-1 !py-3 !bg-blue-600 !text-white disabled:bg-gray-400 disabled:!cursor-not-allowed"
                                >
                                    {openingChat ? "Sohbet açılıyor..." : "Mesaj Gönder"}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
