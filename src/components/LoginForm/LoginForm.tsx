"use client";

import { useActionState, useState } from "react";

import { login } from "@/app/login/actions";
import { Icon } from "@/components/Icon/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="staff@hospital.org"
            className={cn(styles.input, "h-auto w-full border-outline-variant py-2 pr-3 pl-9 text-sm")}
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
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            className={cn(styles.input, "h-auto w-full border-outline-variant py-2 pr-9 pl-9 text-sm")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute top-1/2 right-1 -translate-y-1/2 text-on-surface-variant hover:bg-transparent"
          >
            <Icon name={showPassword ? "visibility_off" : "visibility"} size={18} />
          </Button>
        </div>
        <div className="text-right">
          <span className="text-xs font-medium text-primary">Forgot Password?</span>
        </div>
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <Button
        type="submit"
        disabled={pending}
        className={cn(styles.submit, "h-auto rounded-full py-3 text-sm font-semibold")}
      >
        {pending ? "Masuk..." : "Login"}
      </Button>

      <p className="text-center text-xs text-on-surface-variant">Secure Clinician Access Only</p>
    </form>
  );
}
