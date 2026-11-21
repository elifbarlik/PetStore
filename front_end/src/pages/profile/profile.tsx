import { PlusCircle } from "lucide-react";
import { toast } from "react-toastify";
import Button from "../../components/button";
import UserPostCard from "../../components/pet/UserPostCard";
import AddPetModal from "../../components/pet/AddPetModal";
import EditPetModal from "../../components/pet/EditPetModal";
import { useAuth } from "../../hooks/useAuth";
import { useEffect, useState, useCallback } from "react";
import {
    getUserPosts,
    createPost,
    updatePost,
    deletePost,
    cancelAdoption,
    type ActionResult,
    type Post,
    type PostQuery,
} from "../../services/petService";

export default function Profile() {
    const { user, token } = useAuth();
    const [posts, setPosts] = useState<Post[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [busyPostId, setBusyPostId] = useState<number | null>(null);

    const fetchPosts = useCallback(async () => {
        if (!user?.id) return;
        const data = await getUserPosts(user.id);
        setPosts(data ?? []);
        setLoading(false);
    }, [user?.id]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    /** Shows the outcome to the user and refreshes the list on success. */
    const report = async (result: ActionResult): Promise<ActionResult> => {
        if (result.success) {
            toast.success(result.message);
            await fetchPosts();
        } else {
            toast.error(result.message);
        }
        return result;
    };

    const notLoggedIn: ActionResult = { success: false, message: "Oturumunuz sona erdi. Lütfen tekrar giriş yapın." };

    // Dialog forms: success -> toast + refresh; failure -> message shown inside the dialog
    const submitFromDialog = async (result: ActionResult): Promise<ActionResult> => {
        if (result.success) return report(result);
        return result;
    };

    const handleCreatePost = async (formData: PostQuery) => {
        if (!token) return notLoggedIn;
        return submitFromDialog(await createPost(formData, token));
    };

    const handleUpdatePost = async (formData: PostQuery) => {
        if (!token || !editingPost) return notLoggedIn;
        return submitFromDialog(await updatePost(formData, editingPost.postId, token));
    };

    const handleDeletePost = async (postId: number) => {
        if (!token || busyPostId !== null) return;
        if (!window.confirm("Bu ilanı silmek istediğinizden emin misiniz?")) return;

        setBusyPostId(postId);
        await report(await deletePost(postId, token));
        setBusyPostId(null);
    };

    const handleCancelAdoption = async (postId: number) => {
        if (!token || busyPostId !== null) return;
        if (!window.confirm("Bu ilanın sahiplenme durumunu iptal etmek istiyor musunuz?")) return;

        setBusyPostId(postId);
        await report(await cancelAdoption(postId, token));
        setBusyPostId(null);
    };

    return (
        <>
            <section className="containerx pt-4 pb-12 min-h-screen">
                <div className="border-b border-gray/50 py-6 mb-6 flex items-end justify-between">
                    <h2 className="capitalize text-xl">
                        {[user?.name, user?.surname].filter(Boolean).join(" ")}
                    </h2>
                    <Button onClick={() => setIsAddModalOpen(true)} classNames="!flex-center gap-2 !py-2.5 !px-4">
                        <PlusCircle />
                        İlan Ekle
                    </Button>
                </div>

                <div className="flex items-center justify-center flex-wrap gap-4 md:gap-8">
                    {loading ? (
                        <p className="text-gray-500 py-12">İlanlarınız yükleniyor...</p>
                    ) : !posts || posts.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg mb-4">Henüz hiç ilanınız yok</p>
                            <Button onClick={() => setIsAddModalOpen(true)} classNames="!flex-center gap-2">
                                <PlusCircle />
                                İlk İlanınızı Ekleyin
                            </Button>
                        </div>
                    ) : (
                        posts.map((post) => (
                            <UserPostCard
                                key={post.postId}
                                post={post}
                                busy={busyPostId === post.postId}
                                onEdit={setEditingPost}
                                onDelete={handleDeletePost}
                                onCancelAdoption={handleCancelAdoption}
                            />
                        ))
                    )}
                </div>
            </section>

            <AddPetModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleCreatePost}
            />

            {editingPost && (
                <EditPetModal
                    isOpen
                    onClose={() => setEditingPost(null)}
                    onSubmit={handleUpdatePost}
                    post={editingPost}
                />
            )}
        </>
    );
}
