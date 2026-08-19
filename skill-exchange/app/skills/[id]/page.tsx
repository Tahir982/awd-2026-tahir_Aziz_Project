import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import BookingForm from "@/components/BookingForm";
import AddSlotForm from "@/components/AddSlotForm";
import RatingStars from "@/components/RatingStars";
import ReportForm from "@/components/ReportForm";
import { format } from "date-fns";

export default async function SkillDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: skill } = await supabase
    .from("skills")
    .select("*, profiles(full_name, department)")
    .eq("id", params.id)
    .single();

  if (!skill) notFound();

  const isOwner = user?.id === skill.owner_id;

  const { data: slots } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("skill_id", params.id)
    .eq("is_booked", false)
    .gt("start_time", new Date().toISOString())
    .order("start_time", { ascending: true });

  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, comment, created_at, profiles!reviews_reviewer_id_fkey(full_name)")
    .eq("skill_id", params.id)
    .order("created_at", { ascending: false });

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="md:col-span-2">
        <span className="badge mb-3">{skill.category}</span>
        <h1 className="text-3xl mb-2">{skill.title}</h1>
        <p className="text-sm text-slate mb-1">
          Taught by {skill.profiles?.full_name || "A student"}
          {skill.profiles?.department ? ` · ${skill.profiles.department}` : ""}
        </p>
        {avgRating && (
          <div className="mb-4">
            <RatingStars value={avgRating} /> <span className="text-xs text-slate">({reviews!.length} review{reviews!.length !== 1 ? "s" : ""})</span>
          </div>
        )}
        <p className="whitespace-pre-wrap text-ink/90 mb-6">{skill.description}</p>

        {skill.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {skill.tags.map((t: string) => (
              <span key={t} className="badge">#{t}</span>
            ))}
          </div>
        )}

        <section className="mb-8">
          <h2 className="text-xl mb-3">Reviews</h2>
          {reviews && reviews.length > 0 ? (
            <ul className="space-y-4">
              {reviews.map((r: any, idx: number) => (
                <li key={idx} className="card">
                  <div className="flex items-center justify-between mb-1">
                    <RatingStars value={r.rating} />
                    <span className="text-xs text-ink/50">
                      {format(new Date(r.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-ink/80">{r.comment}</p>}
                  <p className="text-xs text-ink/50 mt-1">— {r.profiles?.full_name || "Student"}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate">No reviews yet.</p>
          )}
        </section>

        {user && !isOwner && (
          <ReportForm skillId={skill.id} />
        )}
      </div>

      <aside className="space-y-4">
        {isOwner ? (
          <AddSlotForm skillId={skill.id} />
        ) : (
          <div className="card">
            <h2 className="font-display text-lg mb-3">Available time slots</h2>
            {!user && (
              <p className="text-sm text-slate">Log in to book a session.</p>
            )}
            {user && slots && slots.length > 0 && (
              <ul className="space-y-2">
                {slots.map((slot) => (
                  <li key={slot.id}>
                    <BookingForm
                      slotId={slot.id}
                      skillId={skill.id}
                      label={`${format(new Date(slot.start_time), "EEE, MMM d · h:mm a")} – ${format(
                        new Date(slot.end_time),
                        "h:mm a"
                      )}`}
                    />
                  </li>
                ))}
              </ul>
            )}
            {user && (!slots || slots.length === 0) && (
              <p className="text-sm text-slate">No open slots right now — check back later.</p>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
