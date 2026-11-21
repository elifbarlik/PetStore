import { useState } from "react";
import { Dialog } from "@headlessui/react";
import Button from "../button";
import { useAuth } from "../../hooks/useAuth";
import type { ActionResult, PostQuery } from "../../services/petService";
import { generateDescription } from "../../services/aiService";
import { MAX_IMAGE_BYTES } from "../../utils";

interface AddPetModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Resolves with the outcome; the dialog only closes on success. */
    onSubmit: (data: PostQuery) => Promise<ActionResult>;
}

const emptyForm = {
    title: "",
    petName: "",
    petType: "",
    description: "",
    image: null as File | null,
};

const inputClass =
    "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ring-none outline-none px-2.5 py-2 border";

export default function AddPetModal({ isOpen, onClose, onSubmit }: AddPetModalProps) {
    const { user } = useAuth();
    const [formData, setFormData] = useState(emptyForm);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Shown inside the dialog: the dialog makes the rest of the page inert, so a toast
    // alone would not reach screen readers.
    const [submitError, setSubmitError] = useState<string | null>(null);
    // Remount the file input after a successful submit so it is really cleared
    const [fileInputKey, setFileInputKey] = useState(0);

    const canGenerate = formData.petType.trim() !== "" && formData.petName.trim() !== "";

    const fetchDescription = async () => {
        if (!canGenerate) return;

        setIsGenerating(true);
        const response = await generateDescription(formData.petType.trim(), formData.petName.trim());
        setIsGenerating(false);

        if (response?.description) {
            setFormData((prev) => ({ ...prev, description: response.description }));
        } else {
            setSubmitError("Açıklama şu anda üretilemedi. Lütfen kendiniz yazın veya daha sonra tekrar deneyin.");
        }
    };

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

        if (result.success) {
            setFormData(emptyForm);
            setFileInputKey((k) => k + 1);
            onClose();
        } else {
            setSubmitError(result.message);
        }
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
                    <Dialog.Title className="text-lg font-medium mb-4">Yeni İlan Ekle</Dialog.Title>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="add-title" className="block text-sm font-medium text-gray-700">
                                İlan Başlığı
                            </label>
                            <input
                                id="add-title"
                                type="text"
                                required
                                maxLength={100}
                                data-testid="pet-title-input"
                                value={formData.title}
                                onChange={setField("title")}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label htmlFor="add-pet-name" className="block text-sm font-medium text-gray-700">
                                Evcil Hayvan Adı
                            </label>
                            <input
                                id="add-pet-name"
                                type="text"
                                required
                                maxLength={50}
                                data-testid="pet-name-input"
                                value={formData.petName}
                                onChange={setField("petName")}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label htmlFor="add-pet-type" className="block text-sm font-medium text-gray-700">
                                Evcil Hayvan Türü
                            </label>
                            <input
                                id="add-pet-type"
                                type="text"
                                required
                                maxLength={50}
                                data-testid="pet-type-input"
                                value={formData.petType}
                                onChange={setField("petType")}
                                className={inputClass}
                            />
                            {isGenerating && (
                                <p className="text-sm text-gray-500 mt-1">Açıklama oluşturuluyor...</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="add-description" className="block text-sm font-medium text-gray-700">
                                Açıklama
                            </label>
                            <button
                                type="button"
                                onClick={fetchDescription}
                                disabled={isGenerating || !canGenerate}
                                title={canGenerate ? undefined : "Önce hayvan adı ve türünü girin"}
                                className="text-sm text-blue-600 hover:underline mt-1 disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                            >
                                {isGenerating ? "Yükleniyor..." : "AI ile üret"}
                            </button>

                            <textarea
                                id="add-description"
                                required
                                maxLength={1000}
                                data-testid="pet-description-textarea"
                                value={formData.description}
                                onChange={setField("description")}
                                rows={3}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label htmlFor="add-image" className="block text-sm font-medium text-gray-700">
                                Fotoğraf
                            </label>
                            <input
                                key={fileInputKey}
                                id="add-image"
                                type="file"
                                required
                                accept="image/png,image/jpeg,image/gif"
                                data-testid="pet-image-input"
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
                            <Button
                                type="button"
                                onClick={close}
                                disabled={isSubmitting}
                                classNames="!bg-gray-100 !text-gray-900 hover:!bg-gray-200"
                            >
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
