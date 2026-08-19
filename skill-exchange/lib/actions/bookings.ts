"use server";

import { createClient } from "@/lib/supabase/server";
import { bookingSchema, reviewSchema, reportSchema, messageSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";

export type FormState = { error?: string; fieldErrors?: Record<string, string> };

export async function bookSlot(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to book a session." };

  const parsed = bookingSchema.safeParse({
    slotId: formData.get("slotId"),
    skillId: formData.get("skillId"),
    message: formData.get("message") ?? undefined,
  });
  if (!parsed.success) return { error: "Invalid booking request." };

  const { data: slot } = await supabase
    .from("availability_slots")
    .select("owner_id, is_booked")
    .eq("id", parsed.data.slotId)
    .single();

  if (!slot) return { error: "That time slot no longer exists." };
  if (slot.is_booked) return { error: "That time slot was just booked by someone else." };
  if (slot.owner_id === user.id) return { error: "You can't book your own listing." };

  const { error } = await supabase.from("bookings").insert({
    slot_id: parsed.data.slotId,
    skill_id: parsed.data.skillId,
    learner_id: user.id,
    owner_id: slot.owner_id,
    message: parsed.data.message || null,
  });

  if (error) return { error: "Could not complete booking — it may have just been taken." };

  revalidatePath(`/skills/${parsed.data.skillId}`);
  revalidatePath("/dashboard");
  return {};
}

export async function updateBookingStatus(bookingId: string, status: "confirmed" | "completed" | "cancelled") {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .or(`learner_id.eq.${user.id},owner_id.eq.${user.id}`);

  revalidatePath("/dashboard");
}

export async function leaveReview(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const parsed = reviewSchema.safeParse({
    bookingId: formData.get("bookingId"),
    rating: formData.get("rating"),
    comment: formData.get("comment") ?? undefined,
  });
  if (!parsed.success) return { error: "Invalid review." };

  const { data: booking } = await supabase
    .from("bookings")
    .select("skill_id, owner_id, learner_id, status")
    .eq("id", parsed.data.bookingId)
    .single();

  if (!booking || booking.learner_id !== user.id || booking.status !== "completed") {
    return { error: "You can only review completed sessions you attended." };
  }

  const { error } = await supabase.from("reviews").insert({
    booking_id: parsed.data.bookingId,
    skill_id: booking.skill_id,
    reviewer_id: user.id,
    reviewee_id: booking.owner_id,
    rating: parsed.data.rating,
    comment: parsed.data.comment || null,
  });

  if (error) return { error: "Could not submit review (maybe you already left one)." };

  revalidatePath("/dashboard");
  return {};
}

export async function reportSkill(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to report a listing." };

  const parsed = reportSchema.safeParse({
    skillId: formData.get("skillId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { error: "Please provide a reason (5-500 characters)." };

  const { error } = await supabase.from("reports").insert({
    skill_id: parsed.data.skillId,
    reporter_id: user.id,
    reason: parsed.data.reason,
  });

  if (error) return { error: "Could not submit report." };
  return {};
}

export async function sendMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const parsed = messageSchema.safeParse({
    bookingId: formData.get("bookingId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: "Message cannot be empty." };

  const { error } = await supabase.from("messages").insert({
    booking_id: parsed.data.bookingId,
    sender_id: user.id,
    body: parsed.data.body,
  });

  if (error) return { error: "Could not send message." };

  revalidatePath(`/bookings/${parsed.data.bookingId}`);
  return {};
}
