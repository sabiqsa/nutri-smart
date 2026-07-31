"use client";

import { useActionState, useState } from "react";

import { login } from "@/app/login/actions";
import { Icon } from "@/components/Icon/Icon";
import { cn } from "@/utils/cn";

import styles from "./LoginForm.module.css";

export function LoginForm() {
  const [error, formAction, pending] = useActionState(login, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      action={formAction}
      className={cn(styles.card, "flex w-full max-w-sm flex-col gap-4 bg-surface-container-lowest p-6")}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-on-surface">
          Email Address
        </label>
        <div className="relative">
          <Icon
            name="mail"
            size={18}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="staff@hospital.org"
            className={cn(styles.input, "w-full border border-outline-variant py-2 pr-3 pl-9 text-sm")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-on-surface">
          Password
        </label>
        <div className="relative">
          <Icon
            name="lock"
            size={18}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            className={cn(styles.input, "w-full border border-outline-variant py-2 pr-9 pl-9 text-sm")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-on-surface-variant"
          >
            <Icon name={showPassword ? "visibility_off" : "visibility"} size={18} />
          </button>
        </div>
        <div className="text-right">
          <span className="text-xs font-medium text-primary">Forgot Password?</span>
        </div>
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className={cn(
          styles.submit,
          "rounded-full bg-primary py-3 text-sm font-semibold text-on-primary disabled:opacity-60",
        )}
      >
        {pending ? "Masuk..." : "Login"}
      </button>

      <p className="text-center text-xs text-on-surface-variant">Secure Clinician Access Only</p>
    </form>
  );
}
