import Button from "../components/button";
import catImg from "../assets/images/cat.png";

export default function NotFound() {
    return (
        <section className="min-h-screen flex flex-col justify-center items-center text-center px-4 bg-[#faf9f6]">
            <img
                src={catImg}
                alt="Kayıp kedi görseli"
                className="w-40 h-40 object-contain mb-6 drop-shadow-lg"
            />
            <h1 className="text-4xl font-bold mb-2 text-primary">404 - Sayfa Bulunamadı</h1>
            <p className="text-copy/70 mb-6 max-w-md">
                Aradığınız sayfa bulunamadı veya taşınmış olabilir.
            </p>
            <Button isLink href="/" className="mt-2">
                Ana Sayfaya Dön
            </Button>
        </section>
    );
}
