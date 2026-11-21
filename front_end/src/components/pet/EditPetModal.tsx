import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import Button from "../button";
import { useAuth } from "../../hooks/useAuth";
import type { ActionResult, Post, PostQuery } from "../../services/petService";
import { MAX_IMAGE_BYTES } from "../../utils";

interface EditPetModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Resolves with the outcome; the dialog only closes on success. */
    onSubmit: (data: PostQuery) => Promise<ActionResult>;
    post: Post;
}

const inputClass =
    "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ring-none outline-none px-2.5 py-2 border";

export default function EditPetModal({ isOpen, onClose, onSubmit, post }: EditPetModalProps) {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Shown inside the dialog: the dialog makes the rest of the page inert, so a toast
    // alone would not reach screen readers.
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        petName: "",
        petType: "",
        description: "",
        image: null as File | null,
    });

    useEffect(() => {
        setFormData({
            title: post.title ?? "",
            petName: post.petName ?? "",
            petType: post.petType ?? "",
            description: post.description ?? "",
            image: null,
        });
    }, [post]);

    const close = () => {
        if (isSubmitting) return;
        setSubmitError(null);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || isSubmitting) return;

        setIsSubmitting(true);
        setSubmitError(null);
        const result = await onSubmit({
            userId: user.id,
            title: formData.title,
            petName: formData.petName,
            petType: formData.petType,
            description: formData.description,
            image: formData.image,
        });
        setIsSubmitting(false);

        if (result.success) onClose();
        else setSubmitError(result.message);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (file && file.size > MAX_IMAGE_BYTES) {
            setSubmitError("Fotoğraf en fazla 5 MB olabilir.");
            e.target.value = "";
            setFormData((prev) => ({ ...prev, image: null }));
            return;
        }
        setSubmitError(null);
        setFormData((prev) => ({ ...prev, image: file }));
    };

    const setField = (field: "title" | "petName" | "petType" | "description") =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setFormData((prev) => ({ ...prev, [field]: e.target.value }));

    return (
        <Dialog open={isOpen} onClose={close} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-md rounded bg-white p-6 w-full">
                    <Dialog.Title className="text-lg font-medium mb-4">İlanı Düzenle</Dialog.Title>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700">
                                İlan Başlığı
                            </label>
                            <input id="edit-title" type="text" required maxLength={100}
                                value={formData.title} onChange={setField("title")} className={inputClass} />
                        </div>

                        <div>
                            <label htmlFor="edit-pet-name" className="block text-sm font-medium text-gray-700">
                                Evcil Hayvan Adı
                            </label>
                            <input id="edit-pet-name" type="text" required maxLength={50}
                                value={formData.petName} onChange={setField("petName")} className={inputClass} />
                        </div>

                        <div>
                            <label htmlFor="edit-pet-type" className="block text-sm font-medium text-gray-700">
                                Evcil Hayvan Türü
                            </label>
                            <input id="edit-pet-type" type="text" required maxLength={50}
                                value={formData.petType} onChange={setField("petType")} className={inputClass} />
                        </div>

                        <div>
                            <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                                Açıklama
                            </label>
                            <textarea id="edit-description" required maxLength={1000} rows={3}
                                value={formData.description} onChange={setField("description")} className={inputClass} />
                        </div>

                        <div>
                            <label htmlFor="edit-image" className="block text-sm font-medium text-gray-700">
                                Yeni Fotoğraf (opsiyonel)
                            </label>
                            <input
                                id="edit-image"
                                type="file"
                                accept="image/png,image/jpeg,image/gif"
                                onChange={handleImageChange}
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                            <p className="text-xs text-gray-500 mt-1">JPG, PNG veya GIF · en fazla 5 MB</p>
                        </div>

                        {submitError && (
                            <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                                {submitError}
                            </p>
                        )}

                        <div className="flex justify-end gap-4">
                            <Button type="button" onClick={close} disabled={isSubmitting}
                                classNames="!bg-gray-100 !text-gray-900 hover:!bg-gray-200">
                                İptal
                            </Button>
                            <Button type="submit" disabled={isSubmitting} classNames="disabled:!bg-gray-400">
                                {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                            </Button>
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
