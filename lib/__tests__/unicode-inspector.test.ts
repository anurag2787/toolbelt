import { describe, it, expect } from "vitest";
import {
  inspectUnicode,
  getNormalization,
  utf8ByteCount,
  codePointCount,
  INSPECTION_LIMIT,
} from "../unicode-inspector";

// ─── utf8ByteCount ────────────────────────────────────────────────────────────

describe("utf8ByteCount", () => {
  it("counts 1 byte per ASCII character", () => {
    expect(utf8ByteCount("abc")).toBe(3);
  });

  it("counts 2 bytes for U+00A0 (no-break space)", () => {
    expect(utf8ByteCount("\u00a0")).toBe(2);
  });

  it("counts 3 bytes for U+2603 (snowman)", () => {
    expect(utf8ByteCount("\u2603")).toBe(3);
  });

  it("counts 4 bytes for a supplementary character (emoji)", () => {
    expect(utf8ByteCount("😀")).toBe(4);
  });

  it("counts an unpaired surrogate as 3 bytes (U+FFFD replacement)", () => {
    const lone = String.fromCharCode(0xd800); // unpaired high surrogate
    expect(utf8ByteCount(lone)).toBe(3);
  });
});

// ─── codePointCount ───────────────────────────────────────────────────────────

describe("codePointCount", () => {
  it("returns 3 for 'abc'", () => {
    expect(codePointCount("abc")).toBe(3);
  });

  it("counts a surrogate pair as one code point", () => {
    expect(codePointCount("😀")).toBe(1); // two UTF-16 units, one code point
  });

  it("counts an unpaired surrogate as one code point", () => {
    const lone = String.fromCharCode(0xd800);
    expect(codePointCount(lone)).toBe(1);
  });

  it("counts mixed BMP and supplementary characters", () => {
    expect(codePointCount("A😀B")).toBe(3);
  });
});

// ─── inspectUnicode — basic rows ──────────────────────────────────────────────

describe("inspectUnicode", () => {
  it("produces one row per ASCII character", () => {
    const { rows } = inspectUnicode("AB");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      codePoint: 0x41,
      codePointStr: "U+0041",
      char: "A",
      utf16Offset: 0,
      utf16Length: 1,
      utf16Hex: ["0041"],
      utf8Hex: ["41"],
      invisibleLabel: null,
      unpairedSurrogate: false,
    });
    expect(rows[1]).toMatchObject({ codePoint: 0x42, utf16Offset: 1 });
  });

  it("gives a supplementary character one row with two UTF-16 code units", () => {
    const { rows } = inspectUnicode("😀");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      codePoint: 0x1f600,
      codePointStr: "U+1F600",
      utf16Length: 2,
      utf16Hex: ["D83D", "DE00"],
      utf8Hex: ["F0", "9F", "98", "80"],
      invisibleLabel: null,
      unpairedSurrogate: false,
    });
  });

  it("keeps combining marks as separate rows", () => {
    // e + combining acute = two code points, not one
    const { rows } = inspectUnicode("e\u0301");
    expect(rows).toHaveLength(2);
    expect(rows[0].codePoint).toBe(0x65); // 'e'
    expect(rows[1].codePoint).toBe(0x0301); // combining acute
  });

  it("splits CRLF into two separate rows", () => {
    const { rows } = inspectUnicode("\r\n");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ codePoint: 0x0d, invisibleLabel: "CR" });
    expect(rows[1]).toMatchObject({ codePoint: 0x0a, invisibleLabel: "LF" });
  });

  it("labels an unpaired high surrogate as unpairedSurrogate and emits an empty char", () => {
    const lone = String.fromCharCode(0xd800);
    const { rows } = inspectUnicode(lone);
    expect(rows).toHaveLength(1);
    expect(rows[0].unpairedSurrogate).toBe(true);
    expect(rows[0].char).toBe("");
    expect(rows[0].utf8Hex).toEqual(["EF", "BF", "BD"]); // U+FFFD
  });

  it("labels an unpaired low surrogate as unpairedSurrogate", () => {
    const lone = String.fromCharCode(0xdc00);
    const { rows } = inspectUnicode(lone);
    expect(rows[0].unpairedSurrogate).toBe(true);
    expect(rows[0].invisibleLabel).toBe("UNPAIRED LOW SURROGATE");
  });

  it("labels zero-width space (U+200B)", () => {
    const { rows } = inspectUnicode("\u200b");
    expect(rows[0].invisibleLabel).toBe("ZERO WIDTH SPACE");
    expect(rows[0].intentional).toBe(false);
  });

  it("labels ZWJ (U+200D) as intentional", () => {
    const { rows } = inspectUnicode("\u200d");
    expect(rows[0].invisibleLabel).toBe("ZERO WIDTH JOINER");
    expect(rows[0].intentional).toBe(true);
  });

  it("labels BOM (U+FEFF)", () => {
    const { rows } = inspectUnicode("\ufeff");
    expect(rows[0].invisibleLabel).toBe("BYTE ORDER MARK (BOM)");
  });

  it("labels space and tab correctly", () => {
    const { rows } = inspectUnicode(" \t");
    expect(rows[0].invisibleLabel).toBe("SPACE");
    expect(rows[1].invisibleLabel).toBe("TAB");
  });

  it("labels no-break space (U+00A0)", () => {
    const { rows } = inspectUnicode("\u00a0");
    expect(rows[0].invisibleLabel).toBe("NO-BREAK SPACE");
    expect(rows[0].intentional).toBe(true);
  });

  it("reports correct UTF-16 offsets", () => {
    // 'A' (BMP) + emoji (2 units) + 'B' (BMP)
    const { rows } = inspectUnicode("A😀B");
    expect(rows[0].utf16Offset).toBe(0);
    expect(rows[1].utf16Offset).toBe(1); // emoji at index 1
    expect(rows[2].utf16Offset).toBe(3); // 'B' at index 3
  });

  it("reports utf16Count = input.length and correct codePointCount", () => {
    const input = "A😀B";
    const { utf16Count, codePointCount: cpCount } = inspectUnicode(input);
    expect(utf16Count).toBe(input.length); // 4
    expect(cpCount).toBe(3); // A, 😀, B
  });

  it("truncates at INSPECTION_LIMIT and sets truncated=true", () => {
    const big = "a".repeat(INSPECTION_LIMIT + 10);
    const { rows, truncated } = inspectUnicode(big);
    expect(truncated).toBe(true);
    expect(rows).toHaveLength(INSPECTION_LIMIT);
  });

  it("does not truncate exactly at the limit", () => {
    const exact = "a".repeat(INSPECTION_LIMIT);
    const { truncated } = inspectUnicode(exact);
    expect(truncated).toBe(false);
  });

  it("handles an empty string", () => {
    const result = inspectUnicode("");
    expect(result.rows).toHaveLength(0);
    expect(result.utf16Count).toBe(0);
    expect(result.codePointCount).toBe(0);
    expect(result.utf8ByteCount).toBe(0);
    expect(result.truncated).toBe(false);
  });
});

// ─── getNormalization ─────────────────────────────────────────────────────────

describe("getNormalization", () => {
  it("reports no change for plain ASCII", () => {
    const result = getNormalization("hello");
    expect(result.nfcChanged).toBe(false);
    expect(result.nfdChanged).toBe(false);
    expect(result.nfc).toBe("hello");
    expect(result.nfd).toBe("hello");
  });

  it("shows NFC composes e + combining acute into U+00E9", () => {
    // NFD input: 'e' + U+0301
    const input = "e\u0301";
    const result = getNormalization(input);
    expect(result.nfcChanged).toBe(true);
    expect(result.nfc).toBe("\u00e9"); // precomposed é
  });

  it("shows NFD decomposes U+00E9 into e + U+0301", () => {
    const input = "\u00e9"; // precomposed é
    const result = getNormalization(input);
    expect(result.nfdChanged).toBe(true);
    expect(result.nfd).toBe("e\u0301");
  });

  it("reports no change for already-NFC text", () => {
    const nfc = "\u00e9";
    const result = getNormalization(nfc);
    expect(result.nfcChanged).toBe(false);
  });
});
