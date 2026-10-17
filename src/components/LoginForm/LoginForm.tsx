"use client";

import { useActionState, useState } from "react";

import { login } from "@/app/login/actions";
import { Icon } from "@/components/Icon/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [error, formAction, pending] = useActionState(login, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      action={formAction}
      className="flex w-full max-w-sm flex-col gap-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-raised"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-on-surface">
          Email Address
        </label>
        <div className="relative">
          <Icon
            name="mail"
            size={18}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-on-surface-variant"
          />
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="staff@hospital.org"
            className="h-11 w-full pr-3 pl-10"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-on-surface">
          Password
        </label>
        <div className="relative">
          <Icon
            name="lock"
            size={18}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-on-surface-variant"
          />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            className="h-11 w-full pr-11 pl-10"
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
      </div>

      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-lg bg-error-container/50 px-3 py-2 text-sm text-on-error-container">
          <Icon name="error" size={18} className="text-error" />
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        size="lg"
        className="h-12 font-semibold"
      >
        {pending ? "Masuk..." : "Login"}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-on-surface-variant">
        <Icon name="lock" size={14} />
        Secure Clinician Access Only
      </p>
    </form>
  );
}
