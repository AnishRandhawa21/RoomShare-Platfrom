"use client";

import { useState } from "react";
import {
  Bell,
  PhoneCall,
  Shield,
  CheckCircle2,
  Save,
} from "lucide-react";

interface OwnerSettingsClientProps {
  userEmail: string;
}

export function OwnerSettingsClient({ userEmail }: OwnerSettingsClientProps) {
  const [notifications, setNotifications] = useState({
    emailLeads: true,
    whatsappBookings: true,
    weeklyDigest: false,
  });

  const [preferences, setPreferences] = useState({
    directPhoneCall: true,
    whatsappChat: true,
    instantBookingNotice: true,
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Partner & Account Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure lead notifications, visitor contact channel visibility, and session security.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Notification Settings */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Bell className="h-4 w-4 text-indigo-600" />
            <span>Lead & Enquiry Notifications</span>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.emailLeads}
                onChange={(e) =>
                  setNotifications({ ...notifications, emailLeads: e.target.checked })
                }
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="font-semibold text-slate-800">Instant Lead Email Alerts</div>
                <div className="text-slate-500 text-[11px]">
                  Receive an immediate notification at {userEmail} whenever a tenant enquired.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.whatsappBookings}
                onChange={(e) =>
                  setNotifications({ ...notifications, whatsappBookings: e.target.checked })
                }
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="font-semibold text-slate-800">WhatsApp Lead Pushes</div>
                <div className="text-slate-500 text-[11px]">
                  Receive lead notification messages directly on your primary WhatsApp number.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.weeklyDigest}
                onChange={(e) =>
                  setNotifications({ ...notifications, weeklyDigest: e.target.checked })
                }
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="font-semibold text-slate-800">Weekly Occupancy & Enquiry Summary</div>
                <div className="text-slate-500 text-[11px]">
                  Receive a weekly performance breakdown of views, inquiries, and available beds.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Contact Preferences */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <PhoneCall className="h-4 w-4 text-emerald-600" />
            <span>Public Listing Contact Channels</span>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.directPhoneCall}
                onChange={(e) =>
                  setPreferences({ ...preferences, directPhoneCall: e.target.checked })
                }
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="font-semibold text-slate-800">Display &quot;Call Owner&quot; Button</div>
                <div className="text-slate-500 text-[11px]">
                  Allow prospective tenants to directly call your property manager number.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.whatsappChat}
                onChange={(e) =>
                  setPreferences({ ...preferences, whatsappChat: e.target.checked })
                }
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="font-semibold text-slate-800">Display &quot;Chat on WhatsApp&quot; Button</div>
                <div className="text-slate-500 text-[11px]">
                  Enable pre-filled WhatsApp inquiry click-throughs from public property listings.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Security / Role Authentication Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Shield className="h-4 w-4 text-sky-600" />
            <span>Role & Security Authorization</span>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Security Clearance:</span>
              <span className="font-bold text-emerald-700">OWNER (Enforced Server-Side)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Invitation Verification:</span>
              <span className="font-bold text-slate-900">Admin Invitation Validated</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Session Provider:</span>
              <span className="font-semibold text-slate-700">Supabase SSR Secure Cookies</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {isSaved && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>Settings preferences updated</span>
            </span>
          )}
          <button
            type="submit"
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
}
