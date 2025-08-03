import axios from "axios";
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
        const { data } = await axios.post(AI_URL + "/generate-description", {
            type: type,
            breed: breed,
        });

        if (data) return data;
        return null;
    } catch (error) {
        console.error("generateDescription error: ", error);
        return null;
    }
};

export const recommendPet = async (
    preferences: string,
): Promise<RecommendPet | null> => {
    try {
        const { data } = await axios.post(AI_URL + "/recommend-pet", {
            preferences,
        });

        if (data) return data;
        return null;
    } catch (error) {
        console.error("recommendPet error: ", error);

        return null;
    }
};
