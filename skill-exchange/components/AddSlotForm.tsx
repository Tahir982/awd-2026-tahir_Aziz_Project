"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addSlot, type FormState } from "@/lib/actions/skills";

const initialState: FormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full text-sm" disabled={pending}>
      {pending ? "Adding..." : "Add time slot"}
    </button>
  );
}

export default function AddSlotForm({ skillId }: { skillId: string }) {
  const boundAction = addSlot.bind(null, skillId);
  const [state, formAction] = useFormState(boundAction, initialState);

  return (
    <div className="card">
      <h2 className="font-display text-lg mb-3">Add availability</h2>
      <form action={formAction} className="space-y-3">
        <div>
          <label htmlFor="startTime" className="block text-xs font-medium mb-1">
            Start
          </label>
          <input
            id="startTime"
            name="startTime"
            type="datetime-local"
            required
            className="input-field text-sm"
          />
          {state.fieldErrors?.startTime && (
            <p className="error-text">{state.fieldErrors.startTime}</p>
          )}
        </div>
        <div>
          <label htmlFor="endTime" className="block text-xs font-medium mb-1">
            End
          </label>
          <input
            id="endTime"
            name="endTime"
            type="datetime-local"
            required
            className="input-field text-sm"
          />
          {state.fieldErrors?.endTime && <p className="error-text">{state.fieldErrors.endTime}</p>}
        </div>
        {state.error && <p className="error-text">{state.error}</p>}
        <SubmitButton />
      </form>
    </div>
  );
}
