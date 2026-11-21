import axios from "axios";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { logout } from "../features/auth/authSlice";
import type { AppDispatch } from "../store/store";
import { auth } from "./firebase";

/** Clears the backend session AND the Firebase session (chat) so the next user starts clean. */
export const endSession = (dispatch: AppDispatch) => {
    dispatch(logout());
    signOut(auth).catch(() => {
        /* Firebase may not be signed in; nothing to do */
    });
};

let interceptorInstalled = false;

/**
 * If an authenticated request comes back 401 (token expired or revoked), end the session
 * once and tell the user, instead of leaving the UI in a "logged in but broken" state.
 */
export const installAuthInterceptor = (dispatch: AppDispatch) => {
    if (interceptorInstalled) return;
    interceptorInstalled = true;

    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            const sentToken = Boolean(error?.config?.headers?.Authorization);
            if (error?.response?.status === 401 && sentToken && localStorage.getItem("token")) {
                endSession(dispatch);
                toast.info("Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.", {
                    toastId: "session-expired",
                });
            }
            return Promise.reject(error);
        },
    );
};
