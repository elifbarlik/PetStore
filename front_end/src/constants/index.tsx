import heroImg from "../assets/images/hero-image.png";
import cat from "../assets/images/cat.png";
import app from "../assets/images/app.png";
import topImg from "../assets/images/top-img.png";

export const IMAGES = {
    heroImg,
    cat,
    app,
    topImg,
};

export const NAV_LINKS = [
    {
        title: "anasayfa",
        href: "/",
    },
    {
        title: "İlanlar",
        href: "/ilanlar",
    },
];

export const SOCIALS = [
    {
        title: "Linkedin",
        href: "#",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={24}
                height={24}
                viewBox="0 0 24 24"
            >
                <path
                    fill="currentColor"
                    d="M6.94 5a2 2 0 1 1-4-.002a2 2 0 0 1 4 .002M7 8.48H3V21h4zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91z"
                ></path>
            </svg>
        ),
    },
    {
        title: "Facebook",
        href: "#",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={24}
                height={24}
                viewBox="0 0 24 24"
            >
                <path
                    fill="currentColor"
                    d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396z"
                ></path>
            </svg>
        ),
    },
    {
        title: "X",
        href: "#",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={14}
                height={14}
                viewBox="0 0 14 14"
            >
                <g fill="none">
                    <g clipPath="url(#primeTwitter0)">
                        <path
                            fill="currentColor"
                            d="M11.025.656h2.147L8.482 6.03L14 13.344H9.68L6.294 8.909l-3.87 4.435H.275l5.016-5.75L0 .657h4.43L7.486 4.71zm-.755 11.4h1.19L3.78 1.877H2.504z"
                        ></path>
                    </g>
                    <defs>
                        <clipPath id="primeTwitter0">
                            <path fill="#fff" d="M0 0h14v14H0z"></path>
                        </clipPath>
                    </defs>
                </g>
            </svg>
        ),
    },
];
