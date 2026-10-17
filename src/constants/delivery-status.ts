import type { DistributionStatus } from "@/types/patient";

/**
 * Single source for how a delivery status looks and reads. Dashboard,
 * patient list, patient detail and filters each used to carry their own
 * label/color map ("PROSES" vs "Siap Kirim" vs "Ready" for the same
 * status, and ready rendered teal on one screen and blue on another).
 */
export const DELIVERY_STATUS: Record<
  DistributionStatus,
  { label: string; icon: string; className: string }
> = {
  pending: {
    label: "Pending",
    icon: "schedule",
    className: "bg-surface-container-highest text-on-surface-variant",
  },
  ready: {
    label: "Siap Kirim",
    icon: "inventory_2",
    className: "bg-primary-fixed text-on-primary-fixed-variant",
  },
  delivered: {
    label: "Terkirim",
    icon: "check_circle",
    className: "bg-secondary-container text-on-secondary-container",
  },
  not_distributed: {
    label: "Tidak Dibagikan",
    icon: "block",
    className: "bg-outline-variant text-on-surface",
  },
};

export const DELIVERY_STATUS_ORDER: DistributionStatus[] = ["pending", "ready", "delivered", "not_distributed"];
