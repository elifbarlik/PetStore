import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loginAPI, registerAPI } from "./authAPI";

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

const token = localStorage.getItem("token");
const _user = localStorage.getItem("user");
let user = null;
if (_user) {
    user = JSON.parse(_user);
}

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
            localStorage.removeItem("token");
            state.error = null;
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

        builder.addCase(register.fulfilled, (state, action) => {
            state.user = action.payload.user;
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
