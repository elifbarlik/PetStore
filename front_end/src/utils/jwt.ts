/** Returns true when the JWT is malformed or its `exp` claim is in the past. */
export const isTokenExpired = (token: string, skewSeconds = 30): boolean => {
    try {
        const payload = token.split(".")[1];
        const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
        const { exp } = JSON.parse(json) as { exp?: number };
        if (typeof exp !== "number") return false;
        return exp * 1000 <= Date.now() + skewSeconds * 1000;
    } catch {
        return true;
    }
};
