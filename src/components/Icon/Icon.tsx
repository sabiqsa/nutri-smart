import { cn } from "@/lib/utils";

type IconProps = {
  /** Material Symbols ligature name, e.g. "dashboard", "qr_code_scanner". */
  name: string;
  filled?: boolean;
  className?: string;
  size?: number;
};

export function Icon({ name, filled, className, size }: IconProps) {
  return (
    <span
      className={cn("material-symbols-outlined", className)}
      style={{
        fontVariationSettings: `"FILL" ${filled ? 1 : 0}`,
        fontSize: size ? `${size}px` : undefined,
      }}
    >
      {name}
    </span>
  );
}
