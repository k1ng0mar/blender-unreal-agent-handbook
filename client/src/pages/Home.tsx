/**
 * Field Manual Atelier design reminder: this is a tactile research desk, not a generic dashboard.
 * Use ink-dark field notes, a parchment evidence plane, moss-green action signals, and off-axis editorial framing.
 */
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  ClipboardCheck,
  Copy,
  ExternalLink,
  FileArchive,
  Layers3,
  Link2,
  LockKeyhole,
  Network,
  Play,
  Printer,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Workflow,
} from "lucide-react";
import { useMemo, useState } from "react";
import { FieldMark, fieldAsset } from "@/components/FieldMark";
import { Link } from "wouter";
import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SOURCE_COUNTS = [
  { name: "Blender primary", count: 9, color: "#5f8640" },
  { name: "Unreal primary", count: 14, color: "#243d34" },
  { name: "MCP specification", count: 2, color: "#c78e3d" },
  { name: "Epic ecosystem", count: 2, color: "#7c6c55" },
  { name: "Video analysis", count: 2, color: "#a45b42" },
];

const CONTROL_PATHS = [
  {
    id: "query",
    name: "Read-only query",
    kind: "R0 · inspect",
    reproducibility: 5,
    blastRadius: 1,
    discoverability: 5,
    evidence: 5,
    copy: "The opening move. Enumerate scene, project, asset, plugin, and contract state before deciding what to change.",
    examples: ["Blender inventory", "Unreal Asset Registry", "MCP capability probe"],
  },
  {
    id: "typed",
    name: "Typed operation",
    kind: "R1 · constrained mutation",
    reproducibility: 5,
    blastRadius: 2,
    discoverability: 5,
    evidence: 5,
    copy: "The preferred production surface: small schema-first tools with idempotency, an explicit target, and a structured result.",
    examples: ["validate_asset_set", "rename_asset", "preflight_import"],
  },
  {
    id: "script",
    name: "Versioned script",
    kind: "R1–R2 · staged job",
    reproducibility: 4,
    blastRadius: 3,
    discoverability: 3,
    evidence: 4,
    copy: "Use a saved, hashed Python file when a targeted tool cannot express the job. Pair it with isolated workspaces and tests.",
    examples: ["Blender --python", "Unreal commandlet", "PythonAutomationTest"],
  },
  {
    id: "mcp",
    name: "Local MCP toolset",
    kind: "R1–R3 · agent bridge",
    reproducibility: 4,
    blastRadius: 4,
    discoverability: 5,
    evidence: 4,
    copy: "A discoverable interface for an agent. Keep it local, typed, serial where the editor demands it, and scoped by policy.",
    examples: ["Unreal MCP", "Blender Lab MCP", "job progress"],
  },
  {
    id: "injection",
    name: "Inline injection",
    kind: "R4 · high-trust escape hatch",
    reproducibility: 2,
    blastRadius: 5,
    discoverability: 1,
    evidence: 2,
    copy: "Reserve raw code strings for brief trusted diagnostics. Never feed unreviewed prompt text straight to an interpreter.",
    examples: ["--python-expr", "-script=<code>", "editor console"],
  },
];

const TOOL_COMPARISON = [
  { metric: "Reproducibility", query: 5, typed: 5, script: 4, mcp: 4, injection: 2 },
  { metric: "Discoverability", query: 5, typed: 5, script: 3, mcp: 5, injection: 1 },
  { metric: "Evidence", query: 5, typed: 5, script: 4, mcp: 4, injection: 2 },
  { metric: "Safety margin", query: 5, typed: 4, script: 3, mcp: 2, injection: 1 },
];

const CHAPTERS = [
  ["01", "Operating model", "Intent → state → action → evidence"],
  ["03", "Blender control", "Data API, BMesh, CLI, security"],
  ["07", "Unreal control", "Python, utilities, commandlets, tests"],
  ["10", "Interchange", "Contracts for USD, glTF, and import"],
  ["11", "MCP architecture", "Typed tools, local trust boundaries"],
  ["14", "Execution protocol", "Inspect, stage, apply, validate"],
];

const REFERENCES = [
  { label: "Blender Python API", href: "https://docs.blender.org/api/current/info_overview.html", group: "Blender" },
  { label: "Blender CLI arguments", href: "https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html", group: "Blender" },
  { label: "Blender scripting security", href: "https://docs.blender.org/manual/en/latest/advanced/scripting/security.html", group: "Blender" },
  { label: "Blender Lab MCP", href: "https://www.blender.org/lab/mcp-server/", group: "Blender" },
  { label: "Unreal editor Python", href: "https://dev.epicgames.com/documentation/unreal-engine/scripting-the-unreal-editor-using-python", group: "Unreal" },
  { label: "Unreal Interchange", href: "https://dev.epicgames.com/documentation/unreal-engine/importing-assets-using-interchange-in-unreal-engine", group: "Unreal" },
  { label: "Unreal MCP", href: "https://dev.epicgames.com/documentation/unreal-engine/unreal-mcp-in-unreal-editor", group: "Unreal" },
  { label: "Model Context Protocol specification", href: "https://modelcontextprotocol.io/specification/2026-07-28", group: "MCP" },
  { label: "MCP security best practices", href: "https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices", group: "MCP" },
];

function SectionHead({ number, label, title, body }: { number: string; label: string; title: string; body: string }) {
  return (
    <div className="max-w-3xl">
      <div className="section-number mb-4 text-[11px] font-medium uppercase">{number} / {label}</div>
      <h2 className="display text-3xl font-semibold tracking-[-0.045em] text-[#1e241d] sm:text-5xl">{title}</h2>
      <p className="mt-5 max-w-2xl text-base leading-7 text-[#53584e] sm:text-lg">{body}</p>
    </div>
  );
}

export default function Home() {
  const [activePath, setActivePath] = useState("typed");
  const [referenceFilter, setReferenceFilter] = useState("All");
  const [copied, setCopied] = useState(false);
  const activeControl = CONTROL_PATHS.find((path) => path.id === activePath) ?? CONTROL_PATHS[1];
  const filteredReferences = useMemo(
    () => REFERENCES.filter((ref) => referenceFilter === "All" || ref.group === referenceFilter),
    [referenceFilter],
  );

  const copyLink = async () => {
    await navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1700);
  };

  return (
    <main className="min-h-screen bg-[#ecebe2] text-[#1e241d]">
      <section className="grain relative overflow-hidden bg-[#171a16] text-[#f6f3e8]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,22,18,.96)_0%,rgba(18,22,18,.82)_43%,rgba(18,22,18,.25)_100%)]" />
        <div className="absolute inset-0 bg-cover bg-center opacity-75 mix-blend-screen" style={{ backgroundImage: `url('${fieldAsset("images/field-engine-hero.png")}')` }} />
        <header className="no-print relative z-10 mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
          <a href="#top" className="flex items-center gap-3" aria-label="FIELD//ENGINE home">
            <FieldMark />
            <span><span className="display block text-base font-semibold leading-none tracking-[-0.035em]">FIELD//ENGINE</span><span className="mono mt-1 block text-[9px] uppercase tracking-[.16em] text-[#bdc6b4]">field manual atelier</span></span>
          </a>
          <nav className="hidden items-center gap-7 text-xs font-medium text-[#d8dccf] lg:flex">
            <a className="nav-link" href="#method">Method</a>
            <Link className="nav-link" href="/book">Read the book</Link>
            <a className="nav-link" href="#control-paths">Control paths</a>
            <a className="nav-link" href="#playbook">Playbook</a>
            <a className="nav-link" href="#sources">Sources</a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={copyLink} className="control-pill hidden items-center gap-2 border border-[#e65b35]/55 px-3 py-2 text-xs font-medium text-[#e5e8de] sm:flex">
              {copied ? <Check size={14} /> : <Link2 size={14} />}{copied ? "Copied" : "Share"}
            </button>
            <a href={`${import.meta.env.BASE_URL}book?print=1`} className="control-pill flex items-center gap-2 bg-[#e65b35] px-3 py-2 text-xs font-semibold text-[#fff5e9]">
              <Printer size={14} /> Print brief
            </a>
          </div>
        </header>

        <div id="top" className="relative z-10 mx-auto grid min-h-[650px] max-w-[1440px] items-end px-5 pb-16 pt-24 sm:px-8 sm:pb-20 lg:grid-cols-[1.2fr_.8fr] lg:px-12">
          <div className="field-ruler absolute left-5 top-24 h-3 w-[calc(100%-2.5rem)] opacity-80 sm:left-8 sm:w-[calc(100%-4rem)] lg:left-12 lg:w-[calc(100%-6rem)]" />
          <div className="rise-in max-w-4xl">
            <div className="mono mb-7 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-[#e65b35]"><span className="h-px w-9 bg-[#e65b35]" /> Research fieldbook / 2026.08 / index R29</div>
            <h1 className="display max-w-4xl text-5xl font-semibold leading-[.94] tracking-[-0.065em] sm:text-7xl lg:text-[92px]">
              Directing a game world with <span className="text-[#e65b35]">evidence.</span>
            </h1>
            <p className="rise-in-delay mt-8 max-w-xl text-base leading-7 text-[#d2d8cb] sm:text-lg">
              A research-led operating manual for agents that inspect, build, validate, and safely automate Blender and Unreal Engine—not by guessing at UI steps, but by moving through verifiable control paths.
            </p>
            <div className="mt-10 flex flex-wrap gap-3 text-xs">
              <Link href="/book" className="control-pill inline-flex items-center gap-2 bg-[#e65b35] px-4 py-3 font-semibold text-[#fff5e9]">Read the book <ArrowDownRight size={15} /></Link>
              <a href="#method" className="control-pill inline-flex items-center gap-2 border border-[#b8c4aa]/40 px-4 py-3 font-semibold text-[#eef2e9]">Enter the field map <ArrowDownRight size={15} /></a>
            </div>
          </div>
          <div className="rise-in-delay mt-14 flex justify-end lg:mt-0">
            <div className="max-w-[285px] border-l border-[#c4df6b]/45 pl-5 text-sm leading-6 text-[#d5dacd]">
              <div className="mono mb-3 text-[10px] uppercase tracking-[0.14em] text-[#e65b35]">Field premise / calibration 07</div>
              The dependable agent is not the one that writes the most Python. It is the one that chooses the least powerful action that can prove its own result.
            </div>
          </div>
        </div>
      </section>

      <section id="method" className="paper-grid relative border-b border-[#c8c7ba] bg-[#ecebe2] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-[1320px] gap-16 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
          <SectionHead number="01" label="Method" title="The agent is a pipeline participant, not a macro recorder." body="Every operation begins with a desired-state contract: target workspace, formats, acceptance checks, and explicit permissions. This makes automation inspectable before it becomes destructive." />
          <div className="calibration-frame grid gap-px overflow-hidden border border-[#c8c7ba] bg-[#c8c7ba] sm:grid-cols-2">
            {[
              ["Intent", "What outcome is required?", "Natural language becomes a constrained job contract."],
              ["State", "What exists now?", "Inventory, hashes, asset metadata, and visual proof come first."],
              ["Action", "What may change?", "Use the least-capable control surface that can complete the job."],
              ["Evidence", "How do we know?", "Tests, manifests, report files, and clean deltas—not an optimistic sentence."],
            ].map(([title, subtitle, body], index) => (
              <article key={title} className="group min-h-[190px] bg-[#f8f6ed] p-6 transition-colors duration-200 hover:bg-[#e3edbd]">
              <div className="mono text-[11px] text-[#d6512f]">0{index + 1} / 04</div>
                <h3 className="display mt-6 text-xl font-semibold tracking-[-0.035em]">{title}</h3>
                <p className="mt-1 text-sm font-medium text-[#44513f]">{subtitle}</p>
                <p className="mt-4 text-sm leading-6 text-[#62665b]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#f8f6ed] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <SectionHead number="02" label="Research corpus" title="Primary documentation anchors the argument." body="The manual triangulates official Blender, Unreal, and MCP documentation with maintained ecosystem sources and carefully qualified practitioner video analysis. The composition below is a count of the 29 cited references." />
            <div className="border-l-2 border-[#6c8e3f] pl-4 text-sm text-[#5a614f] md:max-w-[270px]">No source is treated as a universal recipe. Version, plugin state, experimental status, and trust boundary are called out where they affect behavior.</div>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_.9fr]">
            <div className="plate min-h-[360px] p-5 sm:p-8">
              <div className="mb-4 flex items-center justify-between"><div><div className="mono text-[10px] uppercase tracking-[.14em] text-[#d6512f]">Source composition</div><h3 className="display mt-1 text-xl font-semibold">Reference base by source family</h3></div><BookOpen size={20} className="text-[#d6512f]" /></div>
              <ResponsiveContainer width="100%" height={275}>
                <BarChart data={SOURCE_COUNTS} layout="vertical" margin={{ top: 6, right: 20, left: 8, bottom: 6 }}>
                  <XAxis type="number" hide domain={[0, 15]} />
                  <YAxis type="category" dataKey="name" width={115} tick={{ fill: "#566053", fontSize: 12, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "#dfe9bd" }} contentStyle={{ borderRadius: 0, border: "1px solid #aeb49e", fontFamily: "DM Sans", fontSize: 12 }} />
                  <Bar dataKey="count" radius={0} barSize={20}>{SOURCE_COUNTS.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mono mt-1 text-[10px] leading-5 text-[#747a6e]">Counts are bibliographic categories, not a quality score. Full citations are in the downloadable fieldbook.</div>
            </div>
            <div className="overflow-hidden border border-[#c8c7ba] bg-[#1c211c] text-[#eff0e8]">
              <img src={fieldAsset("images/agent-bridge.png")} alt="Abstract visualization of an agent bridge between a mesh graph and a built world" className="h-[210px] w-full object-cover opacity-80" />
              <div className="p-7"><div className="mono text-[10px] uppercase tracking-[.14em] text-[#e65b35]">Core thesis</div><h3 className="display mt-3 text-3xl font-semibold tracking-[-.04em]">Capability is not reliability.</h3><p className="mt-4 max-w-xl text-sm leading-6 text-[#cdd4c7]">Python, CLI, and MCP can all drive an editor. Production quality comes from typed contracts, safe staging, verified state transitions, and reports that survive the agent session.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="control-paths" className="bg-[#1b201b] px-5 py-20 text-[#f3f0e5] sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
            <div><div className="section-number mb-4 text-[11px] uppercase text-[#e65b35]">03 / Control paths</div><h2 className="display text-4xl font-semibold leading-[.98] tracking-[-.055em] sm:text-5xl">Choose the least powerful action that can prove its result.</h2><p className="mt-6 max-w-md text-base leading-7 text-[#cdd4c7]">Explore the operational rubric. Scores are a transparent authorial assessment from the research, shown to compare trade-offs—not external performance measurements.</p></div>
            <div className="border border-[#6d7d61]/50 bg-[#222922] p-3 sm:p-5">
              <div className="h-[295px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={TOOL_COMPARISON} outerRadius="72%">
                    <PolarGrid stroke="#627054" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "#cdd4c7", fontSize: 11, fontFamily: "DM Mono" }} />
                    <Radar name={activeControl.name} dataKey={activeControl.id} stroke="#e65b35" fill="#e65b35" fillOpacity={0.28} />
                    <Tooltip contentStyle={{ borderRadius: 0, border: "1px solid #809172", background: "#171a16", color: "#f5f2e7", fontFamily: "DM Sans", fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {CONTROL_PATHS.map((path) => (
                <button key={path.id} onClick={() => setActivePath(path.id)} className={`control-pill flex items-center justify-between border px-4 py-4 text-left ${activePath === path.id ? "border-[#e65b35] bg-[#e65b35] text-[#fff5e9]" : "border-[#55634c] bg-[#202720] text-[#e8ebe2]"}`}>
                  <span><span className="display block text-base font-semibold">{path.name}</span><span className={`mono mt-1 block text-[10px] uppercase ${activePath === path.id ? "text-[#465d30]" : "text-[#9aa893]"}`}>{path.kind}</span></span><ChevronRight size={17} /></button>
              ))}
            </div>
            <div className="plate-dark p-7 sm:p-9">
              <div className="flex items-start justify-between gap-4"><div><div className="mono text-[10px] uppercase tracking-[.14em] text-[#e65b35]">Selected control</div><h3 className="display mt-2 text-3xl font-semibold tracking-[-.045em]">{activeControl.name}</h3></div><ShieldCheck className="shrink-0 text-[#e65b35]" size={26} /></div>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#d4dacd]">{activeControl.copy}</p>
              <div className="mt-8 grid gap-3 border-y border-[#57644e] py-5 sm:grid-cols-4">
                {[["Reproducibility", activeControl.reproducibility], ["Evidence", activeControl.evidence], ["Discovery", activeControl.discoverability], ["Blast radius", activeControl.blastRadius]].map(([label, value]) => <div key={String(label)}><div className="mono text-[10px] uppercase text-[#a8b49f]">{label}</div><div className="display mt-1 text-2xl text-[#f1f3e9]">{value}/5</div></div>)}
              </div>
              <div className="mt-6"><div className="mono text-[10px] uppercase tracking-[.14em] text-[#a8b49f]">Typical anchors</div><div className="mt-3 flex flex-wrap gap-2">{activeControl.examples.map((item) => <span key={item} className="border border-[#66755a] px-3 py-2 text-xs text-[#e0e5dc]">{item}</span>)}</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#ecebe2] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1320px]">
          <SectionHead number="04" label="Two authoring environments" title="Different runtimes. One evidence standard." body="Blender rewards data-block aware scripting and disciplined control of context, auto-execution, and threading. Unreal layers editor-only Python onto asset-aware APIs, import pipelines, tests, commandlets, and build graphs." />
          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <article className="overflow-hidden border border-[#c8c7ba] bg-[#f8f6ed]"><img src={fieldAsset("images/blender-workbench.png")} alt="Blender workbench with a stone architectural study" className="h-56 w-full object-cover" /><div className="p-7"><div className="flex items-center justify-between"><span className="mono text-[10px] uppercase tracking-[.14em] text-[#6d833f]">Blender / field notes</span><TerminalSquare size={19} className="text-[#59723a]" /></div><h3 className="display mt-4 text-3xl font-semibold tracking-[-.045em]">State lives in data blocks.</h3><p className="mt-4 text-sm leading-6 text-[#5b6257]">Prefer <code className="mono text-[12px]">bpy.data</code> for deterministic reads and writes. Use operators only with explicit mode and selection. Run unknown blend files with auto-execution disabled; keep Blender API mutations on its main thread.</p><a href="https://docs.blender.org/api/current/info_gotcha.html" target="_blank" rel="noreferrer" className="editorial-link mt-6 inline-flex items-center gap-2 text-sm font-semibold">Read the Blender API cautions <ExternalLink size={14} /></a></div></article>
            <article className="overflow-hidden border border-[#c8c7ba] bg-[#f8f6ed]"><img src={fieldAsset("images/unreal-worldbuilding.png")} alt="Unreal-style courtyard and gatehouse under construction" className="h-56 w-full object-cover" /><div className="p-7"><div className="flex items-center justify-between"><span className="mono text-[10px] uppercase tracking-[.14em] text-[#6d833f]">Unreal / field notes</span><Layers3 size={19} className="text-[#59723a]" /></div><h3 className="display mt-4 text-3xl font-semibold tracking-[-.045em]">Assets are not ordinary files.</h3><p className="mt-4 text-sm leading-6 text-[#5b6257]">Use EditorAssetLibrary and AssetTools—not raw filesystem moves. Run reusable jobs via commandlets, gate builds through BuildGraph, and preserve test reports as artifacts. Python belongs to the Editor, not runtime gameplay.</p><a href="https://dev.epicgames.com/documentation/unreal-engine/scripting-the-unreal-editor-using-python" target="_blank" rel="noreferrer" className="editorial-link mt-6 inline-flex items-center gap-2 text-sm font-semibold">Read Unreal editor Python guidance <ExternalLink size={14} /></a></div></article>
          </div>
        </div>
      </section>

      <section id="playbook" className="relative overflow-hidden bg-[#efe6d5] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="absolute -right-32 top-0 h-[540px] w-[540px] rounded-full border-[80px] border-[#e65b35]/25" />
        <div className="relative mx-auto max-w-[1320px]">
          <div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr] lg:gap-24"><SectionHead number="05" label="Execution protocol" title="Inspect. Stage. Apply. Validate." body="The most portable lesson in the full fieldbook is a nine-step protocol that makes an agent’s work visible, reversible where possible, and independent of vendor-specific chat behavior." /><div className="calibration-frame grid gap-2 sm:grid-cols-3">{[
            ["01", "Parse", "Turn request into contract."], ["02", "Discover", "Check versions and plugins."], ["03", "Inspect", "Capture current truth."], ["04", "Plan", "List actions before mutation."], ["05", "Preflight", "Check paths, budgets, conflicts."], ["06", "Stage", "Use a safe workspace."], ["07", "Apply", "Use the least-risk tool."], ["08", "Validate", "Run tests and prove output."], ["09", "Report", "Return artifacts and recovery."],
          ].map(([num, title, copy]) => <div key={num} className="border border-[#d9a18b] bg-[#f8f0e4]/90 p-5"><div className="mono text-[10px] text-[#c84e2e]">{num}</div><h3 className="display mt-5 text-xl font-semibold tracking-[-.035em]">{title}</h3><p className="mt-2 text-sm leading-5 text-[#66584f]">{copy}</p></div>)}</div></div>
          <div className="mt-14 border-t border-[#dfad99] pt-8"><div className="grid gap-8 md:grid-cols-[.7fr_1.3fr]"><div><div className="mono text-[10px] uppercase tracking-[.14em] text-[#c84e2e]">Explicit escalation</div><p className="mt-3 text-lg font-medium leading-7 text-[#3d2b25]">Destructive, project-wide, external, or raw-code steps do not quietly happen. They become an approval request with effects and a rollback reference.</p></div><pre className="overflow-x-auto bg-[#29231f] p-5 text-xs leading-6 text-[#f3e8de]"><code>{`{
  "status": "awaiting_approval",
  "reason": "Reimport would replace 14 material assignments.",
  "effects": ["reimport_overwrite"],
  "rollback": "snapshot / revision reference",
  "evidence": "artifact://job_42/conflicts.json"
}`}</code></pre></div></div>
        </div>
      </section>

      <section className="bg-[#f8f6ed] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1320px]"><SectionHead number="06" label="Fieldbook map" title="One book. Six launch points." body="The complete handbook is organized as an escalating manual, from safe inspection to advanced MCP architecture, script policy, interchange contracts, automated tests, and implementation sequencing." />
          <div className="mt-12 grid gap-px border border-[#c8c7ba] bg-[#c8c7ba] md:grid-cols-2 lg:grid-cols-3">{CHAPTERS.map(([num, title, copy], index) => <article key={num} className="group min-h-[185px] bg-[#f8f6ed] p-6 transition-colors hover:bg-[#f1ded1]"><div className="flex items-start justify-between"><span className="mono text-[11px] text-[#c84e2e]">{num}</span><ArrowUpRight size={16} className="text-[#a25841] opacity-0 transition-opacity group-hover:opacity-100" /></div><h3 className="display mt-9 text-2xl font-semibold tracking-[-.04em]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#60665c]">{copy}</p></article>)}</div>
          <div className="mt-8 flex flex-col justify-between gap-5 border-y border-[#c8c7ba] py-6 md:flex-row md:items-center"><div className="flex items-center gap-3"><FileArchive className="text-[#d6512f]" size={21} /><div><div className="display font-semibold">The full fieldbook is on this site.</div><div className="mt-1 text-sm text-[#62685c]">20 chapters, code patterns, risk taxonomy, workflow playbooks, and 29 reference links.</div></div></div><div className="flex gap-3"><Link href="/book" className="control-pill inline-flex items-center gap-2 bg-[#e65b35] px-4 py-3 text-sm font-semibold text-[#fff5e9]"><BookOpen size={15} /> Read the book</Link><a href={`${import.meta.env.BASE_URL}handbook.md`} download="agentic_blender_unreal_handbook.md" className="control-pill inline-flex items-center gap-2 border border-[#d17b61] px-4 py-3 text-sm font-semibold text-[#7d3826]">Download markdown <ArrowDownRight size={15} /></a></div></div>
        </div>
      </section>

      <section id="sources" className="bg-[#20261f] px-5 py-20 text-[#edf0e8] sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1320px]"><div className="grid gap-10 md:grid-cols-[1fr_.8fr]"><div><div className="section-number mb-4 text-[11px] uppercase text-[#c4df6b]">07 / References</div><h2 className="display text-4xl font-semibold leading-[.98] tracking-[-.055em] sm:text-5xl">Trace every operating claim back to its source.</h2><p className="mt-6 max-w-xl text-base leading-7 text-[#cbd2c6]">The website is a navigable map of the research. The attached full fieldbook carries the complete reference section, source qualifications, and technical examples.</p></div><div className="border-l border-[#6a7b5d] pl-5 text-sm leading-6 text-[#b9c4b4]"><LockKeyhole size={18} className="mb-3 text-[#c4df6b]" />Security posture is not a footnote. Both native Blender and native Unreal MCP routes document important trust limits; MCP itself says tools represent arbitrary execution paths.</div></div>
          <div className="no-print mt-12 flex flex-wrap gap-2">{["All", "Blender", "Unreal", "MCP"].map((filter) => <button key={filter} onClick={() => setReferenceFilter(filter)} className={`control-pill border px-3 py-2 text-xs font-semibold ${referenceFilter === filter ? "border-[#e65b35] bg-[#e65b35] text-[#fff5e9]" : "border-[#68775c] text-[#dce1d6]"}`}>{filter}</button>)}</div>
          <div className="mt-6 grid gap-px border border-[#55634b] bg-[#55634b] sm:grid-cols-2 lg:grid-cols-3">{filteredReferences.map((ref) => <a key={ref.label} href={ref.href} target="_blank" rel="noreferrer" className="group flex min-h-[110px] flex-col justify-between bg-[#20261f] p-5 transition-colors hover:bg-[#2b3428]"><div className="mono text-[10px] uppercase tracking-[.13em] text-[#c4df6b]">{ref.group}</div><div className="mt-5 flex items-end justify-between gap-3"><span className="display text-base font-medium leading-5 text-[#f0f2eb]">{ref.label}</span><ExternalLink size={15} className="shrink-0 text-[#94a58a] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></div></a>)}</div>
        </div>
      </section>

      <footer className="no-print bg-[#171a16] px-5 py-8 text-[#c5ccc0] sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1320px] flex-col justify-between gap-5 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><FieldMark /><div><div className="display text-base font-semibold text-[#edf0e8]">FIELD//ENGINE</div><div className="mono mt-1 text-[10px] uppercase tracking-[.12em] text-[#e65b35]">field manual atelier / Blender × Unreal research</div></div></div><div className="flex items-center gap-4 text-xs"><Link className="nav-link" href="/book">Read the book</Link><a className="nav-link" href="#top">Back to top</a><button className="nav-link inline-flex items-center gap-1" onClick={copyLink}>{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "Link copied" : "Copy link"}</button></div></div></footer>
    </main>
  );
}
