import { useEffect, useState } from "react";
import type { AddressPoint, GeocodeSuggestion } from "@assertquest/shared";
import { FormField, TextInput } from "../ui/index.js";
import { api } from "../lib/api.js";

interface AddressFieldProps {
  id: string;
  label: string;
  value: AddressPoint | null;
  onSelect: (point: AddressPoint) => void;
}

// Address autocomplete against the mocked geocoding endpoint (FR-703).
export function AddressField({ id, label, value, onSelect }: AddressFieldProps) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);

  useEffect(() => {
    setQuery(value?.label ?? "");
  }, [value]);

  async function handleChange(next: string) {
    setQuery(next);
    if (next.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const res = await api.geocode(next);
    setSuggestions(res.results);
  }

  return (
    <div className="relative">
      <FormField label={label} htmlFor={id}>
        <TextInput id={id} name={id} autoComplete="off" value={query} onChange={(e) => handleChange(e.target.value)} />
      </FormField>
      {suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-hairline bg-white shadow-card">
          <ul aria-label={`${label} suggestions`}>
            {suggestions.map((s) => (
              <li key={s.label} className="border-b border-hairline last:border-b-0">
                <button
                  type="button"
                  onClick={() => {
                    onSelect(s);
                    setQuery(s.label);
                    setSuggestions([]);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-ink-700 transition-colors hover:bg-surface-subtle"
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
          <p className="border-t border-hairline bg-surface-subtle px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">
            mocked /geocode &middot; {suggestions.length} results
          </p>
        </div>
      )}
    </div>
  );
}
