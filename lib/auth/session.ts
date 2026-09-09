import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getSessionUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user.id ?? null;
}

export async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}
