import { Suspense } from "react";
import { LoginForm } from "@/app/(auth)/login/_components/login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
