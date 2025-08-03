import { Link } from "react-router";
import { SOCIALS } from "../../constants";

export default function Socials() {
    return (
        <div className="flex-center gap-2.5">
            {SOCIALS.map((soc) => (
                <Link
                    key={soc.title}
                    to={soc.href}
                    className="bg-copy  rounded-full w-9 h-9 !flex-center text-[#ede8e8] hover:bg-copy/80 transition-colors"
                >
                    {soc.icon}
                </Link>
            ))}
        </div>
    );
}
