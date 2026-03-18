export default function GradientOrb() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Primary orb — purple */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full opacity-30 blur-[120px] animate-orb-drift"
        style={{
          background:
            "radial-gradient(circle, hsl(262 83% 58%) 0%, hsl(262 83% 40%) 40%, transparent 70%)",
        }}
      />
      {/* Secondary orb — blue */}
      <div
        className="absolute top-1/3 left-2/3 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full opacity-20 blur-[100px] animate-orb-drift-reverse"
        style={{
          background:
            "radial-gradient(circle, hsl(210 100% 60%) 0%, hsl(210 100% 40%) 40%, transparent 70%)",
        }}
      />
    </div>
  );
}
