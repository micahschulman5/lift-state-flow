import { useEffect, useState, type ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type NumberInputProps = Omit<ComponentProps<typeof Input>, "type" | "value" | "onChange" | "inputMode"> & {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
};

/**
 * Numeric input that does NOT force fallback values (e.g. `|| 60`) while typing.
 * Keeps a local draft string and commits on blur / Enter.
 */
export function NumberInput({
  value,
  onValueChange,
  min = 0,
  className,
  ...props
}: NumberInputProps) {
  const [draft, setDraft] = useState<string>(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft(String(value));
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }

    const normalized = Math.max(min, Math.floor(parsed));
    if (normalized !== value) onValueChange(normalized);
    setDraft(String(normalized));
  };

  return (
    <Input
      {...props}
      type="number"
      inputMode="numeric"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
        props.onKeyDown?.(e);
      }}
      className={cn(className)}
    />
  );
}
