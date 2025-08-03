import type React from "react";
import { Link } from "react-router";

type ButtonProps = {
    isLink?: boolean;
    href?: string;
    classNames?: string;
    children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({
    isLink = false,
    href = "/",
    classNames = "",
    children,
    ...props
}: ButtonProps) {
    const baseClass = `${classNames} text-white bg-primary rounded-full py-4 px-8 hover:bg-primary/90 transition-colors text-nowrap`;

    if (isLink) {
        return (
            <Link to={href} className={baseClass}>
                {children}
            </Link>
        );
    }

    return (
        <button className={baseClass} {...props}>
            {children}
        </button>
    );
}
