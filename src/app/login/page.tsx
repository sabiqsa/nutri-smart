import { Icon } from "@/components/Icon/Icon";
import { LoginForm } from "@/components/LoginForm/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-8 bg-surface-container-low px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-raised">
          <Icon name="nutrition" filled size={30} />
        </span>
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-primary">NutriSmart</h1>
          <p className="max-w-64 text-sm text-on-surface-variant">
            Clinical Nutrition Management System for Healthcare Professionals
          </p>
        </div>
      </div>
      <LoginForm />
    </main>
  );
}
