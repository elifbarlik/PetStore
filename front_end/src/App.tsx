import { lazy } from "react";
import { Route, Routes } from "react-router";
import RootLayout from "./pages/RootLayout";
import Home from "./pages/home";
import NotFound from "./pages/not-found";
import PetList from "./pages/PetList";
import ProfileLayout from "./pages/profile/ProfileLayout";
import ProtectedRoute from "./components/ProtectedRoot";

// Route-level code splitting: these pages are only downloaded when visited
const Login = lazy(() => import("./pages/auth/login"));
const Register = lazy(() => import("./pages/auth/register"));
const Profile = lazy(() => import("./pages/profile/profile"));
const PetDetail = lazy(() => import("./pages/pet/PetDetail"));
const ChatList = lazy(() => import("./pages/chat/ChatList"));
const ChatRoom = lazy(() => import("./pages/chat/ChatRoom"));

function App() {
    return (
        <Routes>
            <Route path="/" element={<RootLayout />}>
                <Route index element={<Home />} />

                <Route path="ilanlar" element={<PetList />} />
                <Route path="/ilan/:id" element={<PetDetail />} />

                <Route path="auth/login" element={<Login />} />
                <Route path="auth/register" element={<Register />} />
                <Route
                    path="/chat"
                    element={
                        <ProtectedRoute>
                            <ProfileLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<ChatList />} />
                    <Route path=":id" element={<ChatRoom />} />
                </Route>

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <ProfileLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Profile />} />
                </Route>

                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    );
}

export default App;
