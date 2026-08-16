"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { formSelectClassName } from "@/lib/form-styles";

export interface FormSelectOption {
  label: string;
  value: string;
}

interface FormSelectProps {
  disabled?: boolean;
  id?: string;
  label: string;
  onChange: (value: string) => void;
  options: FormSelectOption[];
  value: string;
  valueClassName?: string;
}

export function FormSelect({
  disabled = false,
  id,
  label,
  onChange,
  options,
  value,
  valueClassName,
}: FormSelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  const selected = options.find((option) => option.value === value);

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        className={`${formSelectClassName} flex items-center text-left`}
        disabled={disabled}
        id={id}
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={`min-w-0 flex-1 truncate ${valueClassName ?? ""}`}>
          {selected?.label ?? value}
        </span>
      </button>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-zinc-700 dark:text-zinc-300"
        strokeWidth={1.75}
      />
      {open ? (
        <ul
          aria-label={label}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-zinc-300 bg-white py-1 dark:border-zinc-600 dark:bg-zinc-950"
          id={listboxId}
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <li key={option.value} role="presentation">
                <button
                  aria-selected={isSelected}
                  className={`flex w-full cursor-pointer px-2.5 py-1.5 text-left text-sm text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-900 ${isSelected ? "bg-zinc-100 dark:bg-zinc-900" : ""} ${valueClassName ?? ""}`}
                  role="option"
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
