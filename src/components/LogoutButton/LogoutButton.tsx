"use client";

import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

// useFormStatus reads the status of the nearest ancestor <form> — works for
// a plain native-action form (POST /auth/logout) same as a Server Action,
// since it tracks form submission generally, not just function actions.
// Must be a child of the <form>, can't live in the same component as it.
export function LogoutButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={cn(className, pending && "opacity-60")}>
      {pending ? "Logout..." : "Logout"}
    </button>
  );
}
