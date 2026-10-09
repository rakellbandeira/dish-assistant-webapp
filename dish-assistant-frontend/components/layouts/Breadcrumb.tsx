import { Fragment } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = { label: string; href: string };

type BreadcrumbProps = {
  current: string;
  // Pages between Home and the current one
  parents?: Crumb[];
};

export default function Breadcrumb({ current, parents = [] }: BreadcrumbProps) {
  const links: Crumb[] = [{ label: "Home", href: "/" }, ...parents];

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-6 flex items-center gap-2 text-sm text-secondary"
    >
      {links.map((crumb) => (
        <Fragment key={crumb.href}>
          <Link href={crumb.href} className="hover:text-primary">
            {crumb.label}
          </Link>
          <ChevronRight size={14} aria-hidden="true" />
        </Fragment>
      ))}

      <span className="text-error" aria-current="page">
        {current}
      </span>
    </nav>
  );
}