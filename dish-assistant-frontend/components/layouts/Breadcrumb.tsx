import Link from "next/link";
import { ChevronRight } from "lucide-react";

type BreadcrumbProps = {
  current: string;
};

export default function Breadcrumb({ current }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-6 flex items-center gap-2 text-sm text-secondary"
    >
      <Link href="/" className="hover:text-primary">
        Home
      </Link>

      <ChevronRight size={14} aria-hidden="true" />

      <span className="text-error" aria-current="page">
        {current}
      </span>
    </nav>
  );
}