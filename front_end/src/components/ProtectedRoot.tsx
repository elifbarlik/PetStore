import { Navigate, useLocation } from "react-router";
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
    const location = useLocation();

    if (!isAuth) {
        // replace: "back" must not bounce into the protected page again;
        // from: login returns the user to the page they wanted
        return <Navigate to={redirectPath} replace state={{ from: location.pathname }} />;
    }

    return children;
}
