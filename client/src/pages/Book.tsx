import { ArrowLeft, BookOpen, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Streamdown } from "streamdown";

const handbookUrl = `${import.meta.env.BASE_URL}handbook.md`;

export default function Book() {
  const [markdown, setMarkdown] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

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

  return (
    <main className="min-h-screen bg-[#ecebe2] text-[#1e241d]">
      <header className="sticky top-0 z-20 border-b border-[#2a3128] bg-[#171a16] text-[#f6f3e8]">
        <div className="mx-auto flex max-w-[980px] items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-[#d8dccf]">
            <ArrowLeft size={14} /> Back to the map
          </Link>
          <div className="flex items-center gap-2">
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
              <BookOpen size={14} /> Print / PDF
            </button>
          </div>
        </div>
      </header>

      <article className="mx-auto max-w-[860px] px-5 py-14 sm:px-8 sm:py-20">
        <div className="mono mb-6 text-[11px] uppercase tracking-[0.16em] text-[#e65b35]">
          Fieldbook / complete text
        </div>
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
          <div className="handbook-prose text-[17px] leading-8 text-[#2a3028]">
            <Streamdown>{markdown}</Streamdown>
          </div>
        )}
      </article>
    </main>
  );
}
