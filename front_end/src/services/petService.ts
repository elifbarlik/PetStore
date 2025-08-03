import axios from "axios";
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
    user: User;
    title: string;
    petName: string;
    petType: string;
    description: string;
    isAdopted: boolean;
    image: File;
}

export const getUserPosts = async (userId: string): Promise<Post[] | null> => {
    const URL = API_URL + "/post/GetPostsByUserId/" + userId;

    try {
        const { data } = await axios.get(URL);

        if (data.isSuccess && data.result) {
            return data.result;
        }

        return null;
    } catch (error) {
        console.error("getUserPosts error:", error);
        return null;
    }
};

export const getAllPosts = async (): Promise<Post[] | null> => {
    const URL = API_URL + "/post/GetAllPosts";

    try {
        const { data } = await axios.get(URL);

        if (data.isSuccess && data.result) {
            return data.result;
        }

        return null;
    } catch (error) {
        console.error("getAllPosts error:", error);
        return null;
    }
};

export const getPostById = async (postId: number): Promise<Post | null> => {
    const URL = API_URL + "/post/GetPostById/" + postId;

    try {
        const { data } = await axios.get(URL);

        if (data.isSuccess && data.result) {
            return data.result;
        }

        return null;
    } catch (error) {
        console.error("getPostById error:", error);
        return null;
    }
};

export const createPost = async (
    data: PostQuery,
    token: string,
): Promise<boolean> => {
    const baseUrl = API_URL + "/post/CreatePost";

    const formData = new FormData();
    if (data.image) formData.append("Image", data.image);

    const url = new URL(baseUrl);
    url.searchParams.set("UserId", data.userId);
    url.searchParams.set("User.Id", data.userId);
    url.searchParams.set("User.Name", data.user.name);
    url.searchParams.set("User.Surname", data.user.surname);
    url.searchParams.set("User.Email", data.user.email);
    url.searchParams.set("User.UserName", data.user.userName);
    url.searchParams.set("Title", data.title);
    url.searchParams.set("PetName", data.petName);
    url.searchParams.set("PetType", data.petType);
    url.searchParams.set("Description", data.description);
    url.searchParams.set("IsAdopted", data.isAdopted.toString());

    try {
        const { data } = await axios.post(url.toString(), formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${token}`,
            },
        });

        return data.isSuccess;
    } catch (error) {
        console.error("createPost error:", error);
        return false;
    }
};

export const updatePost = async (
    data: PostQuery,
    postId: string,
    token: string,
): Promise<boolean> => {
    const baseUrl = API_URL + "/post/UpdatePost/";

    const formData = new FormData();
    if (data.image) formData.append("Image", data.image);

    const url = new URL(baseUrl);
    url.searchParams.set("PostId", postId);
    url.searchParams.set("UserId", data.userId);
    url.searchParams.set("User.Id", data.userId);
    url.searchParams.set("User.Name", data.user.name);
    url.searchParams.set("User.Surname", data.user.surname);
    url.searchParams.set("User.Email", data.user.email);
    url.searchParams.set("User.UserName", data.user.userName);
    url.searchParams.set("Title", data.title);
    url.searchParams.set("PetName", data.petName);
    url.searchParams.set("PetType", data.petType);
    url.searchParams.set("Description", data.description);
    url.searchParams.set("IsAdopted", data.isAdopted.toString());

    try {
        const { data } = await axios.put(url.toString(), formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${token}`,
            },
        });

        return data.isSuccess;
    } catch (error) {
        console.error("updatePost error:", error);
        return false;
    }
};

export const deletePost = async (
    postId: number,
    token: string,
): Promise<boolean> => {
    const URL = API_URL + "/post/DeletePost/" + postId;

    try {
        const { data } = await axios.delete(URL, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return data.isSuccess;
    } catch (error) {
        console.error("deletePost error:", error);
        return false;
    }
};

export const adoptPet = async (
    postId: number,
    token: string,
): Promise<boolean> => {
    const URL = API_URL + "/post/AdoptPost/" + postId;

    try {
        const { data } = await axios.post(
            URL,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        return data.isSuccess;
    } catch (error) {
        console.error("adoptPet error:", error);
        return false;
    }
};
