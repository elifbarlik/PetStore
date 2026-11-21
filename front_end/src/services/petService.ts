import axios, { AxiosError } from "axios";
import { API_URL } from "../utils";
import type { User } from "../features/auth/authSlice";

export interface Post {
    postId: number;
    userId: string;
    user: User;
    title: string;
    petName: string;
    petType: string;
    description: string;
    isAdopted: boolean;
    postTime: string;
    postLatitude: number | null;
    postLongitude: number | null;
    imageUrl: string;
    imageLocalPath: string;
}

export interface PostQuery {
    userId: string;
    title: string;
    petName: string;
    petType: string;
    description: string;
    /** Optional on update (keeps the current photo); required by the create form. */
    image: File | null;
}

/** Outcome of a write operation, with a message that can be shown to the user. */
export interface ActionResult {
    success: boolean;
    message: string;
}

interface ApiEnvelope<T> {
    result: T | null;
    isSuccess: boolean;
    statusCode: number;
    message: string;
}

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

const toActionResult = (
    data: ApiEnvelope<unknown>,
    fallback: string,
): ActionResult => ({
    success: Boolean(data?.isSuccess),
    message: data?.message || fallback,
});

const errorResult = (err: unknown, fallback: string): ActionResult => {
    const error = err as AxiosError<ApiEnvelope<unknown>>;
    if (!error.response) {
        return { success: false, message: "Sunucuya ulaşılamadı. Bağlantınızı kontrol edin." };
    }
    return { success: false, message: error.response.data?.message || fallback };
};

const getResult = async <T>(url: string, label: string): Promise<T | null> => {
    try {
        const { data } = await axios.get<ApiEnvelope<T>>(url);
        return data.isSuccess ? data.result : null;
    } catch (error) {
        const status = (error as AxiosError).response?.status;
        if (status !== 404) console.error(`${label} error:`, error);
        return null;
    }
};

export const getUserPosts = (userId: string): Promise<Post[] | null> =>
    getResult<Post[]>(`${API_URL}/post/GetPostsByUserId/${encodeURIComponent(userId)}`, "getUserPosts");

export const getAllPosts = (): Promise<Post[] | null> =>
    getResult<Post[]>(`${API_URL}/post/GetAllPosts`, "getAllPosts");

export const getPostById = (postId: number): Promise<Post | null> =>
    getResult<Post>(`${API_URL}/post/GetPostById/${postId}`, "getPostById");

/**
 * The API binds the scalar fields from the query string and the photo from multipart form
 * data. Only the fields the backend reads are sent.
 */
const buildPostRequest = (data: PostQuery, endpoint: string, postId?: number) => {
    const url = new URL(`${API_URL}/post/${endpoint}`);
    if (postId !== undefined) url.searchParams.set("PostId", String(postId));
    url.searchParams.set("UserId", data.userId);
    url.searchParams.set("Title", data.title.trim());
    url.searchParams.set("PetName", data.petName.trim());
    url.searchParams.set("PetType", data.petType.trim());
    url.searchParams.set("Description", data.description.trim());

    const formData = new FormData();
    if (data.image) formData.append("Image", data.image);
    return { url: url.toString(), formData };
};

export const createPost = async (data: PostQuery, token: string): Promise<ActionResult> => {
    const { url, formData } = buildPostRequest(data, "CreatePost");
    try {
        const { data: body } = await axios.post(url, formData, { headers: authHeader(token) });
        return toActionResult(body, "İlan oluşturuldu.");
    } catch (error) {
        return errorResult(error, "İlan oluşturulamadı.");
    }
};

export const updatePost = async (
    data: PostQuery,
    postId: number,
    token: string,
): Promise<ActionResult> => {
    const { url, formData } = buildPostRequest(data, "UpdatePost", postId);
    try {
        const { data: body } = await axios.put(url, formData, { headers: authHeader(token) });
        return toActionResult(body, "İlan güncellendi.");
    } catch (error) {
        return errorResult(error, "İlan güncellenemedi.");
    }
};

export const deletePost = async (postId: number, token: string): Promise<ActionResult> => {
    try {
        const { data } = await axios.delete(`${API_URL}/post/DeletePost/${postId}`, {
            headers: authHeader(token),
        });
        return toActionResult(data, "İlan silindi.");
    } catch (error) {
        return errorResult(error, "İlan silinemedi.");
    }
};

export const adoptPet = async (postId: number, token: string): Promise<ActionResult> => {
    try {
        const { data } = await axios.post(`${API_URL}/post/AdoptPost/${postId}`, {}, {
            headers: authHeader(token),
        });
        return toActionResult(data, "Sahiplenme başarılı.");
    } catch (error) {
        return errorResult(error, "Sahiplenme işlemi başarısız oldu.");
    }
};

export const cancelAdoption = async (postId: number, token: string): Promise<ActionResult> => {
    try {
        const { data } = await axios.post(`${API_URL}/post/CancelAdoption/${postId}`, {}, {
            headers: authHeader(token),
        });
        return toActionResult(data, "Sahiplenme iptal edildi.");
    } catch (error) {
        return errorResult(error, "Sahiplenme iptal edilemedi.");
    }
};
