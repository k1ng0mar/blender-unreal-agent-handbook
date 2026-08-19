import { ArrowLeft, Download, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Streamdown } from "streamdown";
import { FieldMark, fieldAsset } from "@/components/FieldMark";

const handbookUrl = fieldAsset("handbook.md");

export default function Book() {
  const [markdown, setMarkdown] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const autoPrint = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("print");

  useEffect(() => {
    let cancelled = false;
    fetch(handbookUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`handbook ${response.status}`);
        return response.text();
      })
      .then((text) => {
        if (!cancelled) {
          setMarkdown(text);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== "ready" || !autoPrint) return;
    const id = window.setTimeout(() => window.print(), 450);
    return () => window.clearTimeout(id);
  }, [status, autoPrint]);

  return (
    <main className="min-h-screen bg-[#ecebe2] text-[#1e241d]">
      <header className="no-print grain relative overflow-hidden border-b border-[#2a3128] bg-[#171a16] text-[#f6f3e8]">
        <div className="relative z-10 mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-3" aria-label="FIELD//ENGINE home">
            <FieldMark />
            <span>
              <span className="display block text-base font-semibold leading-none tracking-[-0.035em]">FIELD//ENGINE</span>
              <span className="mono mt-1 block text-[9px] uppercase tracking-[.16em] text-[#bdc6b4]">field manual atelier</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="control-pill hidden items-center gap-2 border border-[#b8c4aa]/40 px-3 py-2 text-xs font-medium text-[#e5e8de] sm:inline-flex">
              <ArrowLeft size={14} /> Map
            </Link>
            <a
              href={handbookUrl}
              download="agentic_blender_unreal_handbook.md"
              className="control-pill inline-flex items-center gap-2 border border-[#e65b35]/55 px-3 py-2 text-xs font-medium text-[#e5e8de]"
            >
              <Download size={14} /> Markdown
            </a>
            <button
              onClick={() => window.print()}
              className="control-pill inline-flex items-center gap-2 bg-[#e65b35] px-3 py-2 text-xs font-semibold text-[#fff5e9]"
            >
              <Printer size={14} /> Print brief
            </button>
          </div>
        </div>
      </header>

      <section className="paper-grid relative px-5 py-10 sm:px-8 sm:py-16 lg:px-12">
        <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          <aside className="no-print lg:sticky lg:top-8 lg:self-start">
            <div className="mono text-[10px] uppercase tracking-[0.16em] text-[#e65b35]">Fieldbook / complete text</div>
            <h1 className="display mt-4 text-3xl font-semibold tracking-[-0.045em] text-[#1e241d]">The operating manual.</h1>
            <p className="mt-4 text-sm leading-6 text-[#5b6257]">
              20 chapters. Typed control paths, interchange contracts, and evidence gates for Blender × Unreal agents.
            </p>
            <div className="field-ruler mt-6 h-2 w-full opacity-80" />
            <div className="mt-6 border-l border-[#c4df6b]/70 pl-4 text-sm leading-6 text-[#44513f]">
              Print brief outputs this document, not the site map. Save as PDF from the system print dialog.
            </div>
          </aside>

          <article className="calibration-frame plate px-5 py-8 sm:px-10 sm:py-12">
            {status === "loading" && <p className="text-sm text-[#5b6257]">Loading the handbook…</p>}
            {status === "error" && (
              <p className="text-sm text-[#8a3a28]">
                Could not load the handbook.{" "}
                <a className="editorial-link" href={handbookUrl}>
                  Open the markdown file directly
                </a>
                .
              </p>
            )}
            {status === "ready" && (
              <div className="handbook-prose max-w-[72ch] text-[17px] leading-8 text-[#2a3028]">
                <Streamdown>{markdown}</Streamdown>
              </div>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
