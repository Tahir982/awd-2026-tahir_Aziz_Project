"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createSkill, type FormState } from "@/lib/actions/skills";

const CATEGORIES = [
  "Programming",
  "Design",
  "Languages",
  "Music",
  "Academics",
  "Sports & Fitness",
  "Other",
];

const initialState: FormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Publishing..." : "Publish listing"}
    </button>
  );
}

export default function NewSkillPage() {
  const [state, formAction] = useFormState(createSkill, initialState);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl mb-1">Offer a skill</h1>
      <p className="text-sm text-slate mb-6">
        Describe what you'll teach — you can add open time slots after publishing.
      </p>

      <form action={formAction} className="space-y-4" noValidate>
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="e.g. Beginner Guitar Chords"
            required
            className="input-field"
          />
          {state.fieldErrors?.title && <p className="error-text">{state.fieldErrors.title}</p>}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            Category
          </label>
          <select id="category" name="category" required className="input-field">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            required
            placeholder="What will a session cover? Any prerequisites?"
            className="input-field"
          />
          {state.fieldErrors?.description && (
            <p className="error-text">{state.fieldErrors.description}</p>
          )}
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium mb-1">
            Tags <span className="text-ink/50 font-normal">(comma-separated, optional)</span>
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            placeholder="e.g. beginner, acoustic, music-theory"
            className="input-field"
          />
        </div>

        {state.error && <p className="error-text">{state.error}</p>}
        <SubmitButton />
      </form>
    </div>
  );
}
