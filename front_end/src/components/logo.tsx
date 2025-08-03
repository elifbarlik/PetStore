import { Link } from "react-router";

type LogoProps = {
    isLink?: boolean;
    href?: string;
    className?: string;
};

export default function Logo({
    isLink = false,
    href = "/",
    className = "",
}: LogoProps) {
    const Component = isLink ? Link : "div";

    return (
        <Component
            to={isLink ? href : ""}
            className={
                "font-bold md:text-4xl text-2xl font-payton-one text-nowrap " +
                className
            }
        >
            Pet <span className="text-primary">Shop</span>
        </Component>
    );
}
