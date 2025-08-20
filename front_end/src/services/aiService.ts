import axios, { AxiosError } from "axios";
import { AI_URL } from "../utils";

interface GenerateDescription {
    description: string;
}

interface RecommendPet {
    recommendation: string;
}

export const generateDescription = async (
    type: string,
    breed: string,
): Promise<GenerateDescription | null> => {
    try {
        const baseUrl = AI_URL.replace(/\/+$/, "");
        const { data } = await axios.post(`${baseUrl}/generate-description`, {
            type: type,
            breed: breed,
        });

        if (data) return data;
        return null;
    } catch (err) {
        const error = err as AxiosError<any>;
        console.error(
            "generateDescription error:",
            error.response?.status,
            error.response?.data || error.message,
        );
        return null;
    }
};

export const recommendPet = async (
    preferences: string,
): Promise<RecommendPet | null> => {
    try {
        const baseUrl = AI_URL.replace(/\/+$/, "");
        const { data } = await axios.post(`${baseUrl}/recommend-pet`, {
            preferences,
        });

        if (data) return data;
        return null;
    } catch (err) {
        const error = err as AxiosError<any>;
        console.error(
            "recommendPet error:",
            error.response?.status,
            error.response?.data || error.message,
        );

        return null;
    }
};
