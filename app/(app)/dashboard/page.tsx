import { DashboardView } from "@/app/(app)/dashboard/_components/dashboard-view";
import { requireUser } from "@/lib/auth/require-user";
import { displayName } from "@/lib/auth/users";
import {
  getDashboardData,
  getDefaultDashboardData,
} from "@/lib/wellness/dashboard-data";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.email).catch(() =>
    getDefaultDashboardData(),
  );

  return (
    <DashboardView
      name={displayName(user.email, user.name)}
      email={user.email}
      initialData={data}
    />
  );
}
