import { AlarmClock, LayoutGrid, Sparkles } from "lucide-react";
import Button from "../components/button";
import { Link } from "react-router";
import { IMAGES } from "../constants/index";
import { useState } from "react";
import RecomendModal from "../components/RecommendModal";

export default function Home() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <RecomendModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
            />

            {/* Hero */}
            <section className="containerx flex-center max-md:flex-col-reverse  mt-6">
                <div className="flex-1 space-y-8 max-md:text-center">
                    <h1 className="text-6xl font-medium leading-20">
                        Sadece Bir Evcil Hayvan Değil, <br />
                        <span className="text-primary font-payton-one">
                            Bir Aile Üyesi.
                        </span>
                    </h1>

                    <p className="md:max-w-[45ch] text-copy/70">
                        Lorem ipsum dolor sit, amet consectetur adipisicing
                        elit. Adipisci asperiores delectus voluptatum sit ipsum
                        eaque officia, fugit vitae autem odit harum quia
                        assumenda ratione! Exercitationem aliquid qui soluta
                        nihil sunt.
                    </p>

                    <Button isLink href="/ilanlar" className="px-18">
                        Göz At
                    </Button>
                </div>

                <div className="flex-1">
                    <img
                        src={IMAGES.heroImg}
                        alt="Dog and Cat Image"
                        className="object-cover w-full"
                    />
                </div>
            </section>

            {/* Feature */}
            <section className="my-32 px-12 py-8 containerx bg-foreground rounded-lg flex max-md:flex-col-reverse md:justify-between justify-center max-md:text-center items-center md:h-[300px]">
                <div className="space-y-4 md:w-2/3">
                    <h2 className="text-4xl font-semibold">
                        AI ile Evcil Hayvan Önerisi Alın
                    </h2>
                    <p className="text-copy/70 md:w-[320px]  lg:w-[600px]">
                        AI destekli sistem, yaşam tarzınıza en uygun evcil
                        hayvanı önerir. Böylece size en iyi uyum sağlayacak
                        dostu kolayca bulabilirsiniz.
                    </p>

                    <Button
                        onClick={() => {
                            setIsModalOpen(true);
                        }}
                    >
                        Öneri Al
                    </Button>
                </div>

                <div className="">
                    <img
                        src={IMAGES.cat}
                        alt="Cat Image"
                        className="max-md:w-[200px]"
                    />
                </div>
            </section>

            {/* Mobile App */}
            <section className="containerx flex-center max-md:flex-col gap-8 mb-16">
                <div className="flex-center flex-1">
                    <img
                        src={IMAGES.app}
                        alt="App"
                        className="object-cover object-center"
                    />
                </div>

                <div className="flex-1 md:mb-20">
                    <h2 className="text-4xl font-semibold mb-8">
                        Uygulamamızı Deneyin!
                    </h2>
                    <div className="space-y-4">
                        <div className="space-y-2.5">
                            <div className="font-medium flex gap-2 text-lg">
                                <LayoutGrid size={24} />
                                <p>Interface amigável para todos</p>
                            </div>
                            <p className="text-copy/60">
                                Receba notificações personalizadas para vacinas,
                                consultas veterinárias e outras necessidades,
                                garantindo que você nunca perca um cuidado
                                essencial para o seu pet.
                            </p>
                        </div>

                        <div className="space-y-2.5">
                            <div className="font-medium flex gap-2 text-lg">
                                <AlarmClock size={24} />
                                <p>Design intuitivo e atraente</p>
                            </div>
                            <p className="text-copy/60">
                                Receba notificações personalizadas para vacinas,
                                consultas veterinárias e outras necessidades,
                                garantindo que você nunca perca um cuidado
                                essencial para o seu pet.
                            </p>
                        </div>

                        <div className="space-y-2.5">
                            <div className="font-medium flex gap-2 text-lg">
                                <Sparkles size={24} />
                                <p>Alertas e lembretes inteligentes</p>
                            </div>
                            <p className="text-copy/60">
                                Receba notificações personalizadas para vacinas,
                                consultas veterinárias e outras necessidades,
                                garantindo que você nunca perca um cuidado
                                essencial para o seu pet.
                            </p>
                        </div>
                    </div>

                    <Link
                        to="#"
                        className="px-2.5 py-2 !flex-center w-fit mt-4 gap-2.5 shadow-[2px_2px_4px_rgba(0,0,0,.45)] rounded-lg hover:scale-105 transition-all"
                    >
                        Uygulamayı İndir
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={36}
                            height={36}
                            viewBox="0 0 24 24"
                        >
                            <path
                                fill="currentColor"
                                d="M17.05 20.28c-.98.95-2.05.8-3.08.35c-1.09-.46-2.09-.48-3.24 0c-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8c1.18-.24 2.31-.93 3.57-.84c1.51.12 2.65.72 3.4 1.8c-3.12 1.87-2.38 5.98.48 7.13c-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25c.29 2.58-2.34 4.5-3.74 4.25"
                            ></path>
                        </svg>
                    </Link>
                </div>
            </section>
        </>
    );
}
