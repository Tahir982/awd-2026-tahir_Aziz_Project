import { createClient } from "@/lib/supabase/server";
import SkillCard from "@/components/SkillCard";

const CATEGORIES = [
  "Programming",
  "Design",
  "Languages",
  "Music",
  "Academics",
  "Sports & Fitness",
  "Other",
];

export default async function BrowseSkillsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  const supabase = createClient();
  const q = searchParams.q?.trim() ?? "";
  const category = searchParams.category ?? "";

  let query = supabase
    .from("skills")
    .select("id, title, description, category, tags, created_at, profiles(full_name)")
    .eq("is_active", true)
    .eq("is_flagged", false)
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }
  if (category) {
    query = query.eq("category", category);
  }

  const { data: skills, error } = await query;

  return (
    <div>
      <h1 className="text-3xl mb-6">Browse skills</h1>

      <form className="mb-8 flex flex-col gap-3 sm:flex-row" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by keyword (e.g. guitar, React, Spanish)"
          className="input-field sm:flex-1"
        />
        <select name="category" defaultValue={category} className="input-field sm:w-52">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary sm:w-auto">
          Search
        </button>
      </form>

      {error && <p className="error-text">Something went wrong loading skills.</p>}

      {skills && skills.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((s: any) => (
            <SkillCard key={s.id} skill={s} />
          ))}
        </div>
      ) : (
        <p className="text-slate">No matching skills. Try a different search or category.</p>
      )}
    </div>
  );
}
