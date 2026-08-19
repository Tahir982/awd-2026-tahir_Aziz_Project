"use client";

import { updateBookingStatus, leaveReview, type FormState } from "@/lib/actions/bookings";
import { useFormState, useFormStatus } from "react-dom";
import { useState, useTransition } from "react";
import Link from "next/link";

function SubmitReviewButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary text-xs py-1" disabled={pending}>
      {pending ? "Submitting..." : "Submit review"}
    </button>
  );
}

export default function BookingActions({
  bookingId,
  status,
  role,
}: {
  bookingId: string;
  status: string;
  role: "learner" | "owner";
}) {
  const [isPending, startTransition] = useTransition();
  const [showReview, setShowReview] = useState(false);
  const [reviewState, reviewAction] = useFormState<FormState, FormData>(leaveReview, {});

  function act(newStatus: "confirmed" | "completed" | "cancelled") {
    startTransition(() => updateBookingStatus(bookingId, newStatus));
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {(status === "pending" || status === "confirmed") && (
        <Link href={`/bookings/${bookingId}`} className="btn-secondary text-xs py-1">
          Open chat
        </Link>
      )}
      {role === "owner" && status === "pending" && (
        <>
          <button className="btn-secondary text-xs py-1" disabled={isPending} onClick={() => act("confirmed")}>
            Confirm
          </button>
          <button className="btn-secondary text-xs py-1" disabled={isPending} onClick={() => act("cancelled")}>
            Decline
          </button>
        </>
      )}
      {role === "owner" && status === "confirmed" && (
        <button className="btn-secondary text-xs py-1" disabled={isPending} onClick={() => act("completed")}>
          Mark as completed
        </button>
      )}
      {(status === "pending" || status === "confirmed") && (
        <button className="text-xs text-clay underline" disabled={isPending} onClick={() => act("cancelled")}>
          Cancel
        </button>
      )}

      {role === "learner" && status === "completed" && !showReview && (
        <button className="text-xs text-moss underline" onClick={() => setShowReview(true)}>
          Leave a review
        </button>
      )}

      {showReview && (
        <form action={reviewAction} className="mt-2 w-full space-y-2">
          <input type="hidden" name="bookingId" value={bookingId} />
          <select name="rating" required className="input-field text-xs w-auto">
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n !== 1 ? "s" : ""}
              </option>
            ))}
          </select>
          <textarea name="comment" placeholder="How was the session?" rows={2} className="input-field text-xs" />
          {reviewState.error && <p className="error-text">{reviewState.error}</p>}
          <SubmitReviewButton />
        </form>
      )}
    </div>
  );
}
