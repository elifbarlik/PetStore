import { Route, Routes } from "react-router";
import RootLayout from "./pages/RootLayout";
import Home from "./pages/home";
import NotFound from "./pages/not-found";
import Login from "./pages/auth/login";
import PetList from "./pages/PetList";
import Register from "./pages/auth/register";
import ProfileLayout from "./pages/profile/ProfileLayout";
import Profile from "./pages/profile/profile";
import ProtectedRoute from "./components/ProtectedRoot";
import PetDetail from "./pages/pet/PetDetail";

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
