"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  description?: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
  dropdownWidth?: string; // optional override e.g. "w-full" or "min-w-[240px]"
  triggerHeight?: string; // optional height e.g. "h-[50px]" (defaults to "h-[42px]")
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  icon,
  className = "",
  disabled = false,
  name,
  id,
  dropdownWidth = "w-full",
  triggerHeight = "h-[42px]",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption =
    options.find((opt) => opt.value === value) ||
    options.find(
      (opt) => opt.value.toLowerCase() === (value || "").toLowerCase()
    );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Hidden input for standard form serialization */}
      {name && <input type="hidden" name={name} id={id} value={value} />}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full ${triggerHeight} flex items-center justify-between gap-2 rounded-xl border px-3 text-xs font-semibold transition-all text-left cursor-pointer ${
          disabled
            ? "border-zinc-200 bg-zinc-100/70 text-zinc-400 cursor-not-allowed opacity-60"
            : isOpen
            ? "border-[#00412E] bg-white ring-2 ring-[#00412E]/15 text-zinc-950 shadow-xs"
            : "border-zinc-200 bg-zinc-50/80 text-zinc-800 hover:bg-white hover:border-zinc-300 shadow-2xs"
        }`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {icon && <span className="shrink-0 text-zinc-500">{icon}</span>}
          {selectedOption?.icon && (
            <span className="shrink-0">{selectedOption.icon}</span>
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#00412E]" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute left-0 top-full mt-1.5 ${dropdownWidth} min-w-[200px] rounded-2xl border border-[#E8EAE5] bg-white p-1.5 shadow-xl shadow-zinc-900/10 ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 duration-150 z-50`}
        >
          <div className="max-h-60 overflow-y-auto space-y-0.5 pr-0.5 custom-scrollbar">
            {options.map((opt) => {
              const isSelected =
                opt.value === value ||
                opt.value.toLowerCase() === (value || "").toLowerCase();
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => {
                    if (!opt.disabled) {
                      onChange(opt.value);
                      setIsOpen(false);
                    }
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all cursor-pointer ${
                    opt.disabled
                      ? "opacity-40 cursor-not-allowed"
                      : isSelected
                      ? "bg-[#00412E]/10 text-[#00412E] font-bold"
                      : "text-zinc-700 hover:bg-[#00412E]/5 hover:text-[#00412E]"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <div className="truncate">
                      <div className="truncate">{opt.label}</div>
                      {opt.description && (
                        <div className="text-[10px] text-zinc-400 font-normal truncate">
                          {opt.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {opt.badge !== undefined && (
                      <span className="text-[10px] font-medium text-zinc-400 px-1.5 py-0.5 rounded-md bg-zinc-100">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-[#00412E] shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
