"use client";

import { useFormState, useFormStatus } from "react-dom";
import { reportSkill, type FormState } from "@/lib/actions/bookings";
import { useState } from "react";

const initialState: FormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-secondary text-xs" disabled={pending}>
      {pending ? "Submitting..." : "Submit report"}
    </button>
  );
}

export default function ReportForm({ skillId }: { skillId: string }) {
  const [state, formAction] = useFormState(reportSkill, initialState);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button className="text-xs text-ink/50 underline" onClick={() => setOpen(true)}>
        Report this listing
      </button>
    );
  }

  return (
    <form action={formAction} className="card max-w-md space-y-2">
      <input type="hidden" name="skillId" value={skillId} />
      <label htmlFor="reason" className="block text-xs font-medium">
        Why are you reporting this listing?
      </label>
      <textarea id="reason" name="reason" rows={2} required className="input-field text-xs" />
      {state.error && <p className="error-text">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
