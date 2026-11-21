import { Suspense } from "react";
import { Outlet } from "react-router";
import Header from "../components/header";
import Footer from "../components/footer";
import { ToastContainer } from "react-toastify";

export default function RootLayout() {
    return (
        <>
            <Header />
            <main>
                <Suspense
                    fallback={
                        <div className="containerx py-12 flex justify-center" role="status" aria-label="Yükleniyor">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
                        </div>
                    }
                >
                    <Outlet />
                </Suspense>
            </main>
            <Footer />
            <ToastContainer />
        </>
    );
}
