import { createClient } from "@/lib/supabase/server";
import AdminReportRow from "@/components/AdminReportRow";

// Route access is already gated by middleware.ts (checks is_admin), and
// every server action re-verifies admin status again — defense in depth.
export default async function AdminPage() {
  const supabase = createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select("id, reason, status, created_at, skills(id, title), profiles!reports_reporter_id_fkey(full_name)")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const { data: stats } = await supabase.from("skills").select("id", { count: "exact", head: true });

  return (
    <div>
      <h1 className="text-3xl mb-1">Admin — Moderation</h1>
      <p className="text-sm text-slate mb-8">Review reported listings and take action.</p>

      <section>
        <h2 className="text-xl mb-4">Open reports {reports ? `(${reports.length})` : ""}</h2>
        {reports && reports.length > 0 ? (
          <ul className="space-y-3">
            {reports.map((r: any) => (
              <AdminReportRow key={r.id} report={r} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate">No open reports. All clear.</p>
        )}
      </section>
    </div>
  );
}
