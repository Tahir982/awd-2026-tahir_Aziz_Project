"use server";

import { createClient } from "@/lib/supabase/server";
import { skillSchema, slotSchema } from "@/lib/validation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type FormState = { error?: string; fieldErrors?: Record<string, string> };

export async function createSkill(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const parsed = skillSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    tags: formData.get("tags") ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => (fieldErrors[i.path[0] as string] = i.message));
    return { fieldErrors };
  }

  const { data, error } = await supabase
    .from("skills")
    .insert({ ...parsed.data, owner_id: user.id })
    .select("id")
    .single();

  if (error) return { error: "Could not create listing. Please try again." };

  redirect(`/skills/${data.id}`);
}

export async function addSlot(skillId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const parsed = slotSchema.safeParse({
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => (fieldErrors[i.path[0] as string] = i.message));
    return { fieldErrors };
  }

  // Ownership check happens server-side via RLS too, but we verify here
  // as well so we can return a clean error instead of a raw DB failure.
  const { data: skill } = await supabase.from("skills").select("owner_id").eq("id", skillId).single();
  if (!skill || skill.owner_id !== user.id) {
    return { error: "You can only add availability to your own listings." };
  }

  const { error } = await supabase.from("availability_slots").insert({
    skill_id: skillId,
    owner_id: user.id,
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime,
  });

  if (error) return { error: "Could not add the time slot." };

  revalidatePath(`/skills/${skillId}`);
  return {};
}

export async function deactivateSkill(skillId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("skills").update({ is_active: false }).eq("id", skillId).eq("owner_id", user.id);
  revalidatePath("/dashboard");
}
