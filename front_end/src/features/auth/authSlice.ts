import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loginAPI, registerAPI } from "./authAPI";
import { isTokenExpired } from "../../utils/jwt";

export interface User {
    id: string;
    name: string;
    surname: string;
    email: string;
    userName: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
}

const clearStoredSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};

// Restore the session only if the stored token is still valid and the user is readable.
const loadSession = (): { token: string | null; user: User | null } => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!storedToken || !storedUser || isTokenExpired(storedToken)) {
        clearStoredSession();
        return { token: null, user: null };
    }
    try {
        return { token: storedToken, user: JSON.parse(storedUser) as User };
    } catch {
        clearStoredSession();
        return { token: null, user: null };
    }
};

const { token, user } = loadSession();

const initialState: AuthState = {
    user: user || null,
    token: token || null,
    status: "idle",
    error: null,
};

export const login = createAsyncThunk(
    "auth/login",
    async (credentials: { userName: string; password: string }, thunkAPI) => {
        try {
            return await loginAPI(credentials);
        } catch (error) {
            if (error instanceof Error) {
                return thunkAPI.rejectWithValue(error.message);
            }
            return thunkAPI.rejectWithValue("Bilinmeyen bir hata oluştu");
        }
    },
);

export const register = createAsyncThunk(
    "auth/register",
    async (
        credentials: {
            name: string;
            surname: string;
            email: string;
            userName: string;
            password: string;
        },
        thunkAPI,
    ) => {
        try {
            return await registerAPI(credentials);
        } catch (error) {
            if (error instanceof Error) {
                return thunkAPI.rejectWithValue(error.message);
            }
            return thunkAPI.rejectWithValue("Bilinmeyen bir hata oluştu");
        }
    },
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        logout: (state) => {
            clearStoredSession();
            state.error = null;
            state.status = "idle";
            state.user = null;
            state.token = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // succes
        builder.addCase(login.fulfilled, (state, action) => {
            state.token = action.payload.token;
            state.user = action.payload.user;
            localStorage.setItem("token", action.payload.token);
            localStorage.setItem("user", JSON.stringify(action.payload.user));
            state.error = null;
            state.status = "succeeded";
        });

        // Registration does not log the user in (no token), so the session is left untouched.
        builder.addCase(register.fulfilled, (state) => {
            state.error = null;
            state.status = "succeeded";
        });

        // reject
        builder.addCase(login.rejected, (state, action) => {
            state.error = action.payload as string;
            state.status = "failed";
        });
        builder.addCase(register.rejected, (state, action) => {
            state.error = action.payload as string;
            state.status = "failed";
        });

        // loading
        builder.addCase(login.pending, (state) => {
            state.status = "loading";
        });
        builder.addCase(register.pending, (state) => {
            state.status = "loading";
        });
    },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
