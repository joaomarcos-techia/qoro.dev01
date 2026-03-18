import { useEffect, useRef, useState } from "react";

const metrics = [
  { value: 15, suffix: "+", label: "Clínicas ativas" },
  { value: 7, suffix: "k+", label: "Consultas/mês" },
  { value: 72, suffix: "hrs", label: "Tempo de setup" },
];

function useCountUp(end: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [started, end, duration]);

  return { count, ref };
}

export default function SocialProofBar() {
  return (
    <section className="py-8 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-center gap-0 flex-wrap">
        {metrics.map((m, i) => {
          const { count, ref } = useCountUp(m.value);
          return (
            <div key={i} className="flex items-center">
              <div ref={ref} className="text-center px-5 sm:px-10 py-2">
                <p className="text-2xl font-bold text-white font-manrope">
                  {count}
                  {m.suffix}
                </p>
                <p className="text-xs text-white/40 mt-0.5">{m.label}</p>
              </div>
              {i < metrics.length - 1 && (
                <div className="h-8 w-px bg-white/10" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
