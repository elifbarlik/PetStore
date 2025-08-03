import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { getPostById, adoptPet, type Post } from "../../services/petService";
import { MapPin, Clock, User, CheckCircle, ArrowLeft } from "lucide-react";
import { formatTime } from "../../utils";
import Button from "../../components/button";
import { useAuth } from "../../hooks/useAuth";

export default function PetDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, token, isAuth } = useAuth();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [adopting, setAdopting] = useState(false);

    useEffect(() => {
        if (id) {
            fetchPost(parseInt(id));
        }
    }, [id]);

    const fetchPost = async (postId: number) => {
        try {
            const data = await getPostById(postId);
            setPost(data);
        } catch (error) {
            console.error("İlan detayları yüklenirken hata oluştu:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdopt = async () => {
        if (!post || !id) return;

        try {
            setAdopting(true);
            const success = await adoptPet(parseInt(id), token as string);
            if (success) {
                await fetchPost(parseInt(id));
            }
        } catch (error) {
            console.error("Sahiplenme işlemi sırasında hata oluştu:", error);
        } finally {
            setAdopting(false);
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
                    <Button onClick={() => navigate(-1)} classNames="mt-4">
                        <ArrowLeft size={20} />
                        Geri Dön
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="containerx py-12 min-h-screen">
            <button
                onClick={() => navigate(-1)}
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
                                {post.user.userName}
                            </span>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Clock size={20} />
                                <span>{formatTime(post.postTime)}</span>
                            </div>

                            {post.postLatitude && post.postLongitude && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin size={20} />
                                    <span>Konum mevcut</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                        {!post.isAdopted && post.user.id !== user?.id && (
                            <Button
                                onClick={handleAdopt}
                                disabled={adopting || !isAuth}
                                classNames="flex-1 !py-3 disabled:bg-gray-400 disabled:!cursor-not-allowed"
                            >
                                {adopting
                                    ? "İşlem yapılıyor..."
                                    : isAuth
                                    ? "Sahiplen"
                                    : "Sahiplenmek için giriş yapın"}
                            </Button>
                        )}

                        {post.user.id === user?.id && (
                            <Button
                                onClick={handleAdopt}
                                disabled={true}
                                classNames="flex-1 !py-3 disabled:bg-gray-400 disabled:!cursor-not-allowed"
                            >
                                İlan Size Ait
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
