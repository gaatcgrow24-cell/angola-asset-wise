import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const PRESETS = ["(EMAIL)", "(WHATSAPP)", "(REUNIÃO)"];
const OTHER = "__other__";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function RequestIdField({ value, onChange }: Props) {
  const isPreset = PRESETS.includes(value);
  const [mode, setMode] = useState<string>(() =>
    !value ? "" : isPreset ? value : OTHER,
  );

  useEffect(() => {
    // Keep mode in sync if value changes externally
    if (!value) {
      setMode("");
    } else if (PRESETS.includes(value)) {
      setMode(value);
    } else {
      setMode(OTHER);
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <Select
        value={mode}
        onValueChange={(v) => {
          setMode(v);
          if (v === OTHER) {
            // keep current free-text value (if any)
            if (PRESETS.includes(value)) onChange("");
          } else {
            onChange(v);
          }
        }}
      >
        <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          <SelectItem value={OTHER}>Outro…</SelectItem>
        </SelectContent>
      </Select>
      {mode === OTHER && (
        <Input
          placeholder="Especificar origem do pedido"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
