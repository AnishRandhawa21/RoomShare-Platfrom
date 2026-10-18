"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PropertySubNav } from "./PropertySubNav";
import { updateOwnerEnquiryStatusAction } from "@/actions/owner";
import {
  Mail,
  Phone,
  MessageCircle,
  Calendar,
  Building2,
  AlertCircle,
} from "lucide-react";

interface EnquiryItem {
  id: string;
  propertyId: string;
  visitorName: string;
  visitorPhone: string;
  visitorEmail?: string | null;
  channel: "DIRECT_CALL" | "WHATSAPP_CLICK" | "WEBSITE_FORM";
  moveInDate?: string | null;
  message?: string | null;
  status: "NEW" | "CONTACTED" | "VISIT_SCHEDULED" | "BOOKED" | "CLOSED";
  createdAt: string;
  property: {
    id: string;
    name: string;
    slug: string;
    locality: string;
    city: string;
  };
  roomType?: {
    id: string;
    name: string;
    monthlyRent: number;
  } | null;
  user?: {
    id: string;
    email: string;
    profile?: { fullName?: string | null } | null;
  } | null;
}

interface OwnerEnquiriesClientProps {
  initialEnquiries: EnquiryItem[];
  total: number;
  page: number;
  totalPages: number;
  propertiesList?: Array<{ id: string; name: string }>;
  propertyContext?: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
}

export function OwnerEnquiriesClient({
  initialEnquiries,
  total,
  page,
  totalPages,
  propertiesList = [],
  propertyContext,
}: OwnerEnquiriesClientProps) {
  const router = useRouter();
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>(initialEnquiries);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    propertyContext?.id || "ALL"
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const handleStatusChange = async (enquiryId: string, newStatus: any) => {
    setUpdatingId(enquiryId);
    setAlertMessage(null);

    try {
      const res = await updateOwnerEnquiryStatusAction({
        enquiryId,
        status: newStatus,
      });

      if (res.success) {
        setEnquiries((prev) =>
          prev.map((e) => (e.id === enquiryId ? { ...e, status: newStatus } : e))
        );
      } else {
        setAlertMessage(res.error || "Failed to update status.");
      }
    } catch {
      setAlertMessage("Network error updating enquiry.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredEnquiries = enquiries.filter((e) => {
    if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
    if (selectedPropertyId !== "ALL" && e.propertyId !== selectedPropertyId) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "CONTACTED":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "VISIT_SCHEDULED":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "BOOKED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CLOSED":
        return "bg-slate-100 text-slate-500 border-slate-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case "DIRECT_CALL":
        return { label: "Phone Call", icon: Phone, color: "text-blue-600 bg-blue-50" };
      case "WHATSAPP_CLICK":
        return { label: "WhatsApp", icon: MessageCircle, color: "text-emerald-600 bg-emerald-50" };
      case "WEBSITE_FORM":
        return { label: "Web Form", icon: Mail, color: "text-purple-600 bg-purple-50" };
      default:
        return { label: channel, icon: Mail, color: "text-slate-600 bg-slate-50" };
    }
  };

  return (
    <div className="space-y-6">
      {/* If propertyContext is provided, show property sub-navigation */}
      {propertyContext && (
        <PropertySubNav
          propertyId={propertyContext.id}
          propertySlug={propertyContext.slug}
          propertyName={propertyContext.name}
          status={propertyContext.status}
        />
      )}

      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {propertyContext ? `${propertyContext.name} — Enquiries` : "PG Discovery Enquiries"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real visitor leads from public listings, phone clicks, and WhatsApp enquiries. ({total}{" "}
            total)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Property Selector if in global enquiries view */}
          {!propertyContext && propertiesList.length > 0 && (
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:outline-hidden"
            >
              <option value="ALL">All Properties</option>
              {propertiesList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New Lead</option>
            <option value="CONTACTED">Contacted</option>
            <option value="VISIT_SCHEDULED">Visit Scheduled</option>
            <option value="BOOKED">Booked</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {alertMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{alertMessage}</span>
        </div>
      )}

      {/* Enquiries List */}
      <div className="space-y-3">
        {filteredEnquiries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Mail className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900">No Enquiries Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              When tenants browse your published listings on StayKro and request contact details, their
              leads will appear here in real-time.
            </p>
          </div>
        ) : (
          filteredEnquiries.map((enquiry) => {
            const channel = getChannelBadge(enquiry.channel);
            const ChannelIcon = channel.icon;

            return (
              <div
                key={enquiry.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Visitor details & contact */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {enquiry.visitorName}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${channel.color}`}
                      >
                        <ChannelIcon className="h-3 w-3" />
                        <span>{channel.label}</span>
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                          enquiry.status
                        )}`}
                      >
                        {enquiry.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <a
                        href={`tel:${enquiry.visitorPhone}`}
                        className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{enquiry.visitorPhone}</span>
                      </a>

                      {enquiry.visitorEmail && (
                        <span>• {enquiry.visitorEmail}</span>
                      )}

                      <span>
                        • Received: {new Date(enquiry.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Property & Room Type Context */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>{enquiry.property.name}</span>
                        <span className="text-slate-400">
                          ({enquiry.property.locality}, {enquiry.property.city})
                        </span>
                      </span>

                      {enquiry.roomType && (
                        <>
                          <span>•</span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            {enquiry.roomType.name} (₹
                            {enquiry.roomType.monthlyRent.toLocaleString("en-IN")}/mo)
                          </span>
                        </>
                      )}

                      {enquiry.moveInDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-emerald-700 font-medium">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Move-in:{" "}
                              {new Date(enquiry.moveInDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </span>
                        </>
                      )}
                    </div>

                    {enquiry.message && (
                      <div className="mt-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 italic">
                        &ldquo;{enquiry.message}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* Status Action Controls */}
                  <div className="flex items-center gap-2 self-start lg:self-center">
                    <span className="text-xs text-slate-400">Status:</span>
                    <select
                      value={enquiry.status}
                      disabled={updatingId === enquiry.id}
                      onChange={(e) => handleStatusChange(enquiry.id, e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:outline-hidden disabled:opacity-50"
                    >
                      <option value="NEW">New Lead</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="VISIT_SCHEDULED">Visit Scheduled</option>
                      <option value="BOOKED">Booked</option>
                      <option value="CLOSED">Closed</option>
                    </select>

                    <a
                      href={`https://wa.me/${enquiry.visitorPhone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                      title="Open WhatsApp chat"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
