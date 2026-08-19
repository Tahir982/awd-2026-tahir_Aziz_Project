import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { format } from "date-fns";
import BookingActions from "@/components/BookingActions";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // middleware already redirects unauthenticated users

  const { data: mySkills } = await supabase
    .from("skills")
    .select("id, title, is_active, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const { data: myBookingsAsLearner } = await supabase
    .from("bookings")
    .select("id, status, message, created_at, skills(title), availability_slots(start_time, end_time)")
    .eq("learner_id", user.id)
    .order("created_at", { ascending: false });

  const { data: myBookingsAsOwner } = await supabase
    .from("bookings")
    .select("id, status, message, created_at, skills(title), availability_slots(start_time, end_time), profiles!bookings_learner_id_fkey(full_name)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl mb-1">Your dashboard</h1>
        <p className="text-sm text-slate">Manage your listings and sessions.</p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">Your listings</h2>
          <Link href="/skills/new" className="btn-secondary text-sm">
            + New listing
          </Link>
        </div>
        {mySkills && mySkills.length > 0 ? (
          <ul className="space-y-2">
            {mySkills.map((s) => (
              <li key={s.id} className="card flex items-center justify-between">
                <Link href={`/skills/${s.id}`} className="hover:text-moss">
                  {s.title}
                </Link>
                <span className={`badge ${!s.is_active ? "opacity-50" : ""}`}>
                  {s.is_active ? "Active" : "Inactive"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate">You haven't listed any skills yet.</p>
        )}
      </section>

      <section>
        <h2 className="text-xl mb-4">Sessions you booked</h2>
        {myBookingsAsLearner && myBookingsAsLearner.length > 0 ? (
          <ul className="space-y-2">
            {myBookingsAsLearner.map((b: any) => (
              <li key={b.id} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{b.skills?.title}</p>
                    <p className="text-xs text-slate">
                      {b.availability_slots &&
                        format(new Date(b.availability_slots.start_time), "MMM d, h:mm a")}
                    </p>
                  </div>
                  <span className="badge">{b.status}</span>
                </div>
                <BookingActions bookingId={b.id} status={b.status} role="learner" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate">No bookings yet — browse skills to get started.</p>
        )}
      </section>

      <section>
        <h2 className="text-xl mb-4">Sessions you're teaching</h2>
        {myBookingsAsOwner && myBookingsAsOwner.length > 0 ? (
          <ul className="space-y-2">
            {myBookingsAsOwner.map((b: any) => (
              <li key={b.id} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{b.skills?.title}</p>
                    <p className="text-xs text-slate">
                      Learner: {b.profiles?.full_name || "Student"} ·{" "}
                      {b.availability_slots &&
                        format(new Date(b.availability_slots.start_time), "MMM d, h:mm a")}
                    </p>
                    {b.message && <p className="text-xs text-ink/70 mt-1">"{b.message}"</p>}
                  </div>
                  <span className="badge">{b.status}</span>
                </div>
                <BookingActions bookingId={b.id} status={b.status} role="owner" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate">No one has booked your listings yet.</p>
        )}
      </section>
    </div>
  );
}
