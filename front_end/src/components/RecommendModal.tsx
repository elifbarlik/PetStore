import { X } from "lucide-react";
import React, { useState } from "react";
import { recommendPet } from "../services/aiService";

interface RecomendModalProps {
    isModalOpen: boolean;
    setIsModalOpen: (value: boolean) => void;
}

export default function RecomendModal({
    isModalOpen,
    setIsModalOpen,
}: RecomendModalProps) {
    const [recommend, setRecommend] = useState("");
    const [data, setData] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const close = () => {
        setIsModalOpen(false);
        setRecommend("");
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!recommend) return;

        setIsLoading(true);

        const res = await recommendPet(recommend);
        if (res?.recommendation) setData(res.recommendation);
        setIsLoading(false);
    };

    return (
        <div
            className={`fixed inset-0 w-full h-full z-50 flex-center ${
                !isModalOpen && "hidden"
            }`}
        >
            <div
                className="fixed inset-0 w-full h-full bg-black/40"
                onClick={close}
            />

            <div className="relative w-full mx-12 max-w-[600px] bg-background rounded-lg py-12 px-8">
                <button
                    onClick={close}
                    className="cursor-pointer absolute right-2 top-2 hover:text-primary transition-colors"
                >
                    <X size={32} />
                </button>

                <h2 className="text-2xl text-primary text-center font-medium mb-6">
                    AI ile Öneri Alın
                </h2>

                <form onSubmit={submit}>
                    <div className="space-y-2">
                        <label htmlFor="recommend">Tercihleriniz</label>
                        <input
                            required
                            name="recommend"
                            value={recommend}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ring-none outline-none px-2.5 py-2 border"
                            onChange={(e) => {
                                setRecommend(e.target.value);
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`
                w-full py-3 px-4 rounded-full font-medium text-white
                transition-all duration-200 transform my-6 
                ${
                    isLoading
                        ? "bg-gray-400 !cursor-not-allowed"
                        : "bg-primary hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                }
              `}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Öneri Oluşturuluyor...</span>
                            </div>
                        ) : (
                            "Öneri Al"
                        )}
                    </button>
                </form>

                {data && (
                    <div className="mt-4">
                        <h4 className="text-primary text-lg mb-2 text-center border-b pb-2">
                            AI Önerisi
                        </h4>
                        <p className="text-copy-80 indent-2 text-justify">
                            {data}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
