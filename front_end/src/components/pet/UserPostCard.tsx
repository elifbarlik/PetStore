import { Edit, Trash2, MapPin, Clock, CheckCircle } from "lucide-react";
import type { Post } from "../../services/petService";
import { formatTime } from "../../utils";

interface UserPostCardProps {
    post: Post;
    onEdit: (post: Post) => void;
    onDelete: (postId: number) => void;
}

export default function UserPostCard({
    post,
    onEdit,
    onDelete,
}: UserPostCardProps) {
    return (
        <div className="bg-white self-stretch rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 group max-w-[350px] flex flex-col justify-between">
            <div className="relative overflow-hidden aspect-[4/3]">
                <img
                    src={post.imageUrl}
                    alt={post.petName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {post.isAdopted && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 shadow-md">
                        <CheckCircle size={16} />
                        Sahiplenildi
                    </div>
                )}

                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                    {post.petType || "Belirtilmemiş"}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="p-5 space-y-4">
                <div className="space-y-2">
                    <h3 className="font-bold text-xl text-gray-900 line-clamp-2">
                        {post.title}
                    </h3>
                    <p className="text-primary font-semibold text-lg">
                        🐾 {post.petName}
                    </p>
                </div>

                <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                    {post.description}
                </p>

                <div className="space-y-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            <Clock size={16} />
                            <span>{formatTime(post.postTime)}</span>
                        </div>

                        {post.postLatitude && post.postLongitude && (
                            <div className="flex items-center gap-1">
                                <MapPin size={16} />
                                <span>Konum mevcut</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 pt-3">
                    <button
                        onClick={() => onEdit(post)}
                        className="flex-1 bg-primary text-white py-2.5 px-4 rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                        <Edit size={18} />
                        Düzenle
                    </button>

                    <button
                        onClick={() => onDelete(post.postId)}
                        className="p-2.5 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 hover:border-red-300 transition-colors"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
