import { PlusCircle } from "lucide-react";
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
    type Post,
    type PostQuery,
} from "../../services/petService";

export default function Profile() {
    const { user, token } = useAuth();
    const [posts, setPosts] = useState<Post[] | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);

    const fetchPosts = useCallback(async () => {
        if (user?.id) {
            const data = await getUserPosts(user.id);
            setPosts(data);
        }
    }, [user?.id]);

    useEffect(() => {
        if (user?.id) {
            fetchPosts();
        }
    }, [user?.id, fetchPosts]);

    const handleAddPost = () => {
        setIsAddModalOpen(true);
    };

    const handleEditPost = (post: Post) => {
        setEditingPost(post);
        setIsEditModalOpen(true);
    };

    const handleDeletePost = async (postId: number) => {
        if (!token) return;

        if (window.confirm("Bu ilanı silmek istediğinizden emin misiniz?")) {
            try {
                const success = await deletePost(postId, token);
                if (success) {
                    await fetchPosts();
                } else {
                    console.error("İlan silinemedi");
                }
            } catch (error) {
                console.error("İlan silinirken hata oluştu:", error);
            }
        }
    };

    const handleCreatePost = async (formData: PostQuery) => {
        if (!token) return;

        try {
            const success = await createPost(formData, token);
            if (success) {
                await fetchPosts();
                setIsAddModalOpen(false);
            } else {
                console.error("İlan oluşturulamadı");
            }
        } catch (error) {
            console.error("İlan oluşturulurken hata oluştu:", error);
        }
    };

    const handleUpdatePost = async (formData: PostQuery) => {
        if (!token || !editingPost?.postId) return;

        try {
            const success = await updatePost(
                formData,
                editingPost?.postId.toString(),
                token,
            );
            if (success) {
                await fetchPosts();
                setIsEditModalOpen(false);
                setEditingPost(null);
            } else {
                console.error("İlan güncellenemedi");
            }
        } catch (error) {
            console.error("İlan güncellenirken hata oluştu:", error);
        }
    };

    return (
        <>
            <section className="containerx pt-4 pb-12 min-h-screen">
                <div className="border-b border-gray/50 py-6 mb-6 flex items-end justify-between">
                    <h2 className="capitalize text-xl">
                        {user?.name} {user?.surname !== null && user?.surname}
                    </h2>
                    <Button
                        onClick={handleAddPost}
                        classNames="!flex-center gap-2 !py-2.5 !px-4"
                    >
                        <PlusCircle />
                        İlan Ekle
                    </Button>
                </div>

                <div className="flex items-center justify-center flex-wrap gap-4 md:gap-8">
                    {posts?.length === 0 || !posts ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg mb-4">
                                Henüz hiç ilanınız yok
                            </p>
                            <Button
                                onClick={handleAddPost}
                                classNames="!flex-center gap-2"
                            >
                                <PlusCircle />
                                İlk İlanınızı Ekleyin
                            </Button>
                        </div>
                    ) : (
                        posts?.map((post) => (
                            <UserPostCard
                                key={post.postId}
                                post={post}
                                onEdit={handleEditPost}
                                onDelete={handleDeletePost}
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
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingPost(null);
                    }}
                    onSubmit={handleUpdatePost}
                    post={editingPost}
                />
            )}
        </>
    );
}
