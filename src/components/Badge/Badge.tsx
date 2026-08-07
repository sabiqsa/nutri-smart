import { cn } from "@/utils/cn";

import styles from "./Badge.module.css";

type BadgeVariant =
  | "default"
  | "success"
  | "pending"
  | "ready"
  | "delivered"
  | "mismatch"
  | "not_distributed";

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(styles.badge, "inline-block px-3 py-1 text-xs", styles[variant])}
    >
      {children}
    </span>
  );
}
