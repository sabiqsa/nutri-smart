import { Icon } from "@/components/Icon/Icon";
import { LoginForm } from "@/components/LoginForm/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-1">
        <span className="flex size-20 items-center justify-center rounded-full bg-primary text-on-primary">
          <Icon name="nutrition" filled size={36} />
        </span>
        <h1 className="mt-2 text-2xl font-bold text-primary">NutriSmart</h1>
        <p className="max-w-55 text-center text-sm text-on-surface-variant">
          Clinical Nutrition Management System for Healthcare Professionals
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
