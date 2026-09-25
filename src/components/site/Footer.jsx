import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

const VENDOR_HIDDEN = new Set(["/marketplace", "/pricing"]);

function baseCols() {
  return [
    {
      title: "Platform",
      links: [
        { to: "/marketplace", label: "Marketplace" },
        { to: "/financial-tracker", label: "Financial Tracker" },
        { to: "/features", label: "Features" },
        { to: "/pricing", label: "Pricing" },
      ],
    },
    {
      title: "Company",
      links: [
        { to: "/about", label: "About" },
        { to: "/contact", label: "Contact" },
      ],
    },
    {
      title: "Resources",
      links: [
        { to: "/features", label: "Product Tour" },
        { to: "/features", label: "Security" },
      ],
    },
  ];
}

function Footer() {
  const { isAuthenticated, user } = useAuth();
  const isVendor = user?.account_type === "vendor";

  const cols = baseCols().map((col) => ({
    ...col,
    links: isVendor
      ? col.links.filter(
          (l) =>
            !VENDOR_HIDDEN.has(l.to) &&
            l.label !== "Book a Demo"
        )
      : col.links,
  }));

  const companyCol = cols.find((c) => c.title === "Company");

  if (!isAuthenticated) {
    companyCol.links = [
      ...companyCol.links,
      { to: "/login", label: "Sign In" },
    ];
  }

  return jsx("footer", {
    className:
      "mt-24 border-t border-[var(--border)] bg-[var(--card)]",

    children: jsxs("div", {
      className: "mx-auto max-w-7xl px-6 py-16",

      children: [
        jsxs("div", {
          className:
            "grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]",

          children: [
            jsxs("div", {
              className: "max-w-sm",

              children: [
                /*
                 * Eventneve Logo
                 * Uses the same logo mark as the favicon.
                 */
                jsxs("div", {
                  className: "flex items-center gap-3",

                  children: [
                    jsx("img", {
                      src: "/favicon.ico",
                      alt: "evenTneve",
                      className:
                        "h-10 w-10 object-contain",
                    }),

                    jsx("span", {
                      className:
                        "font-display text-base font-bold tracking-tight text-[var(--eventneve-charcoal)]",
                      children: "evenTneve",
                    }),
                  ],
                }),

                jsx("p", {
                  className:
                    "mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]",
                  children:
                    "India's vendor marketplace and financial operations platform for event planners and vendors.",
                }),
              ],
            }),

            cols.map((c) =>
              jsxs(
                "div",
                {
                  children: [
                    jsx("h4", {
                      className:
                        "text-xs font-semibold uppercase tracking-[0.14em] text-[var(--eventneve-charcoal)]",
                      children: c.title,
                    }),

                    jsx("ul", {
                      className: "mt-4 space-y-3",

                      children: c.links.map((l, i) =>
                        jsx(
                          "li",
                          {
                            children: jsx(Link, {
                              to: l.to,
                              className:
                                "text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--eventneve-raspberry-wine)]",
                              children: l.label,
                            }),
                          },
                          i
                        )
                      ),
                    }),
                  ],
                },
                c.title
              )
            ),
          ],
        }),

        jsxs("div", {
          className:
            "mt-14 flex flex-col items-start justify-between gap-4 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted-foreground)] md:flex-row md:items-center",

          children: [
            jsxs("p", {
              children: [
                "© ",
                new Date().getFullYear(),
                " evenTneve. All rights reserved.",
              ],
            }),

            jsxs("div", {
              className: "flex items-center gap-6",

              children: [
                jsx("a", {
                  className:
                    "hover:text-[var(--eventneve-raspberry-wine)]",
                  href: "#",
                  children: "Privacy",
                }),

                jsx("a", {
                  className:
                    "hover:text-[var(--eventneve-raspberry-wine)]",
                  href: "#",
                  children: "Terms",
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
}

export {
  Footer,
};

export default Footer;