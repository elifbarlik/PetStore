import axios, { AxiosError } from "axios";
import { AI_URL } from "../utils";

interface GenerateDescription {
    description: string;
}

interface RecommendPet {
    recommendation: string;
}

const baseUrl = () => AI_URL.replace(/\/+$/, "");

const logError = (label: string, err: unknown) => {
    const error = err as AxiosError<unknown>;
    console.error(`${label} error:`, error.response?.status, error.response?.data || error.message);
};

/** Generates a listing description from the pet's type (e.g. "Kedi") and its name. */
export const generateDescription = async (
    type: string,
    name: string,
): Promise<GenerateDescription | null> => {
    try {
        const { data } = await axios.post<GenerateDescription>(
            `${baseUrl()}/generate-description`,
            { type, name },
            { timeout: 30_000 },
        );
        return data?.description ? data : null;
    } catch (err) {
        logError("generateDescription", err);
        return null;
    }
};

export const recommendPet = async (preferences: string): Promise<RecommendPet | null> => {
    try {
        const { data } = await axios.post<RecommendPet>(
            `${baseUrl()}/recommend-pet`,
            { preferences },
            { timeout: 30_000 },
        );
        return data?.recommendation ? data : null;
    } catch (err) {
        logError("recommendPet", err);
        return null;
    }
};
