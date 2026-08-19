"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Every admin action re-checks is_admin server-side. Middleware already
// blocks page access, but Server Actions can be invoked directly, so they
// must never assume the caller reached them through the protected page.
async function assertAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) throw new Error("Not authorized");

  return { supabase, user };
}

export async function resolveReport(reportId: string, action: "dismiss" | "remove") {
  const { supabase } = await assertAdmin();

  const { data: report } = await supabase.from("reports").select("skill_id").eq("id", reportId).single();
  if (!report) return;

  if (action === "remove") {
    await supabase.from("skills").update({ is_active: false }).eq("id", report.skill_id);
  } else {
    await supabase.from("skills").update({ is_flagged: false }).eq("id", report.skill_id);
  }

  await supabase
    .from("reports")
    .update({ status: action === "remove" ? "resolved" : "dismissed" })
    .eq("id", reportId);

  revalidatePath("/admin");
}

export async function toggleBanUser(userId: string, banned: boolean) {
  await assertAdmin();
  const supabase = createClient();
  await supabase.from("profiles").update({ is_banned: banned }).eq("id", userId);
  revalidatePath("/admin");
}
