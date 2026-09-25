import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
function HeroScene() {
  const wrapRef = useRef(null);
  const innerRef = useRef(null);
  useEffect(() => {
    const el = wrapRef.current;
    const inner = innerRef.current;
    if (!el || !inner) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width - 0.5;
      const cy = (e.clientY - r.top) / r.height - 0.5;
      tx = cx * 12;
      ty = cy * 8;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        inner.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });
    };
    const onLeave = () => {
      inner.style.transform = "translate3d(0,0,0)";
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: wrapRef,
      className: "relative w-full max-w-[1200px] translate-x-4 select-none lg:translate-x-2",
      "aria-hidden": true,
      children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 -z-10", children: /* @__PURE__ */ jsx("div", { className: "absolute left-1/2 top-1/2 h-[95%] w-[95%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--champagne)_36%,transparent),color-mix(in_oklab,var(--champagne)_12%,transparent)_55%,transparent_75%)] blur-[64px]" }) }),
        /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0 -z-0", children: Array.from({ length: 14 }).map((_, index) => /* @__PURE__ */ jsx(
          "span",
          {
            className: "absolute h-1.5 w-1.5 rounded-full bg-champagne/60 animate-float-soft",
            style: {
              left: `${index * 47 % 100}%`,
              top: `${index * 31 % 100}%`,
              animationDelay: `${index % 6 * 0.55}s`,
              animationDuration: `${5 + index % 5}s`,
              opacity: 0.18 + index * 17 % 40 / 100
            }
          },
          index
        )) }),
        /* @__PURE__ */ jsx(
          "div",
          {
            ref: innerRef,
            className: "relative mx-auto -mt-10 aspect-[4/3] w-full overflow-visible transition-transform duration-500 ease-out md:-mt-16",
            children: /* @__PURE__ */ jsxs("div", { className: "relative flex h-full w-full items-center justify-center", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 rounded-full bg-champagne/20 blur-3xl" }),
              /* @__PURE__ */ jsx(
                "img",
                {
                  src: "https://raw.githubusercontent.com/Prer26/Event-Petals/main/src/assets/images/hero-3d.png",
                  alt: "Event Marketplace",
                  className: "\n          relative\n          z-10\n          w-[125%]\n          max-w-none\n          scale-110\n          translate-x-2\n          -translate-y-6\n          object-contain\n          drop-shadow-[0_80px_150px_rgba(0,0,0,0.25)]\n          animate-float-soft\n          "
                }
              )
            ] })
          }
        )
      ]
    }
  );
}
export {
  HeroScene
};

export default HeroScene;
