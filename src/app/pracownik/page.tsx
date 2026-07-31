import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployeeIdFromSession } from "@/lib/employee-session/cookie";
import { LoginClient } from "./login-client";

export default async function PracownikLoginPage() {
  const existingEmployeeId = await getEmployeeIdFromSession();
  if (existingEmployeeId) {
    redirect("/pracownik/wpis");
  }

  const supabase = createAdminClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name")
    .eq("active", true)
    .order("full_name");

  return (
    <div className="flex flex-1 flex-col p-6">
      <LoginClient employees={employees ?? []} />
    </div>
  );
}
