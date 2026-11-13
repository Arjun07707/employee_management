"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  disabled?: boolean;
  invalid?: boolean;
  /** Id of the listbox element, referenced by the trigger's aria-controls. */
  listId: string;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelect(): SelectContextValue {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used inside <Select>");
  }
  return context;
}

export interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  children: React.ReactNode;
}

/**
 * Lightweight custom Select built on the native semantics of buttons and a
 * listbox. Keyboard: Enter/Space/ArrowDown open, arrows move, Enter selects,
 * Escape closes, Tab closes.
 */
export function Select({
  value,
  onValueChange,
  disabled,
  invalid,
  children,
}: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const listId = React.useId();

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const context = React.useMemo<SelectContextValue>(
    () => ({ value, onValueChange, open, setOpen, disabled, invalid, listId }),
    [value, onValueChange, open, disabled, invalid, listId],
  );

  return (
    <SelectContext.Provider value={context}>
      <div ref={ref} className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { open, disabled, invalid, setOpen, listId } = useSelect();

  return (
    <button
      ref={ref}
      type="button"
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-controls={open ? listId : undefined}
      aria-invalid={invalid || undefined}
      disabled={disabled}
      onClick={() => setOpen(!open)}
      onKeyDown={(event) => {
        if (
          event.key === "ArrowDown" ||
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          setOpen(true);
        }
      }}
      className={cn(
        "flex h-10 w-full items-center justify-between gap-2 rounded-input border border-border bg-surface-2 px-3 py-2 text-left text-sm text-foreground",
        "transition-[border-color,box-shadow,background-color] duration-200",
        "hover:bg-surface focus-visible:border-primary focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        invalid && "border-danger focus-visible:ring-danger",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown
        aria-hidden="true"
        className={cn(
          "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
          open && "rotate-180",
        )}
      />
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

export function SelectValue({ placeholder }: { placeholder: string }) {
  const { value } = useSelect();
  return <span className="truncate">{value || placeholder}</span>;
}

export const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { open, listId } = useSelect();

  if (!open) return null;

  return (
    <div
      ref={ref}
      id={listId}
      role="listbox"
      data-state={open ? "open" : "closed"}
      className={cn(
        "absolute left-0 top-[calc(100%+6px)] z-40 w-full overflow-hidden rounded-input border border-border bg-surface p-1 shadow-card-md",
        "animate-scale-in",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, children, value: itemValue, ...props }, ref) => {
  const { value, onValueChange, setOpen } = useSelect();
  const selected = value === itemValue;

  return (
    <button
      ref={ref}
      type="button"
      role="option"
      aria-selected={selected}
      onClick={() => {
        onValueChange(itemValue);
        setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onValueChange(itemValue);
          setOpen(false);
        }
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
        selected
          ? "bg-primary-soft text-primary"
          : "text-foreground hover:bg-surface-2",
        className,
      )}
      {...props}
    >
      <span className="flex-1 truncate">{children}</span>
      {selected ? (
        <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
      ) : null}
    </button>
  );
});
SelectItem.displayName = "SelectItem";
