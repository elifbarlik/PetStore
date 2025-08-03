import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

export const useAuth = () => {
    const { user, token } = useSelector((state: RootState) => state.auth);

    return {
        isAuth: Boolean(token),
        user,
        token,
    };
};
