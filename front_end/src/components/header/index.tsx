import { useState } from "react";
import { useDispatch } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import { useAuth } from "../../hooks/useAuth";
import Button from "../button";
import Logo from "../logo";
import Navbar from "./navbar";
import { UserCircle2, Menu, X, LogOut } from "lucide-react";
import type { AppDispatch } from "../../store/store";

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { isAuth } = useAuth();
    const dispatch = useDispatch<AppDispatch>();

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleLogout = () => {
        dispatch(logout());
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            <header className="containerx py-4 flex justify-between items-center bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
                <Logo isLink />

                <div className="hidden lg:flex">
                    <Navbar />
                </div>

                <div className="hidden md:flex items-center gap-3">
                    {isAuth ? (
                        <div className="flex items-center gap-2">
                            <Button
                                isLink
                                href="/profile"
                                classNames="!flex items-center gap-2 !py-2 !px-4 !bg-gray-100 !text-gray-700 hover:!bg-gray-200"
                            >
                                <UserCircle2 size={18} />
                                <span className="font-medium">Profil</span>
                            </Button>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-full transition-colors font-medium"
                            >
                                <LogOut size={18} />
                                Çıkış Yap
                            </button>
                        </div>
                    ) : (
                        <Button
                            isLink
                            href="/auth/login"
                            classNames="!py-2 !px-6"
                        >
                            Giriş Yap
                        </Button>
                    )}
                </div>

                <button
                    onClick={toggleMobileMenu}
                    className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="Menu"
                >
                    {isMobileMenuOpen ? (
                        <X size={24} className="text-gray-700" />
                    ) : (
                        <Menu size={24} className="text-gray-700" />
                    )}
                </button>
            </header>

            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Menu */}
            <div
                className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
                    isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
                } shadow-2xl`}
            >
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center p-6 border-b border-gray-100">
                        <Logo isLink />
                        <button
                            onClick={toggleMobileMenu}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X size={24} className="text-gray-700" />
                        </button>
                    </div>

                    <div className="flex-1 px-6 py-4">
                        <div className="mb-6">
                            <Navbar />
                        </div>

                        <div className="space-y-3 pt-4 border-t border-gray-100">
                            {isAuth ? (
                                <>
                                    <Button
                                        isLink
                                        href="/profile"
                                        classNames="!w-full !flex items-center justify-center gap-3 !py-3 !bg-gray-100 !text-gray-700 hover:!bg-gray-200"
                                    >
                                        <UserCircle2 size={20} />
                                        <span className="font-medium">
                                            Profil
                                        </span>
                                    </Button>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center gap-3 px-6 py-3 text-red-600 hover:bg-red-50 rounded-full transition-colors font-medium border border-red-200"
                                    >
                                        <LogOut size={20} />
                                        Çıkış Yap
                                    </button>
                                </>
                            ) : (
                                <Button
                                    isLink
                                    href="/auth/login"
                                    classNames="!w-full !py-3"
                                >
                                    Giriş Yap
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 text-center text-sm text-gray-500">
                        © 2025 Tüm hakları saklıdır
                    </div>
                </div>
            </div>
        </>
    );
}
