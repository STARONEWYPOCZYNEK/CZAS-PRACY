import { createClient } from "@/lib/supabase/server";
import { PracownicyClient } from "./pracownicy-client";

export default async function PracownicyPage() {
  const supabase = await createClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, active, created_at")
    .order("full_name");

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Pracownicy</h1>
      <PracownicyClient employees={employees ?? []} />
    </div>
  );
}
