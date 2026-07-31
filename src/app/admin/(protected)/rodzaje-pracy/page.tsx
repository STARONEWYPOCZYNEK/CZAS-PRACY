import { createClient } from "@/lib/supabase/server";
import { RodzajePracyClient } from "./rodzaje-pracy-client";

export default async function RodzajePracyPage() {
  const supabase = await createClient();
  const { data: workTypes } = await supabase
    .from("work_types")
    .select("id, name, hourly_rate, active")
    .order("name");

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Rodzaje pracy i stawki</h1>
      <RodzajePracyClient workTypes={workTypes ?? []} />
    </div>
  );
}
