import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import Button from "../button";
import { useAuth } from "../../hooks/useAuth";
import type { Post, PostQuery } from "../../services/petService";

interface EditPetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: PostQuery) => void;
    post: Post;
}

export default function EditPetModal({
    isOpen,
    onClose,
    onSubmit,
    post,
}: EditPetModalProps) {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: "",
        petName: "",
        petType: "",
        description: "",
        image: null as File | null,
    });

    useEffect(() => {
        if (post) {
            setFormData({
                title: post.title,
                petName: post.petName,
                petType: post.petType,
                description: post.description,
                image: null,
            });
        }
    }, [post]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const postData: PostQuery = {
            userId: user.id,
            user: {
                id: user.id,
                name: user.name,
                surname: user.surname,
                email: user.email,
                userName: user.userName,
            },
            title: formData.title,
            petName: formData.petName,
            petType: formData.petType,
            description: formData.description,
            isAdopted: post.isAdopted,
            image: formData.image as File,
        };

        onSubmit(postData);
        onClose();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData((prev) => ({
                ...prev,
                image: e.target.files![0],
            }));
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-md rounded bg-white p-6 w-full">
                    <Dialog.Title className="text-lg font-medium mb-4">
                        İlanı Düzenle
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                İlan Başlığı
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        title: e.target.value,
                                    }))
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ring-none outline-none px-2.5 py-2 border"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Evcil Hayvan Adı
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.petName}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        petName: e.target.value,
                                    }))
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ring-none outline-none px-2.5 py-2 border"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Evcil Hayvan Türü
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.petType}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        petType: e.target.value,
                                    }))
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ring-none outline-none px-2.5 py-2 border"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Açıklama
                            </label>
                            <textarea
                                required
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        description: e.target.value,
                                    }))
                                }
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ring-none outline-none px-2.5 py-2 border"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Yeni Fotoğraf (opsiyonel)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                onClick={onClose}
                                classNames="!bg-gray-100 !text-gray-900 hover:!bg-gray-200"
                            >
                                İptal
                            </Button>
                            <Button type="submit">Kaydet</Button>
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
