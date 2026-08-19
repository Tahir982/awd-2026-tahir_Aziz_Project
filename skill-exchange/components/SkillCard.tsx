import Link from "next/link";

type Skill = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  profiles?: { full_name: string } | null;
};

export default function SkillCard({ skill }: { skill: Skill }) {
  return (
    <Link href={`/skills/${skill.id}`} className="card block hover:shadow-md transition">
      <span className="badge mb-2">{skill.category}</span>
      <h3 className="font-display text-lg mb-1">{skill.title}</h3>
      <p className="text-sm text-slate line-clamp-2 mb-3">{skill.description}</p>
      <div className="flex items-center justify-between text-xs text-ink/60">
        <span>{skill.profiles?.full_name || "A student"}</span>
        {skill.tags?.length > 0 && <span>#{skill.tags[0]}</span>}
      </div>
    </Link>
  );
}
