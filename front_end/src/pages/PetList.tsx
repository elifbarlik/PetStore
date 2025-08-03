import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import PostBox from "../components/pet/PostBox";
import { getAllPosts, type Post } from "../services/petService";
import { Search } from "lucide-react";

export default function PetList() {
    const [posts, setPosts] = useState<Post[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showOnlyUnadopted, setShowOnlyUnadopted] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const data = await getAllPosts();
            setPosts(data);
        } catch (error) {
            console.error("İlanlar yüklenirken hata oluştu:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostClick = (postId: number) => {
        navigate(`/ilan/${postId}`);
    };

    const filteredPosts = posts
        ?.filter(
            (post) =>
                post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.petType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.description
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
        )
        .filter((post) => !showOnlyUnadopted || !post.isAdopted);

    if (loading) {
        return (
            <div className="containerx py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">İlanlar yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <section className="containerx py-12 min-h-screen">
            <div className="mb-8 space-y-6">
                <h1 className="text-3xl font-bold text-gray-900">
                    Sahiplendirme İlanları
                </h1>

                <div className="flex items-baseline flex-wrap md:gap-12 gap-4">
                    <div className="relative">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={20}
                        />
                        <input
                            type="text"
                            placeholder="İlan ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full max-w-md pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                        />
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <input
                            type="checkbox"
                            id="showOnlyUnadopted"
                            checked={showOnlyUnadopted}
                            onChange={() =>
                                setShowOnlyUnadopted((prev) => !prev)
                            }
                            className="w-4 h-4 accent-primary"
                        />
                        <label
                            htmlFor="showOnlyUnadopted"
                            className="text-sm text-gray-700"
                        >
                            Sadece sahiplenilmeyen ilanları göster
                        </label>
                    </div>
                </div>
            </div>

            {!posts || posts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">Henüz hiç ilan yok</p>
                </div>
            ) : filteredPosts && filteredPosts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                        Aramanızla eşleşen ilan bulunamadı
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 grid-flow-row-dense sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredPosts?.map((post) => (
                        <div
                            key={post.postId}
                            onClick={() => handlePostClick(post.postId)}
                            className="w-full"
                        >
                            <PostBox post={post} />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
