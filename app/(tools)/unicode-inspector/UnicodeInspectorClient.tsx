"use client";

import { useEffect, useMemo, useState } from "react";
import {
  inspectUnicode,
  getNormalization,
  EXAMPLES,
  INSPECTION_LIMIT,
  type CodePointRow,
} from "@/lib/unicode-inspector";
import { CopyButton } from "@/components/shared/CopyButton";
import { cn } from "@/lib/cn";

const MAX_INPUT_LENGTH = 500_000;
const DEBOUNCE_MS = 120;

const labelClass = "mb-1.5 block text-sm font-medium text-[var(--fg)]";
const headingClass =
  "font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]";

const TEST_CASES: {
  input: string;
  label: string;
  expectedRows: number;
  highlight: string;
}[] = [
  {
    label: "Plain ASCII — \"Hi\"",
    input: "Hi",
    expectedRows: 2,
    highlight:
      "2 rows: H → U+0048, 1 UTF-16 unit, 1 UTF-8 byte; i → U+0069, same.",
  },
  {
    label: "Emoji — \"😀\"",
    input: "😀",
    expectedRows: 1,
    highlight:
      "1 row (not 2) — emoji is one code point U+1F600, 2 UTF-16 units (D83D DE00), 4 UTF-8 bytes (F0 9F 98 80).",
  },
  {
    label: "Combining accent — \"e\\u0301\" (looks like é)",
    input: "e\u0301",
    expectedRows: 2,
    highlight:
      "2 rows: 'e' at U+0065, then combining acute U+0301. NFC preview composes them into é (U+00E9).",
  },
  {
    label: "Precomposed é vs decomposed e+accent",
    input: "\u00e9 vs e\u0301",
    expectedRows: 6,
    highlight:
      "The first é is 1 row (U+00E9, NFC). NFD preview decomposes it. The second is 2 rows (e + U+0301, NFD). Looks identical but different code points.",
  },
  {
    label: "CRLF line ending — \"A\\r\\nB\"",
    input: "A\r\nB",
    expectedRows: 4,
    highlight:
      "4 rows: A, CR (U+000D, labeled \"CR\"), LF (U+000A, labeled \"LF\"), B. CR and LF are always separate rows.",
  },
  {
    label: "Invisible chars — \"Hello​World\" (contains U+200B)",
    input: "Hello\u200bWorld",
    expectedRows: 11,
    highlight:
      "11 rows. Row 6 (offset 5) shows ZERO WIDTH SPACE in amber — invisible but present between Hello and World.",
  },
  {
    label: "No-break space — \"Hello\\u00A0World\"",
    input: "Hello\u00a0World",
    expectedRows: 11,
    highlight:
      "Row 6 shows NO-BREAK SPACE (U+00A0) in blue (intentional). 2 UTF-8 bytes: C2 A0.",
  },
  {
    label: "BOM — \"\\uFEFFHello\"",
    input: "\ufeffHello",
    expectedRows: 6,
    highlight:
      "Row 1 (offset 0) shows BYTE ORDER MARK (BOM) at U+FEFF. 3 UTF-8 bytes: EF BB BF.",
  },
  {
    label: "ZWJ emoji sequence — \"🏳️‍🌈\"",
    input: "🏳️‍🌈",
    expectedRows: 5,
    highlight:
      "5 rows: 🏳 (U+1F3F3, 2 units), ️ variation selector (U+FE0F), ZWJ (U+200D, intentional), 🌈 (U+1F308, 2 units). Browser renders as one flag.",
  },
];

function CharCell({ row }: { row: CodePointRow }) {
  if (row.unpairedSurrogate) {
    return (
      <span
        className="inline-flex items-center justify-center rounded px-1.5 py-0.5 font-mono text-[11px] text-[var(--rose)] border border-[var(--rose)] border-opacity-40 bg-tint-rose-5"
        title="Unpaired UTF-16 surrogate — encoded as U+FFFD in UTF-8"
      >
        ⚠ surrogate
      </span>
    );
  }
  if (row.invisibleLabel) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded px-1.5 py-0.5 font-mono text-[11px] border",
          row.intentional
            ? "text-[var(--sky)] border-[var(--sky)] border-opacity-30 bg-tint-sky-5"
            : "text-[var(--amber)] border-[var(--amber)] border-opacity-30 bg-tint-amber-5"
        )}
        title={row.intentional ? "Intentional invisible character" : "Invisible character"}
      >
        {row.invisibleLabel}
      </span>
    );
  }
  return (
    <span className="font-mono text-base text-[var(--fg)]" aria-label={`character ${row.char}`}>
      {row.char}
    </span>
  );
}

function NormalizationPanel({ input }: { input: string }) {
  const norm = useMemo(() => getNormalization(input), [input]);

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-[var(--hairline)] bg-[var(--bg-raise)] px-3 py-2">
        <h2 className={headingClass}>Normalization</h2>
      </div>
      <div className="p-4 sm:p-5 space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-medium text-[var(--fg)]">
              NFC
              {norm.nfcChanged ? (
                <span className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-tint-fuchsia-5 text-[var(--fuchsia)] border border-[var(--fuchsia)] border-opacity-30">
                  changes input
                </span>
              ) : (
                <span className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-[var(--bg-raise)] text-[var(--fg-dim)] border border-[var(--hairline)]">
                  no change
                </span>
              )}
            </span>
            <CopyButton
              value={norm.nfc}
              label="Copy NFC"
              ariaLabel="Copy NFC normalized text"
              successMessage="NFC text copied"
              className="py-1"
            />
          </div>
          <pre
            className="whitespace-pre-wrap break-words rounded-xl border border-[var(--hairline)] bg-[var(--bg)] p-3 font-mono text-[13px] leading-relaxed text-[var(--fg)] min-h-[2.5rem]"
            aria-label="NFC normalized text"
          >
            {norm.nfc || <span className="text-[var(--fg-dim)] not-italic">empty</span>}
          </pre>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-medium text-[var(--fg)]">
              NFD
              {norm.nfdChanged ? (
                <span className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-tint-fuchsia-5 text-[var(--fuchsia)] border border-[var(--fuchsia)] border-opacity-30">
                  changes input
                </span>
              ) : (
                <span className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-[var(--bg-raise)] text-[var(--fg-dim)] border border-[var(--hairline)]">
                  no change
                </span>
              )}
            </span>
            <CopyButton
              value={norm.nfd}
              label="Copy NFD"
              ariaLabel="Copy NFD normalized text"
              successMessage="NFD text copied"
              className="py-1"
            />
          </div>
          <pre
            className="whitespace-pre-wrap break-words rounded-xl border border-[var(--hairline)] bg-[var(--bg)] p-3 font-mono text-[13px] leading-relaxed text-[var(--fg)] min-h-[2.5rem]"
            aria-label="NFD normalized text"
          >
            {norm.nfd || <span className="text-[var(--fg-dim)] not-italic">empty</span>}
          </pre>
        </div>
      </div>
    </div>
  );
}

function TestGuide({
  onLoad,
}: {
  onLoad: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 sm:px-5 text-left"
        aria-expanded={open}
      >
        <span className={headingClass}>How to test — inputs &amp; expected outputs</span>
        <span className="text-[var(--fg-dim)] text-lg leading-none select-none">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="border-t border-[var(--hairline)] divide-y divide-[var(--hairline)]">
          {TEST_CASES.map((tc) => (
            <div key={tc.label} className="px-4 py-3 sm:px-5 space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-[var(--fg)]">{tc.label}</p>
                <button
                  type="button"
                  onClick={() => onLoad(tc.input)}
                  className="btn py-0.5 px-2 text-[11px] shrink-0"
                >
                  Load
                </button>
              </div>
              <p className="font-mono text-[11px] text-[var(--fg-muted)] bg-[var(--bg-raise)] rounded-lg px-2.5 py-1.5 border border-[var(--hairline)]">
                Expected: {tc.highlight}
              </p>
              <p className="text-[11px] text-[var(--fg-dim)]">
                Rows in table: <span className="font-mono text-[var(--fuchsia)]">{tc.expectedRows}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function UnicodeInspectorClient() {
  const [raw, setRaw] = useState("");
  const [debouncedInput, setDebouncedInput] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedInput(raw), DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [raw]);

  const tooLong = raw.length > MAX_INPUT_LENGTH;
  const input = tooLong ? "" : debouncedInput;

  const result = useMemo(
    () => (input ? inspectUnicode(input) : null),
    [input]
  );

  const hasUnpaired = result?.rows.some((r) => r.unpairedSurrogate) ?? false;

  return (
    <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-10 space-y-4">
      {/* Input card */}
      <div className="card p-4 sm:p-5 space-y-4">
        <div>
          <label htmlFor="unicode-input" className={labelClass}>
            Text to inspect
          </label>
          <textarea
            id="unicode-input"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={5}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="Paste or type any text…"
            className="w-full resize-y rounded-xl border border-[var(--hairline)] bg-[var(--bg)] p-3 font-mono text-[13px] leading-relaxed text-[var(--fg)] placeholder:text-[var(--fg-dim)]"
            aria-describedby={tooLong ? "unicode-too-long" : undefined}
          />
          {tooLong && (
            <p
              id="unicode-too-long"
              role="alert"
              className="mt-1.5 text-sm text-[var(--rose)]"
            >
              Input is limited to {MAX_INPUT_LENGTH.toLocaleString("en-US")} characters.
            </p>
          )}
        </div>

        <div>
          <p className={labelClass}>Quick examples</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Example presets">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                title={ex.description}
                onClick={() => setRaw(ex.text)}
                className="btn text-xs py-1 px-3"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {result && (
        <div className="card px-4 py-3 sm:px-5 flex flex-wrap gap-x-6 gap-y-2">
          <StatPill label="Code points" value={result.codePointCount} />
          <StatPill label="UTF-16 code units" value={result.utf16Count} />
          <StatPill label="UTF-8 bytes" value={result.utf8ByteCount} />
        </div>
      )}

      {/* Unpaired surrogate warning */}
      {hasUnpaired && (
        <p
          role="alert"
          className="rounded-xl border border-tint-rose-30 bg-tint-rose-5 p-3 text-sm text-[var(--rose)]"
        >
          ⚠ This string contains unpaired UTF-16 surrogates. They cannot be encoded as valid UTF-8
          — each surrogate is replaced with{" "}
          <code className="font-mono">U+FFFD</code> (the replacement character) when converting to UTF-8.
        </p>
      )}

      {/* Inspection table */}
      {result && result.rows.length > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b border-[var(--hairline)] bg-[var(--bg-raise)] px-3 py-2">
            <h2 className={headingClass}>
              {result.truncated
                ? `Showing first ${INSPECTION_LIMIT.toLocaleString("en-US")} of ${result.codePointCount.toLocaleString("en-US")} code points`
                : `${result.codePointCount.toLocaleString("en-US")} code point${result.codePointCount === 1 ? "" : "s"}`}
            </h2>
          </div>

          {result.truncated && (
            <p className="border-b border-[var(--hairline)] bg-tint-amber-5 px-4 py-2 text-sm text-[var(--amber)]">
              Large input — inspection is limited to the first{" "}
              {INSPECTION_LIMIT.toLocaleString("en-US")} code points.
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Unicode code point details for each character in the input
              </caption>
              <thead>
                <tr className="border-b border-[var(--hairline)] text-[var(--fg-muted)] bg-[var(--bg-raise)]">
                  <th scope="col" className="px-3 py-2 font-medium whitespace-nowrap">Char</th>
                  <th scope="col" className="px-3 py-2 font-medium whitespace-nowrap">Code point</th>
                  <th scope="col" className="px-3 py-2 font-medium whitespace-nowrap">UTF-16 offset</th>
                  <th scope="col" className="px-3 py-2 font-medium whitespace-nowrap">UTF-16 units</th>
                  <th scope="col" className="px-3 py-2 font-medium whitespace-nowrap">UTF-8 bytes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--hairline)]">
                {result.rows.map((row, i) => (
                  <tr
                    key={`${row.utf16Offset}-${i}`}
                    className="hover:bg-[var(--bg-raise)] transition-colors"
                  >
                    <td className="px-3 py-2.5 min-w-[6rem]">
                      <CharCell row={row} />
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[var(--fuchsia)] whitespace-nowrap">
                      {row.codePointStr}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[var(--fg-muted)] whitespace-nowrap">
                      {row.utf16Offset}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[var(--fg-muted)] whitespace-nowrap">
                      {row.utf16Hex.join(" ")}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[var(--fg-muted)] whitespace-nowrap">
                      {row.utf8Hex.join(" ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {result && result.rows.length === 0 && !tooLong && (
        <div className="card px-4 py-8 text-center text-[var(--fg-dim)] text-sm">
          No characters to inspect. Type or paste text above.
        </div>
      )}

      {/* Normalization panel */}
      {result && <NormalizationPanel input={input} />}

      {/* Test guide — collapsible */}
      <TestGuide onLoad={(text) => setRaw(text)} />
    </section>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-mono text-base font-semibold text-[var(--fg)]">
        {value.toLocaleString("en-US")}
      </span>
      <span className="text-xs text-[var(--fg-dim)]">{label}</span>
    </div>
  );
}
