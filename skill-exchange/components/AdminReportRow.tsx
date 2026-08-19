"use client";

import { resolveReport } from "@/lib/actions/admin";
import { useTransition } from "react";
import Link from "next/link";

export default function AdminReportRow({ report }: { report: any }) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/skills/${report.skills?.id}`} className="font-medium hover:text-moss">
            {report.skills?.title}
          </Link>
          <p className="text-sm text-ink/70 mt-1">"{report.reason}"</p>
          <p className="text-xs text-ink/50 mt-1">
            Reported by {report.profiles?.full_name || "a student"}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            className="btn-secondary text-xs py-1"
            disabled={isPending}
            onClick={() => startTransition(() => resolveReport(report.id, "dismiss"))}
          >
            Dismiss
          </button>
          <button
            className="btn-primary text-xs py-1 bg-clay hover:bg-clay/90"
            disabled={isPending}
            onClick={() => startTransition(() => resolveReport(report.id, "remove"))}
          >
            Remove listing
          </button>
        </div>
      </div>
    </li>
  );
}
