"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signIn, type FormState } from "@/lib/actions/auth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const initialState: FormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Logging in..." : "Log in"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(signIn, initialState);
  const params = useSearchParams();
  const justRegistered = params.get("registered");

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl mb-1">Welcome back</h1>
      <p className="text-sm text-slate mb-6">Log in to book sessions and manage your listings.</p>

      {justRegistered && (
        <p className="mb-4 rounded-md bg-moss/10 px-3 py-2 text-sm text-moss">
          Account created — check your email to confirm, then log in.
        </p>
      )}

      <form action={formAction} className="space-y-4" noValidate>
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
          <input id="password" name="password" type="password" required className="input-field" />
          {state.fieldErrors?.password && (
            <p className="error-text">{state.fieldErrors.password}</p>
          )}
        </div>
        {state.error && <p className="error-text">{state.error}</p>}
        <SubmitButton />
      </form>

      <p className="mt-6 text-sm text-slate">
        No account yet?{" "}
        <Link href="/register" className="text-moss underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
