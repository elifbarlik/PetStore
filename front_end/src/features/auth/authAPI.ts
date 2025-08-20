import axios, { AxiosError } from "axios";
import type { User } from "./authSlice";
import { API_URL } from "../../utils";
import { auth } from "../../services/firebase";
import { signInWithCustomToken } from "firebase/auth";

interface LoginResponse {
    result: {
        user: User;
        token: string;
    };
    isSuccess: boolean;
    statusCode: number;
    message: string;
}

interface RegisterResponse {
    result: User;
    isSuccess: boolean;
    statusCode: number;
    message: string;
}

export const loginAPI = async (credentials: {
    userName: string;
    password: string;
}): Promise<{ token: string; user: User }> => {
    const URL = API_URL + "/user/Login";

    try {
        const { data } = await axios.post<LoginResponse>(URL, credentials);

        if (data.isSuccess && data.result) {
            // Exchange backend token for Firebase custom token to enable Firestore auth rules
            try {
                const { data: custom } = await axios.post<{ token: string }>(
                    API_URL + "/auth/firebase/custom-token",
                    {},
                    { headers: { Authorization: `Bearer ${data.result.token}` } },
                );
                if (custom?.token) {
                    await signInWithCustomToken(auth, custom.token);
                }
            } catch (e) {
                // Non-fatal: Firestore may be open rules during dev
                console.warn("Failed to sign in to Firebase with custom token", e);
            }

            return {
                token: data.result.token,
                user: data.result.user,
            };
        }

        throw new Error(data.message || "Bir hata oluştu");
    } catch (err) {
        const error = err as AxiosError<{ message: string }>;

        const message = error.response?.data?.message || "Bir hata oluştu";

        throw new Error(message);
    }
};

export const registerAPI = async (formData: {
    name: string;
    surname: string;
    email: string;
    userName: string;
    password: string;
}): Promise<{ user: User }> => {
    const URL = API_URL + "/user/Register";

    try {
        const { data } = await axios.post<RegisterResponse>(URL, formData);

        if (data.isSuccess && data.result) {
            return {
                user: data.result,
            };
        }

        throw new Error(data.message || "Bir hata oluştu");
    } catch (err) {
        const error = err as AxiosError<{ message: string }>;

        const message = error.response?.data?.message || "Bir hata oluştu";

        throw new Error(message);
    }
};
