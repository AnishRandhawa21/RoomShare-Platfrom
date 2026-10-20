"use client";

import { useState, useRef, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Clock,
  Check,
} from "lucide-react";

interface CustomDatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (date: string) => void;
  minDate?: string; // "YYYY-MM-DD" (optional, prevents picking earlier dates)
  placeholder?: string;
  className?: string;
  required?: boolean;
  name?: string;
  id?: string;
  accentColor?: "emerald" | "violet" | "green";
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseYMD(str: string): Date | null {
  if (!str) return null;
  const parts = str.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function toYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRelativeLabel(dateStr: string): string | null {
  if (!dateStr) return null;
  const target = parseYMD(dateStr);
  if (!target) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1 && diffDays <= 30) return `In ${diffDays} days`;
  if (diffDays > 30 && diffDays <= 60) return "In ~1 month";
  return null;
}

export function CustomDatePicker({
  value,
  onChange,
  minDate,
  placeholder = "Select date",
  className = "",
  required = false,
  name,
  id,
  accentColor = "green",
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current selected date or fallback to today
  const selectedDate = parseYMD(value);
  const today = new Date();
  const todayYMD = toYMD(today);

  // Month & Year state currently being viewed in the calendar
  const [viewYear, setViewYear] = useState(() =>
    selectedDate ? selectedDate.getFullYear() : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(() =>
    selectedDate ? selectedDate.getMonth() : today.getMonth()
  );

  // Sync viewed month with selectedDate when opened
  useEffect(() => {
    if (isOpen && selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }, [isOpen, value]);

  // Close on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Navigate months
  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Calendar days grid calculations
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Days from previous month
  const prevMonthDays = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push(daysInPrevMonth - i);
  }

  // Days of current month
  const currentMonthDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push(i);
  }

  // Days of next month to fill complete 6 or 5 rows (always fill to multiple of 7)
  const totalDaysSoFar = prevMonthDays.length + currentMonthDays.length;
  const trailingDaysCount = (7 - (totalDaysSoFar % 7)) % 7;
  const nextMonthDays = [];
  for (let i = 1; i <= trailingDaysCount; i++) {
    nextMonthDays.push(i);
  }

  const handleDaySelect = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day);
    onChange(toYMD(newDate));
    setIsOpen(false);
  };

  const handleShortcut = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const ymd = toYMD(target);
    onChange(ymd);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    setIsOpen(false);
  };

  const formattedDisplay = selectedDate
    ? `${String(selectedDate.getDate()).padStart(2, "0")}-${String(
        selectedDate.getMonth() + 1
      ).padStart(2, "0")}-${selectedDate.getFullYear()}`
    : "";

  const relativeBadge = value ? getRelativeLabel(value) : null;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button Input */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[42px] flex items-center justify-between rounded-xl border px-3 text-xs font-medium transition-all text-left group ${
          isOpen
            ? "border-[#00412E] bg-white ring-2 ring-[#00412E]/15 shadow-sm"
            : "border-zinc-200 bg-zinc-50/80 hover:bg-white hover:border-zinc-300"
        }`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              isOpen
                ? "bg-[#00412E] text-white"
                : "bg-[#00412E]/10 text-[#00412E] group-hover:bg-[#00412E]/15"
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
          </div>

          <div className="flex items-center gap-2 truncate">
            {value ? (
              <>
                <span className="font-semibold text-zinc-900 text-xs">
                  {formattedDisplay}
                </span>
                {relativeBadge && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00412E]/10 text-[#00412E] border border-[#00412E]/20">
                    {relativeBadge}
                  </span>
                )}
              </>
            ) : (
              <span className="text-zinc-400">{placeholder}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 text-zinc-400">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-1 rounded-md hover:bg-zinc-200 text-zinc-400 hover:text-zinc-600 transition-colors"
              title="Clear date"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <span className="text-[10px] text-zinc-400 font-semibold px-1 py-0.5 rounded bg-zinc-100">
            {isOpen ? "Close" : "Pick"}
          </span>
        </div>
      </button>

      {/* Hidden input for form serialization / required validation */}
      <input
        type="hidden"
        value={value}
        required={required}
        name={name || "targetMoveInDate"}
        id={id}
      />

      {/* Dropdown Calendar Popup */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-2 z-50 w-[310px] sm:w-[330px] rounded-2xl bg-white border border-[#E8EAE5] shadow-2xl shadow-zinc-900/15 p-4 ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 duration-150"
          style={{ transformOrigin: "top left" }}
        >
          {/* Quick Shortcuts */}
          <div className="flex items-center gap-1.5 pb-3 border-b border-zinc-100 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => handleShortcut(0)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 hover:bg-[#00412E]/10 hover:text-[#00412E] text-zinc-700 transition-all shrink-0"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleShortcut(1)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 hover:bg-[#00412E]/10 hover:text-[#00412E] text-zinc-700 transition-all shrink-0"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => handleShortcut(7)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-all shrink-0 font-bold"
            >
              +1 Week
            </button>
            <button
              type="button"
              onClick={() => handleShortcut(30)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 hover:bg-[#00412E]/10 hover:text-[#00412E] text-zinc-700 transition-all shrink-0"
            >
              +1 Month
            </button>
          </div>

          {/* Month & Year Navigation Header */}
          <div className="flex items-center justify-between pt-3 pb-2 px-1">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous month"
              className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5 font-bold text-sm text-zinc-900 tracking-tight">
              <span>{MONTH_NAMES[viewMonth]}</span>
              <span className="text-zinc-500 font-normal">{viewYear}</span>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next month"
              className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center py-1.5 border-b border-zinc-100 mb-1">
            {DAYS_SHORT.map((day) => (
              <span
                key={day}
                className="text-[10px] font-bold uppercase tracking-wider text-zinc-400"
              >
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Prev month muted padding days */}
            {prevMonthDays.map((day) => (
              <div
                key={`prev-${day}`}
                className="h-8 sm:h-9 flex items-center justify-center text-[11px] font-medium text-zinc-300 select-none pointer-events-none"
              >
                {day}
              </div>
            ))}

            {/* Current month selectable days */}
            {currentMonthDays.map((day) => {
              const currentYMD = toYMD(new Date(viewYear, viewMonth, day));
              const isSelected = value === currentYMD;
              const isToday = todayYMD === currentYMD;
              const isPast = minDate ? currentYMD < minDate : false;

              return (
                <button
                  key={`cur-${day}`}
                  type="button"
                  disabled={isPast}
                  onClick={() => handleDaySelect(day)}
                  className={`relative h-8 sm:h-9 w-full rounded-xl flex flex-col items-center justify-center text-xs transition-all ${
                    isSelected
                      ? "bg-[#00412E] text-white font-bold shadow-md shadow-[#00412E]/30 scale-105 z-10"
                      : isPast
                      ? "text-zinc-300 cursor-not-allowed"
                      : isToday
                      ? "bg-[#00412E]/10 text-[#00412E] font-bold hover:bg-[#00412E]/20"
                      : "text-zinc-700 hover:bg-[#00412E]/10 hover:text-[#00412E] font-medium"
                  }`}
                >
                  <span>{day}</span>
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#00412E]" />
                  )}
                </button>
              );
            })}

            {/* Next month muted padding days */}
            {nextMonthDays.map((day) => (
              <div
                key={`next-${day}`}
                className="h-8 sm:h-9 flex items-center justify-center text-[11px] font-medium text-zinc-300 select-none pointer-events-none"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Bottom Bar: Clear & Today & Done */}
          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="text-zinc-500 hover:text-zinc-900 font-semibold transition-colors"
            >
              Clear
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onChange(todayYMD);
                  setIsOpen(false);
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#00412E] hover:bg-[#00412E]/10 transition-colors"
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-lg bg-[#00412E] text-white font-bold text-[11px] hover:bg-[#003425] transition-colors shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
