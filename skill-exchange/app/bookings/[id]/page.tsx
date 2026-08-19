import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import ChatBox from "@/components/ChatBox";

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/bookings/${params.id}`);

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, status, learner_id, owner_id, skills(title), availability_slots(start_time, end_time), learner:profiles!bookings_learner_id_fkey(full_name), owner:profiles!bookings_owner_id_fkey(full_name)"
    )
    .eq("id", params.id)
    .single();

  if (!booking) notFound();

  // RLS already blocks this at the DB level, but checking here lets us
  // show a clean "not found" instead of a confusing empty page.
  const isParticipant = booking.learner_id === user.id || booking.owner_id === user.id;
  if (!isParticipant) notFound();

  const { data: initialMessages } = await supabase
    .from("messages")
    .select("id, body, sender_id, created_at")
    .eq("booking_id", params.id)
    .order("created_at", { ascending: true });

  const otherParty = booking.learner_id === user.id ? (booking as any).owner : (booking as any).learner;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card mb-4">
        <h1 className="text-xl mb-1">{(booking as any).skills?.title}</h1>
        <p className="text-sm text-slate">
          With {otherParty?.full_name || "Student"} ·{" "}
          {(booking as any).availability_slots &&
            format(new Date((booking as any).availability_slots.start_time), "EEE, MMM d · h:mm a")}
        </p>
        <span className="badge mt-2 inline-block">{booking.status}</span>
      </div>

      <ChatBox
        bookingId={params.id}
        currentUserId={user.id}
        initialMessages={initialMessages ?? []}
      />
    </div>
  );
}
