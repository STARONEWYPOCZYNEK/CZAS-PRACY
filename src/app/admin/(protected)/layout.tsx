import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { signOutAdmin } from "../actions";

const NAV_ITEMS = [
  { href: "/admin/rozliczenie", label: "Rozliczenie" },
  { href: "/admin/rozliczone", label: "Rozliczone" },
  { href: "/admin/wpisy", label: "Wpisy" },
  { href: "/admin/pracownicy", label: "Pracownicy" },
  { href: "/admin/rodzaje-pracy", label: "Rodzaje pracy" },
];

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <nav className="flex flex-wrap gap-4">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="font-medium text-gray-700 hover:text-blue-600">
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={signOutAdmin}>
            <button type="submit" className="text-gray-500 underline">
              Wyloguj
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 p-4">{children}</main>
    </div>
  );
}
