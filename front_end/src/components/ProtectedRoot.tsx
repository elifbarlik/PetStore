import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

type ProtectedRouteProps = {
    redirectPath?: string;
    children: React.ReactNode;
};

export default function ProtectedRoute({
    redirectPath = "/auth/login",
    children,
}: ProtectedRouteProps) {
    const { isAuth } = useAuth();

    if (!isAuth) {
        return <Navigate to={redirectPath} />;
    }

    return children;
}
