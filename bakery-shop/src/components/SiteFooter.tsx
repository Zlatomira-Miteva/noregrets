'use client';

import { FOOTER_LINK_GROUPS, SOCIAL_LINKS } from "@/data/footer";

const SiteFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#2f1b16] text-[#fcefe7]">
      <div className="mx-auto flex w-full flex-col gap-12 px-[clamp(1rem,3vw,3rem)] py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
              Абонирайте се за сладки новини
            </h2>
            <p className="text-sm text-[#f3d6ca]">
              Първи научавайте за нови вкусове, специални оферти и дегустации в магазина.
            </p>
            <form className="space-y-3">
              <div className="flex max-w-xl overflow-hidden rounded-full bg-white/10 shadow-inner backdrop-blur">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Имейл адрес"
                  className="w-full flex-1 border-none bg-transparent px-6 py-3 text-sm text-white placeholder:text-[#f3d6ca] focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-white/20 px-6 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/40"
                >
                  Изпрати
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-[#f3d6ca]/80">
                С изпращането на формата приемате{" "}
                <a href="#" className="underline hover:text-white">
                  Общите условия
                </a>{" "}
                и{" "}
                <a href="#" className="underline hover:text-white">
                  Политиката за поверителност
                </a>
                .
              </p>
            </form>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {FOOTER_LINK_GROUPS.map((group) => (
              <div key={group.title} className="space-y-4">
                <h3 className="text-lg font-semibold text-white">{group.title}</h3>
                <ul className="space-y-2 text-sm text-[#f3d6ca]">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="transition hover:text-white hover:underline"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-white/10 pt-8 text-sm text-[#f3d6ca] md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            <span className="text-lg" aria-hidden="true">
              🇧🇬
            </span>
            България (BGN)
          </button>

          <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.2em] text-[#f3d6ca]/80">
            <span>© {currentYear} No Regrets Bakery</span>
            <span className="hidden h-4 w-px bg-white/20 md:block" />
            <a href="#" className="hover:text-white">
              Политика за поверителност
            </a>
            <span className="hidden h-4 w-px bg-white/20 md:block" />
            <a href="#" className="hover:text-white">
              Условия за ползване
            </a>
          </div>

          <div className="flex items-center gap-4 text-white">
            {SOCIAL_LINKS.map((item) => (
              <a
                key={item.id}
                href={item.href}
                aria-label={item.label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/30"
              >
                {item.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
