import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SkillCard from "@/components/SkillCard";

export default async function HomePage() {
  const supabase = createClient();
  const { data: skills } = await supabase
    .from("skills")
    .select("id, title, description, category, tags, created_at, profiles(full_name)")
    .eq("is_active", true)
    .eq("is_flagged", false)
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <div>
      <section className="grid gap-8 py-10 md:grid-cols-2 md:items-center">
        <div>
          <p className="badge mb-4">Peer-to-peer learning, on campus</p>
          <h1 className="text-4xl md:text-5xl leading-tight mb-4">
            Teach what you know.
            <br />
            Learn what you don't.
          </h1>
          <p className="text-slate mb-6 max-w-md">
            Every student here has something worth teaching — a language, an
            instrument, a language of code. Trade sessions with classmates,
            no tuition required.
          </p>
          <div className="flex gap-3">
            <Link href="/skills" className="btn-primary">
              Browse skills
            </Link>
            <Link href="/register" className="btn-secondary">
              Get started
            </Link>
          </div>
        </div>
        <div className="card bg-sand/40 border-dashed">
          <p className="font-display text-lg mb-3">How it works</p>
          <ol className="space-y-3 text-sm text-ink/80">
            <li><span className="font-semibold text-moss">1.</span> List a skill you can teach, or browse what others offer.</li>
            <li><span className="font-semibold text-moss">2.</span> Book an open time slot that works for you.</li>
            <li><span className="font-semibold text-moss">3.</span> Meet, learn, and leave a review.</li>
          </ol>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl">Recently listed</h2>
          <Link href="/skills" className="text-sm text-moss underline">
            View all
          </Link>
        </div>
        {skills && skills.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((s: any) => (
              <SkillCard key={s.id} skill={s} />
            ))}
          </div>
        ) : (
          <p className="text-slate">No skills listed yet — be the first to add one.</p>
        )}
      </section>
    </div>
  );
}
