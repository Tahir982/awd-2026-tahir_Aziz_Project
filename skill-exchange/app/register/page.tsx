"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signUp, type FormState } from "@/lib/actions/auth";
import Link from "next/link";

const initialState: FormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Creating account..." : "Create account"}
    </button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useFormState(signUp, initialState);

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl mb-1">Join Skill Exchange</h1>
      <p className="text-sm text-slate mb-6">
        Use your student email so classmates know it's really you.
      </p>

      <form action={formAction} className="space-y-4" noValidate>
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium mb-1">
            Full name
          </label>
          <input id="fullName" name="fullName" type="text" required className="input-field" />
          {state.fieldErrors?.fullName && (
            <p className="error-text">{state.fieldErrors.fullName}</p>
          )}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input id="email" name="email" type="email" required className="input-field" />
          {state.fieldErrors?.email && <p className="error-text">{state.fieldErrors.email}</p>}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="input-field"
          />
          {state.fieldErrors?.password && (
            <p className="error-text">{state.fieldErrors.password}</p>
          )}
        </div>
        {state.error && <p className="error-text">{state.error}</p>}
        <SubmitButton />
      </form>

      <p className="mt-6 text-sm text-slate">
        Already have an account?{" "}
        <Link href="/login" className="text-moss underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
