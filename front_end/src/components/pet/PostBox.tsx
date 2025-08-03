import { MapPin, Clock, User, CheckCircle } from "lucide-react";
import type { Post } from "../../services/petService";
import { formatTime } from "../../utils";

export default function PostBox({ post }: { post: Post }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 group cursor-pointer ">
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
                    {post.petType}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="p-5 space-y-4">
                <div className="space-y-2">
                    <h3 className="font-bold text-xl text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
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
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User size={16} />
                        <span className="font-medium">
                            {post.user.userName}
                        </span>
                    </div>

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
                    <button className="flex-1 bg-primary text-white py-2.5 px-4 rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                        {post.isAdopted ? "Detayları Gör" : "Sahiplen"}
                    </button>
                </div>
            </div>
        </div>
    );
}
