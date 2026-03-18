import { cn } from "@/lib/utils";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  size?: "default" | "lg";
  as?: "button" | "a";
  href?: string;
  target?: string;
  rel?: string;
}

export default function ShimmerButton({
  children,
  variant = "primary",
  size = "default",
  className,
  as = "button",
  href,
  target,
  rel,
  ...props
}: ShimmerButtonProps) {
  const baseClasses =
    "relative inline-flex items-center justify-center gap-2 rounded-full font-inter font-semibold transition-all duration-300 cursor-pointer";

  const variantClasses = {
    primary:
      "bg-[#FAFAFA] text-[#171719] hover:scale-[1.03] hover:shadow-[0_8px_30px_rgba(139,92,246,0.25)] shimmer-button",
    secondary:
      "bg-transparent border border-white/20 text-white/80 hover:text-white hover:border-white/40 hover:bg-white/5",
  };

  const sizeClasses = {
    default: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
  };

  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);

  if (as === "a") {
    return (
      <a href={href} target={target} rel={rel} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
