"use client";

import Link from "next/link";

const LINKS = [
  { href: "/blocks/markets", label: "Markets" },
  { href: "/blocks/news", label: "News" },
  { href: "/blocks/podcasts", label: "Podcasts" },
  { href: "/blocks/learn", label: "Learn" },
  { href: "/blocks/myco", label: "MYCO" },
  { href: "/blocks/settings", label: "Settings" },
];

export default function QuickLinksModule() {
  return (
    <div className="flex flex-wrap gap-x-0.5 gap-y-0 leading-tight">
      {LINKS.map(({ href, label }) => (
        <Link key={href} href={href} className="text-xs text-stone-500 hover:text-stone-300">
          {label}
        </Link>
      ))}
    </div>
  );
}
