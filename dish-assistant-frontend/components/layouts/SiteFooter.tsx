import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="flex items-center justify-between px-8 py-5 border-t border-secondary/15 text-xs text-secondary font-body">
      <span>&copy; {new Date().getFullYear()} Dish assistant</span>
      <nav className="flex gap-6">
        <Link href="/about">About</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/contact">Contact</Link>
      </nav>
    </footer>
  );
}
