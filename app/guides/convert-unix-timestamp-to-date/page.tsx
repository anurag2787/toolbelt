import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { getGuide, getRelatedGuides } from "@/lib/guides";
import { generateGuideMetadata } from "@/lib/toolMetadata";
import {
  guideArticleJsonLd,
  guideHowToJsonLd,
  guideBreadcrumbJsonLd,
  guideFaqJsonLd,
} from "@/lib/jsonLd";
import { Faq } from "@/components/shared/Faq";
import { GuideToolCta } from "@/components/shared/GuideToolCta";

const guide = getGuide("convert-unix-timestamp-to-date")!;
const relatedGuides = getRelatedGuides(guide.slug);

export const metadata: Metadata = generateGuideMetadata(guide);

export default function ConvertUnixTimestampToDateGuidePage() {
  const faqData = guideFaqJsonLd(guide);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guideArticleJsonLd(guide)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guideHowToJsonLd(guide)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guideBreadcrumbJsonLd(guide)) }}
      />
      {faqData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
        />
      )}

      <article className="mx-auto max-w-4xl w-full px-4 sm:px-6 pt-10 pb-20">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center gap-2 font-mono text-[10.5px] tracking-[0.22em] uppercase">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-[var(--fg-dim)]">
                /
              </li>
              <li>
                <Link href="/guides" className="text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">
                  Guides
                </Link>
              </li>
              <li aria-hidden="true" className="text-[var(--fg-dim)]">
                /
              </li>
              <li aria-current="page" className="text-[var(--fg)]">
                {guide.title}
              </li>
            </ol>
          </nav>
        </div>

        {/* Header / Hero */}
        <header className="mb-10 pb-8 border-b border-[var(--hairline)]">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-medium"
              style={{
                backgroundColor: `color-mix(in srgb, var(${guide.accentVar}) 12%, transparent)`,
                color: `var(${guide.accentVar})`,
              }}
            >
              <BookOpen className="w-3 h-3" />
              {guide.tagline}
            </span>
            <div className="flex items-center gap-4 text-xs font-mono text-[var(--fg-dim)]">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Published {guide.publishedAt}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {guide.readingTime}
              </span>
            </div>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[var(--fg)] leading-tight">
            {guide.title}
          </h1>

          <p className="mt-4 text-[16px] text-[var(--fg-muted)] leading-relaxed">
            A Unix timestamp is an integer that counts the number of seconds since
            1970-01-01 00:00:00 UTC (the Unix epoch), not counting leap seconds. In JavaScript,
            convert it to a human-readable date by multiplying by 1000 (to get milliseconds) and
            passing it to <code className="font-mono text-[var(--fg)]">new Date()</code> (to go back,
            divide the date&apos;s UTC milliseconds by 1000). In Python, pass the seconds directly
            to <code className="font-mono text-[var(--fg)]">datetime.fromtimestamp(seconds, tz=timezone.utc)</code>.
          </p>

          {/* Interactive tool banner */}
          <GuideToolCta guide={guide} />
        </header>

        {/* Guide Content */}
        <div className="space-y-12">

          {/* Section: Seconds vs Milliseconds */}
          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              Seconds vs milliseconds: telling them apart
            </h2>
            <div className="text-[15px] text-[var(--fg-muted)] leading-relaxed space-y-4">
              <p>
                The single most common source of confusion with Unix timestamps is the unit.
                APIs return seconds; JavaScript&apos;s <code className="font-mono text-[var(--fg)]">Date.now()</code> returns
                milliseconds; databases often store one or the other without saying which. The
                quickest way to distinguish them is to count the digits:
              </p>
              <div className="overflow-x-auto rounded-lg border border-[var(--hairline)]">
                <table className="w-full text-left text-[13.5px]">
                  <thead className="bg-[var(--bg-raise)] font-mono text-[11px] uppercase tracking-wider text-[var(--fg-dim)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Digit count</th>
                      <th className="px-4 py-3 font-medium">Unit</th>
                      <th className="px-4 py-3 font-medium">Example value</th>
                      <th className="px-4 py-3 font-medium">Approximate date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--hairline)] text-[var(--fg-muted)]">
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">10</td>
                      <td className="px-4 py-3">Seconds</td>
                      <td className="px-4 py-3 font-mono">1700000000</td>
                      <td className="px-4 py-3">2023-11-14 UTC</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">13</td>
                      <td className="px-4 py-3">Milliseconds</td>
                      <td className="px-4 py-3 font-mono">1700000000000</td>
                      <td className="px-4 py-3">2023-11-14 UTC</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">16</td>
                      <td className="px-4 py-3">Microseconds</td>
                      <td className="px-4 py-3 font-mono">1700000000000000</td>
                      <td className="px-4 py-3">2023-11-14 UTC</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">19</td>
                      <td className="px-4 py-3">Nanoseconds</td>
                      <td className="px-4 py-3 font-mono">1700000000000000000</td>
                      <td className="px-4 py-3">2023-11-14 UTC</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                A 10-digit value in seconds covers dates from 2001 to 2286, which is by far the
                most common range today. The{" "}
                <Link href="/timestamp-converter" className="text-[var(--green)] hover:underline">
                  Unix Timestamp Converter
                </Link>{" "}
                detects the unit automatically from the magnitude and tells you which one it used.
                You can always override the detection with the unit selector.
              </p>
            </div>
          </section>

          {/* Walkthrough Steps */}
          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-6">
              Step-by-step walkthrough
            </h2>
            <div className="space-y-8">
              {guide.steps.map((step, idx) => (
                <div
                  key={step.name}
                  id={`step-${idx + 1}`}
                  className="relative p-6 rounded-lg border border-[var(--hairline)] bg-[var(--bg-raise)] scroll-mt-20"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--green)]/10 border border-[var(--green)]/30 font-mono text-xs font-bold text-[var(--green)]">
                      {idx + 1}
                    </span>
                    <h3 className="font-display text-lg font-semibold text-[var(--fg)]">
                      {step.name}
                    </h3>
                  </div>
                  <p className="text-[14.5px] text-[var(--fg-muted)] leading-relaxed">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Section: UTC vs Local time */}
          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              UTC vs local time
            </h2>
            <div className="text-[15px] text-[var(--fg-muted)] leading-relaxed space-y-4">
              <p>
                A Unix timestamp is always in UTC. It has no timezone of its own — it is simply a
                count of seconds. The timezone only matters when you format the timestamp as a
                human-readable string. If you omit the timezone argument, most environments default
                to the machine&apos;s local timezone, which makes the formatted output unpredictable
                when code runs on servers in different regions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-[var(--hairline)] bg-[var(--bg-raise)]">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--green)] mb-2">
                    JavaScript
                  </div>
                  <pre className="font-mono text-[12.5px] leading-[1.7] whitespace-pre-wrap break-all text-[var(--fg)]">{`// seconds → ISO 8601 (UTC)
const seconds = 1700000000;
new Date(seconds * 1000).toISOString();
// "2023-11-14T22:13:20.000Z"

// ISO 8601 → seconds
const ms = Date.parse("2023-11-14T22:13:20Z");
const secs = Math.floor(ms / 1000);
// 1700000000`}</pre>
                </div>
                <div className="p-4 rounded-lg border border-[var(--hairline)] bg-[var(--bg-raise)]">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--green)] mb-2">
                    Python
                  </div>
                  <pre className="font-mono text-[12.5px] leading-[1.7] whitespace-pre-wrap break-all text-[var(--fg)]">{`from datetime import datetime, timezone

# seconds → ISO 8601 (UTC)
seconds = 1700000000
dt = datetime.fromtimestamp(seconds, tz=timezone.utc)
dt.isoformat()
# "2023-11-14T22:13:20+00:00"

# ISO 8601 → seconds
dt2 = datetime.fromisoformat("2023-11-14T22:13:20+00:00")
int(dt2.timestamp())
# 1700000000`}</pre>
                </div>
              </div>
              <p>
                Always pass <code className="font-mono text-[var(--fg)]">tz=timezone.utc</code> in Python
                or append{" "}<code className="font-mono text-[var(--fg)]">Z</code> to your ISO string in
                JavaScript. The{" "}
                <Link href="/timestamp-converter" className="text-[var(--green)] hover:underline">
                  Unix Timestamp Converter
                </Link>{" "}
                shows the UTC date above your local time so you can compare them.
              </p>
            </div>
          </section>

          {/* Section: ISO 8601 */}
          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              ISO 8601 format
            </h2>
            <div className="text-[15px] text-[var(--fg-muted)] leading-relaxed space-y-4">
              <p>
                ISO 8601 is the international standard for date and time strings. The most useful
                form for timestamps is the combined date-time format with a timezone designator:
              </p>
              <pre className="p-4 rounded-lg border border-[var(--hairline)] bg-[var(--bg-soft)] font-mono text-[12.5px] leading-[1.7] whitespace-pre-wrap break-all text-[var(--fg)]">{`2026-10-28T14:30:00Z        ← UTC (Z = +00:00)
2026-10-28T20:00:00+05:30   ← IST (UTC+5:30)
2026-10-28T22:13:20.000Z    ← UTC with milliseconds`}</pre>
              <p>
                JavaScript&apos;s <code className="font-mono text-[var(--fg)]">Date.toISOString()</code>{" "}
                always returns the UTC form ending in <code className="font-mono text-[var(--fg)]">Z</code>.
                The converter&apos;s ISO 8601 output field copies this string so you can paste it
                directly into JSON payloads, database columns, or log entries.
              </p>
            </div>
          </section>

          {/* Section: Timestamps before 1970 */}
          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              Timestamps before 1970
            </h2>
            <div className="text-[15px] text-[var(--fg-muted)] leading-relaxed space-y-4">
              <p>
                Negative Unix timestamps represent moments before the epoch. For example,{" "}
                <code className="font-mono text-[var(--fg)]">-86400</code> is one day before the epoch,
                which is 1969-12-31 00:00:00 UTC.
              </p>
              <p>
                JavaScript&apos;s <code className="font-mono text-[var(--fg)]">new Date(negativeSeconds * 1000)</code>{" "}
                handles negative values directly. In Python, however, calling{" "}
                <code className="font-mono text-[var(--fg)]">datetime.fromtimestamp()</code> on negative values
                may raise an <code className="font-mono text-[var(--fg)]">OverflowError</code> or{" "}
                <code className="font-mono text-[var(--fg)]">OSError</code> depending on what the host platform&apos;s
                underlying C library handles (often restricted to years in 1970 through 2038). To handle pre-1970
                timestamps reliably everywhere in Python, add a <code className="font-mono text-[var(--fg)]">timedelta</code>{" "}
                to the epoch:
              </p>
              <pre className="p-4 rounded-lg border border-[var(--hairline)] bg-[var(--bg-raise)] font-mono text-[12.5px] leading-[1.7] whitespace-pre-wrap break-all text-[var(--fg)]">{`from datetime import datetime, timezone, timedelta

# Safely handle pre-1970 timestamps across all platforms
epoch = datetime(1970, 1, 1, tzinfo=timezone.utc)
dt = epoch + timedelta(seconds=-86400)
# 1969-12-31 00:00:00+00:00`}</pre>
              <p>
                The{" "}
                <Link href="/timestamp-converter" className="text-[var(--green)] hover:underline">
                  Unix Timestamp Converter
                </Link>{" "}
                handles negative inputs seamlessly.
              </p>
            </div>
          </section>

          {/* Section: Year 2038 */}
          <section className="p-6 rounded-lg border border-[var(--amber)]/40 bg-[var(--bg-raise)]">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--amber)] mb-3">
              <AlertTriangle className="w-4 h-4" />
              Year 2038 limit
            </div>
            <h2 className="font-display text-xl font-semibold text-[var(--fg)] mb-3">
              The year 2038 problem for 32-bit systems
            </h2>
            <div className="text-[14.5px] text-[var(--fg-muted)] leading-relaxed space-y-3">
              <p>
                A signed 32-bit integer tops out at{" "}
                <code className="font-mono text-[var(--fg)]">2,147,483,647</code>. In Unix seconds,
                that maximum value corresponds to{" "}
                <strong className="text-[var(--fg)]">2038-01-19 03:14:07 UTC</strong>. One second
                later, the 32-bit counter overflows and wraps to a large negative number, which
                most systems interpret as a date in 1901.
              </p>
              <p>
                Neither JavaScript nor Python is affected: a JavaScript <code className="font-mono text-[var(--fg)]">Date</code>{" "}
                is backed by a 64-bit float of milliseconds (good for ±8.64e15 ms, reaching the year 275,760),
                and Python&apos;s integers have arbitrary precision with no fixed size. The risk remains in legacy
                32-bit C software, embedded firmware, and database columns. Note that in MySQL, the native{" "}
                <code className="font-mono text-[var(--fg)]">TIMESTAMP</code> type also tops out at 2038-01-19 03:14:07 UTC;
                affected columns should migrate to <code className="font-mono text-[var(--fg)]">BIGINT</code> or{" "}
                <code className="font-mono text-[var(--fg)]">DATETIME</code> (which goes up to the year 9999).
              </p>
            </div>
          </section>

          {/* Section: FAQ */}
          {guide.faqs && guide.faqs.length > 0 && (
            <section className="pt-6 border-t border-[var(--hairline)]">
              <h2 className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-6">
                &#47;&#47; Frequently Asked Questions
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {guide.faqs.map((f) => (
                  <Faq key={f.q} q={f.q} a={f.a} />
                ))}
              </div>
            </section>
          )}

          {/* Related Tools Navigation */}
          <section className="pt-6 border-t border-[var(--hairline)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
                Keep reading
              </div>
              <div className="font-display text-base font-semibold text-[var(--fg)] mt-1">
                Related guides and tools
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {relatedGuides.map((related) => (
                <Link
                  key={related.slug}
                  href={related.path}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--cyan)] hover:underline"
                >
                  {related.title} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ))}
              <span className="text-[var(--hairline-strong)]">·</span>
              <Link
                href="/timestamp-converter"
                className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                Unix Timestamp Converter <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>
        </div>
      </article>
    </>
  );
}
