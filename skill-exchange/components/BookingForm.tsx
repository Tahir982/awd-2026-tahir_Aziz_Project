"use client";

import { useFormState, useFormStatus } from "react-dom";
import { bookSlot, type FormState } from "@/lib/actions/bookings";
import { useState } from "react";

const initialState: FormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full text-xs py-1.5" disabled={pending}>
      {pending ? "Booking..." : "Book this slot"}
    </button>
  );
}

export default function BookingForm({
  slotId,
  skillId,
  label,
}: {
  slotId: string;
  skillId: string;
  label: string;
}) {
  const [state, formAction] = useFormState(bookSlot, initialState);
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-md border border-ink/10 p-3">
      <p className="text-sm mb-2">{label}</p>
      {!open ? (
        <button className="btn-secondary w-full text-xs py-1.5" onClick={() => setOpen(true)}>
          Select
        </button>
      ) : (
        <form action={formAction} className="space-y-2">
          <input type="hidden" name="slotId" value={slotId} />
          <input type="hidden" name="skillId" value={skillId} />
          <textarea
            name="message"
            placeholder="Optional note to the teacher"
            rows={2}
            className="input-field text-xs"
          />
          {state.error && <p className="error-text">{state.error}</p>}
          <SubmitButton />
        </form>
      )}
    </div>
  );
}
