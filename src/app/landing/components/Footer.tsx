import { Link } from "react-router-dom";
import { copy } from "../utils/copy";

export function Footer() {
  return (
    <footer className="relative flex flex-col items-center border-t border-zinc-200 bg-[#f2f3f1] pt-8 pb-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 text-center md:px-10 lg:px-12">
        {/* Nav columns */}
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 md:gap-x-16">
          {copy.footer.navColumns.map(({ heading, links }) => (
            <div key={heading} className="text-center">
              <h4 className="mb-3 font-semibold text-zinc-900">{heading}</h4>
              <ul className="flex flex-col items-center gap-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      className="text-zinc-600 transition hover:text-zinc-900"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Large logo - outside section, centered */}
      <Link
        to="/"
        className="footer-logo-container mt-8 block w-full text-center"
      >
        <span className="footer-logo">CLAWPIFY</span>
      </Link>
    </footer>
  );
}
