import { Icon } from "@/components/Icon/Icon";
import { DELIVERY_STATUS } from "@/constants/delivery-status";
import type { DistributionStatus } from "@/types/patient";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: DistributionStatus; className?: string }) {
  const config = DELIVERY_STATUS[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        config.className,
        className,
      )}
    >
      <Icon name={config.icon} size={14} />
      {config.label}
    </span>
  );
}
