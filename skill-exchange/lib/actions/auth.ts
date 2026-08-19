"use server";

import { createClient } from "@/lib/supabase/server";
import { signUpSchema, signInSchema } from "@/lib/validation";
import { redirect } from "next/navigation";

export type FormState = { error?: string; fieldErrors?: Record<string, string> };

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => (fieldErrors[i.path[0] as string] = i.message));
    return { fieldErrors };
  }

  const { fullName, email, password } = parsed.data;
  const supabase = createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    // Never leak whether an email already exists in detail — generic message
    return { error: "Could not create account. Try a different email or log in instead." };
  }

  redirect("/login?registered=1");
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => (fieldErrors[i.path[0] as string] = i.message));
    return { fieldErrors };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Invalid email or password." };
  }

  redirect("/dashboard");
}
