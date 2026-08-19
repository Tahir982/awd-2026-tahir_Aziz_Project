import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import SignOutButton from "@/components/SignOutButton";

export default function Navbar({ user, isAdmin }: { user: User | null; isAdmin: boolean }) {
  return (
    <header className="border-b border-ink/10 bg-paper/95 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-display text-xl tracking-tight">
          Skill<span className="text-clay">Exchange</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/skills" className="hover:text-moss">
            Browse skills
          </Link>
          {user ? (
            <>
              <Link href="/skills/new" className="hover:text-moss">
                Offer a skill
              </Link>
              <Link href="/dashboard" className="hover:text-moss">
                Dashboard
              </Link>
              {isAdmin && (
                <Link href="/admin" className="hover:text-moss">
                  Admin
                </Link>
              )}
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-moss">
                Log in
              </Link>
              <Link href="/register" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
