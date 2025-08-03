import { Link } from "react-router";
import { NAV_LINKS } from "../../constants";

export default function Navbar() {
    return (
        <nav className="flex-center gap-8 text-lg ">
            {NAV_LINKS.map((link, i) => (
                <Link
                    key={i}
                    to={link.href}
                    className="capitalize hover:text-primary transition-colors"
                >
                    {link.title}
                </Link>
            ))}
        </nav>
    );
}
