"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  BedDouble,
  Layers,
  Image as ImageIcon,
  CheckSquare,
  Mail,
  Users,
  ExternalLink,
  Settings,
  ArrowLeft,
  Star,
} from "lucide-react";

interface PropertySubNavProps {
  propertyId: string;
  propertySlug: string;
  propertyName: string;
  status: string;
}

export function PropertySubNav({
  propertyId,
  propertySlug,
  propertyName,
  status,
}: PropertySubNavProps) {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Overview",
      href: `/owner/properties/${propertyId}`,
      exact: true,
      icon: Building2,
    },
    {
      name: "Rooms Inventory",
      href: `/owner/properties/${propertyId}/rooms`,
      icon: BedDouble,
    },
    {
      name: "Room Types",
      href: `/owner/properties/${propertyId}/room-types`,
      icon: Layers,
    },
    {
      name: "Photos",
      href: `/owner/properties/${propertyId}/photos`,
      icon: ImageIcon,
    },
    {
      name: "Amenities",
      href: `/owner/properties/${propertyId}/amenities`,
      icon: CheckSquare,
    },
    {
      name: "Reviews & Ratings",
      href: `/owner/properties/${propertyId}/reviews`,
      icon: Star,
    },
    {
      name: "Enquiries",
      href: `/owner/properties/${propertyId}/enquiries`,
      icon: Mail,
    },
    {
      name: "Roommate Posts",
      href: `/owner/properties/${propertyId}/roommates`,
      icon: Users,
    },
    {
      name: "Settings / Edit",
      href: `/owner/properties/${propertyId}/edit`,
      icon: Settings,
    },
  ];

  const isTabActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="space-y-4">
      {/* Top Property Identifier Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/owner/properties"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
            title="Back to all properties"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">{propertyName}</h1>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  status === "PUBLISHED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {status}
              </span>
            </div>
            <p className="text-xs text-slate-400">Dedicated property management hub</p>
          </div>
        </div>

        <Link
          href={`/property/${propertySlug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <span>Preview Public Page</span>
          <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
        </Link>
      </div>

      {/* Property-specific Sub-Nav Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
        {tabs.map((tab) => {
          const active = isTabActive(tab.href, tab.exact);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 transition-all ${
                active
                  ? "bg-indigo-600 text-white font-bold shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${active ? "text-white" : "text-slate-400"}`} />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
