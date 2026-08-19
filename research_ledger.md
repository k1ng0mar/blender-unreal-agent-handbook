# Research Ledger — Blender × Unreal Engine Agent Field Book

## Confirmed Input Streams

The research corpus will be developed across **eight source streams**: official product manuals; official API/reference documentation; official version and migration notes; official sample projects and repositories; authoritative standards documentation (USD, glTF, FBX-related guidance where publicly documented); source repositories and issue trackers; educational video transcripts from recognized practitioners; and high-quality independent technical blogs or talks. Official materials are the factual source of record; community material is used for operational patterns and marked accordingly.

| Stream | Planned Scope | Evidence Weight | Use in Final Book |
|---|---|---:|---|
| Blender documentation | Python API, CLI, Python security, scripting, extensions, I/O | Primary | Controls, code patterns, limitations |
| Unreal documentation | Python API, command line, editor automation, build/cook/package, Interchange | Primary | Controls, code patterns, limitations |
| Open standards | USD, glTF, material/coordinate conventions | Primary | Interoperability and validation |
| Official repositories | Source/examples, plugin APIs, MCP implementations | Primary / secondary | Implementation references |
| Video transcripts | Official talks and technical training | Secondary | Operational context and common workflows |
| Engineering blogs | Pipeline and reliability discussion | Secondary | Practical implementation guidance |
| Community knowledge | Carefully qualified operational tips and pitfalls | Tertiary | Troubleshooting and anti-patterns |
| Empirical synthesis | Cross-source comparison and agent architecture | Analytical | Original recommendations, explicitly labeled |

## Source Records

### B01 — Blender scripting introduction

**URL:** https://docs.blender.org/manual/en/latest/advanced/scripting/introduction.html

**Type:** Official Blender Manual. **Captured:** 2026-08-18. **Version shown by source:** Blender 5.2 LTS.

**Findings:** The manual states that Python scripts can extend most Blender areas, including animation, rendering, import/export, object creation, and repetitive-task automation. It distinguishes add-ons, modules, presets, startup scripts, and custom one-time scripts; it directs users to the current Python API and quickstart.

### B02 — Blender Python API overview

**URL:** https://docs.blender.org/api/current/info_overview.html

**Type:** Official Blender Python API. **Captured:** 2026-08-18.

**Findings:** The API reference organizes access around application modules including `bpy.context`, `bpy.data`, `bpy.msgbus`, `bpy.ops`, and `bpy.types`. It also exposes dedicated material on best practice, gotchas, operators, modes, mesh access, threading, and Blender as a Python module. This supports a critical distinction in the book: direct datablock mutation, context-sensitive operators, and UI state must not be conflated.

### B03 — Blender command-line arguments

**URL:** https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html

**Type:** Official Blender Manual. **Captured:** 2026-08-18. **Version shown by source:** Blender 5.2 LTS.

**Findings:** The current manual documents command-line execution and dedicated switches for running Python files, expressions, text blocks, and console modes. This is a primary source for headless/batch execution patterns and their security implications.

### B04 — Blender 5.0 Python API migration notes

**URL:** https://developer.blender.org/docs/release_notes/5.0/python_api/

**Type:** Official Blender Developer Documentation. **Captured:** 2026-08-18.

**Findings:** Blender 5.0 introduced a substantial Python API migration surface spanning runtime-defined properties, bundled modules, GPU/rendering, image/video, assets, nodes, Alembic, USD, mesh/modeling, animation/rigging, and math utilities. An autonomous agent must identify the running Blender release and avoid version-agnostic assumptions.

## Initial Technical Baseline

The document will use the **latest stable documentation at capture time** for factual statements, preserving compatibility notes where Blender 4.2 LTS, 4.5 LTS, 5.0, and 5.2 LTS differ. It will treat automation as a controlled execution problem: an agent should discover version and extension state, construct a narrow plan, execute with recorded inputs/outputs, validate artifacts, and stop or request confirmation for potentially destructive or costly operations.

### U01 — Unreal Editor Python scripting

**URL:** https://dev.epicgames.com/documentation/unreal-engine/scripting-the-unreal-editor-using-python

**Type:** Official Unreal Engine 5.8 Documentation. **Captured:** 2026-08-18. **Rendered page verified:** 2026-08-18.

**Findings:** Python support is supplied by the project-specific Python Editor Script Plugin, with Editor Scripting Utilities recommended for common editor tasks. The documented embedded Python version is 3.11.8. Python is editor-only: it can automate the editor and content pipelines but is not a gameplay scripting runtime. The `unreal` module reflects Blueprint-exposed APIs, which means the available Python surface may expand as project or plugin Blueprint exposure changes.

The page describes interactive console execution, command-line execution with `-ExecutePythonScript`, a fast commandlet route using `-run=pythonscript -script=...`, automatic `init_unreal.py`, project startup scripts, and Editor-only Blueprint nodes. It warns that commandlets do not automatically load a level and documents loading it explicitly through `LevelEditorSubsystem`. It directs users to use Unreal asset APIs rather than Python filesystem functions so internal content references are preserved. It also documents `unreal.ScopedEditorTransaction` for coherent undo/redo history and native logging APIs for operational feedback.

### U02 — Unreal Automation Tool overview

**URL:** https://dev.epicgames.com/documentation/unreal-engine/unreal-automation-tool-overview-for-unreal-engine

**Type:** Official Unreal Engine Documentation. **Captured:** 2026-08-18.

**Findings:** Automation Tool is a host and supporting libraries for unattended Unreal-related operations, implemented through C# automation projects and `BuildCommand` discovery. Epic identifies building, cooking, running, testing, and build-farm operations as internal use cases. Its documented command interface accepts sequential commands and options such as `-Help`, `-List`, `-P4`, `-Submit`, and `-NoCompile`; the source is located under `Engine/Source/Programs/AutomationTool`.

### U03 — Unreal Engine 5.8 release notes

**URL:** https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-5-8-release-notes

**Type:** Official Unreal Engine 5.8 Documentation. **Captured:** 2026-08-18.

**Findings:** The current release notes identify UE 5.8 as a release with broad tooling changes across rendering, character/animation, worldbuilding, PCG, and related systems. The document will use this as the current-version reference point and qualify individual APIs by their documented availability and stability classification (for example, Experimental, Beta, or Production Ready), rather than treating all current features as equally safe for autonomous production use.

### M01 — Unreal MCP

**URL:** https://dev.epicgames.com/documentation/unreal-engine/unreal-mcp-in-unreal-editor?lang=en-US

**Type:** Official Unreal Engine documentation, Experimental. **Captured:** 2026-08-18.

**Findings:** Unreal Engine 5.8 documents an in-process MCP server that lets MCP-compatible agents invoke editor Tool calls through local HTTP. It is experimental and subject to change. The standard setup enables **Unreal MCP** and **All Toolsets**, starts a local server (default `http://127.0.0.1:8000/mcp`), and configures a client. Tool calls are synchronized onto the Engine game thread and executed serially; clients should avoid overlapping tool calls. Toolsets can be authored in Python (`unreal.ToolsetDefinition` plus `@toolset_registry.tool_call`) or C++ (`UToolsetDefinition` / `UFUNCTION(meta=(AICallable))`), with typed parameters and structured returns producing useful schemas.

The official documentation explicitly states that the loopback server has **no authentication layer** and is not safe to expose remotely. It supports HTTP and server-sent events, but not stdio or WebSocket transports. Tool search is the default for keeping schema volume manageable. These facts make local-only binding, narrow capability sets, serialized calls, structured returns, inspectable logs, and explicit user authorization central design requirements for an autonomous-agent integration.

### M02 — Model Context Protocol specification and architecture

**URLs:** https://modelcontextprotocol.io/specification/2025-11-25 and https://modelcontextprotocol.io/docs/learn/architecture

**Type:** Official protocol specification and architecture documentation. **Captured:** 2026-08-18.

**Findings:** MCP is a JSON-RPC based protocol whose host, client, and server roles are distinct. Servers can expose tools, resources, and prompts; it has standard capability discovery, progress, cancellation, error handling, and logging. The specification states that tool behavior can be arbitrary code execution and should be treated with caution; explicit user consent and understandable operational controls are central trust-and-safety principles. Streamable HTTP and stdio are documented transport patterns. These protocol-level principles shape the book's proposed agent gateway: tools must be typed, capability-scoped, observable, serializable when the host application requires it, and guarded by confirmation on high-impact calls.

### M03 — Community Unreal MCP example

**URL:** https://github.com/chongdashu/unreal-mcp

**Type:** Third-party open-source implementation; experimental. **Captured:** 2026-08-18.

**Findings:** This community implementation uses a native Unreal plugin with a local TCP bridge and a separate Python FastMCP server. It demonstrates actor, Blueprint, editor, and graph tool categories, but its README declares the project experimental and not recommended for production. It is retained as an architectural comparison only; the final book will distinguish it clearly from Epic's current in-engine Unreal MCP.

### M04 — Blender MCP Server

**URL:** https://www.blender.org/lab/mcp-server/

**Type:** Official Blender Lab page. **Captured and rendered-page verified:** 2026-08-18.

**Findings:** Blender now provides a lightweight MCP server path through Blender Lab for Blender 5.1+. It requires an add-on, an MCP-capable LLM client, and a server component; Blender has no built-in LLM connection functionality outside this setup. The official security warning is unusually direct: LLM-generated code is executed in Blender without guards against removing data or sending it to a remote location, so Blender recommends a virtual machine or environment without sensitive information. The page illustrates scene analysis, data-block renaming, relationship querying, scene debugging, Geometry Nodes documentation, and validation checks as intended workflow categories. The final book will treat the official integration as an emerging, useful but high-trust execution surface rather than a safe unattended production control plane.

### M05 — Community Blender MCP and embedded-server examples

**URLs:** https://github.com/ahujasid/blender-mcp and https://github.com/dcc-mcp/dcc-mcp-blender

**Type:** Third-party open-source implementations. **Captured:** 2026-08-18.

**Findings:** `ahujasid/blender-mcp` uses a Blender socket-server add-on plus a separate Python MCP server and exposes an unrestricted Python-execution capability. Its README advises saving work and highlights optional telemetry and third-party asset integrations; it is explicitly not a Blender-made integration. `dcc-mcp-blender` demonstrates an embedded Streamable HTTP server, typed skills and tool namespaces, explicit headless dispatching, validation and interchange tools, and configurable switches that can disable arbitrary Python/script execution. These projects supply useful design comparisons, but their tool lists and releases must be verified against the installed version. The final recommendations prefer narrow typed actions, read-only inspection before mutation, capability flags, and a separate escape-hatch tool only in an explicit high-trust mode.

### B05 — Blender runtime safety and mesh control

**URLs:** https://docs.blender.org/api/current/info_gotcha.html, https://docs.blender.org/api/current/info_gotchas_threading.html, and https://docs.blender.org/api/current/bmesh.html

**Type:** Official Blender Python API. **Captured:** 2026-08-18.

**Findings:** Blender's Python documentation collects dedicated guidance on internal data lifetime, operators, modes and mesh access, plus a standalone BMesh module for low-level mesh editing. Blender explicitly states that its Python integration is not thread safe: uncontrolled Python threads can cause difficult-to-diagnose crashes, including during rendering and Python-driver work. Threads are only acceptable while the main Blender thread is blocked and no Blender API is used; independent work should use separate processes. This supports a main-thread mutation queue and out-of-process workers for compute, downloads, or preprocessing.

### B06 — Blender scripting security

**URL:** https://docs.blender.org/manual/en/latest/advanced/scripting/security.html

**Type:** Official Blender 5.2 LTS Manual. **Captured and rendered-page verified:** 2026-08-18.

**Findings:** Blender explains that Python in blend files is inherently privileged, and only trusted sources should run it. Automatic script execution is disabled by default, but registered text blocks and animation-driver expressions are automatic execution paths; manual text-editor runs and Freestyle execution remain relevant. Agents must distinguish opening/importing data from authorizing arbitrary script execution. In background mode the `--enable-autoexec` and `--disable-autoexec` flags override preferences, which supports an explicit secure-by-default policy: use `--disable-autoexec` for unknown inputs and enable only after a documented trust decision.

### B07 — Blender as module and API quickstart

**URLs:** https://docs.blender.org/api/current/info_advanced_blender_as_bpy.html and https://docs.blender.org/api/current/info_quickstart.html

**Type:** Official Blender Python API. **Captured:** 2026-08-18.

**Findings:** Blender documents a module embedding path alongside CLI execution. The book will present this as an advanced integration choice, not a casual replacement for the executable: module distribution, embedded binary dependencies, version matching, process isolation, and in-process lifecycle must be deliberately managed. For ordinary automation, invoking the matching Blender executable with a dedicated script, explicit paths, controlled exit codes, and a manifest is generally easier to reproduce. The quickstart and overview confirm that `bpy` is the main API surface for editing application data and running tools.

### B08 — Blender USD and glTF interchange

**URLs:** https://docs.blender.org/manual/en/latest/files/import_export/usd.html and https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html

**Type:** Official Blender 5.2 LTS Manual. **Captured:** 2026-08-18.

**Findings:** Blender maps USD prim hierarchies into Blender objects, but does not yet handle all USD composition semantics (notably layers and references) on import. It converts Y-up USD scenes to Blender's Z-up convention, provides unit conversion, and notes that Preview Surface-to-Principled conversion is lossy. The USD exporter supports a broad but bounded set of objects and offers orientation, units, evaluated animation, custom-property, texture-path, and material controls. Its documented limits include unsupported USD layers/variants on export, only perspective camera export, material-node constraints, incomplete Geometry Nodes/instancing cases, and texture/archive caveats. These facts support a contract-first interchange strategy: source format, up/forward axes, scale, texture policy, visibility/evaluation state, material subset, expected objects, and acceptance checks must be declared before an agent exports or imports assets.

### U04 — Interchange Framework

**URL:** https://dev.epicgames.com/documentation/unreal-engine/importing-assets-using-interchange-in-unreal-engine

**Type:** Official Unreal Engine documentation. **Captured:** 2026-08-18.

**Findings:** Interchange is Unreal's file-format-agnostic, asynchronous, customizable import/export framework. It transforms source data to intermediate nodes, applies an ordered pipeline stack, and uses factories to produce assets. Pipeline stacks and custom pipelines can be authored in C++, Blueprints, or Python; the documentation includes Python import and Python `InterchangePythonPipelineBase` examples. Interchange Preview and conflict views offer preflight surfaces an autonomous agent can leverage before it commits an import. The documentation classifies Interchange FBX support as experimental and states that import/reimport remembers its pipeline stack/options. Agent integrations should pin and report the pipeline profile, avoid unreviewed reimport overwrites, and validate results through asset checks after import.

### U05 — USD in Unreal Engine

**URL:** https://dev.epicgames.com/documentation/unreal-engine/universal-scene-description-in-unreal-engine

**Type:** Official Unreal Engine documentation; Beta. **Captured:** 2026-08-18.

**Findings:** Unreal's USD integration is Beta and supports a USD Stage workflow that keeps USD data native instead of immediately converting to Unreal assets. It supports a broad range of prim representations, non-destructive edits, stage hierarchy, payloads, Preview Surface materials, and bidirectional Python workflows. An agent must distinguish stage editing from asset import: saving a Stage writes USD changes back to its source file, while import converts stage data into Content Browser assets and actors. Unreal warns that static lighting is not automatically generated when opening USD data on a stage, which can produce black scenes after static lighting builds. These are critical validation points in a Blender–USD–Unreal workflow.

### U06 — Unreal build and graph automation

**URLs:** https://dev.epicgames.com/documentation/unreal-engine/build-operations-cooking-packaging-deploying-and-running-projects-in-unreal-engine and https://dev.epicgames.com/documentation/unreal-engine/buildgraph-for-unreal-engine

**Type:** Official Unreal Engine documentation. **Captured:** 2026-08-18.

**Findings:** Unreal Automation Tool executes build, cook, stage, package, deploy, and run operations through `BuildCookRun`; direct command-line operation is possible but Epic cautions that hand-authoring arguments is error-prone and suggests deriving them from a verified custom launch profile. BuildGraph is the XML graph automation system that integrates with UnrealBuildTool, UAT, and the Editor. It represents dependencies, outputs, machine groups, notification recipients, manual triggers, and distributable graph nodes. An autonomous agent should therefore treat a release build as a declared graph with recorded inputs, platform target, configuration, artifact locations, test gates, and human approval gates—not merely issue an opaque packaging command.

### U07 — Sequencer, editor utilities, and Python API surface

**URLs:** https://dev.epicgames.com/documentation/unreal-engine/python-scripting-in-sequencer-in-unreal-engine, https://dev.epicgames.com/documentation/unreal-engine/scripting-the-unreal-editor-using-blueprints, and https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/?application_version=5.8

**Type:** Official Unreal Engine 5.8 documentation and API reference. **Captured:** 2026-08-18.

**Findings:** Unreal’s Sequencer Python documentation exposes a hierarchy of LevelSequence, bindings, tracks, sections, channels, and keys. It illustrates asset creation/loading, exact frame-rate and playback-range control, actor bindings through `EditorActorSubsystem` and `LevelSequenceEditorSubsystem`, track/section creation, and refresh steps. Autonomous cinematics tools should preserve frame-rate/timebase metadata and enumerate existing bindings before adding new ones. Editor Utility Widgets are the recommended flexible user-interface approach for editor scripting; Editor Utility Blueprints suit editor-only logic; Call-in-Editor supports a hybrid editor/runtime case; and startup objects are appropriate only for predictable project initialization. Editor-only mutation APIs must be invoked from editor-only classes. The 5.8 Python API reference demonstrates a very large reflected `unreal` surface that includes scoped transactions, slow-task progress, automation-related types, and subsystem classes, reinforcing the need for runtime discovery and version/plugin-aware capability checks instead of hard-coded assumed APIs.

### U08 — Rendered-page validation: Interchange and BuildGraph

**URLs:** https://dev.epicgames.com/documentation/unreal-engine/importing-assets-using-interchange-in-unreal-engine and https://dev.epicgames.com/documentation/unreal-engine/buildgraph-for-unreal-engine

**Type:** Rendered official Unreal documentation. **Captured:** 2026-08-18.

**Findings:** The rendered Interchange documentation confirms that project-default pipelines are explicit, reimport records the previous stack and options, and the runtime Blueprint example is limited for skeletal mesh/animation data. The rendered BuildGraph documentation confirms XML graph semantics, dependency closure when targeting nodes, tagged artifacts, conditional properties/options/environment variables, and distributed node execution via exported JSON, `-SingleNode`, and shared storage. The handbook will advise agents to carry a machine-readable operation manifest—source hashes, project/engine version, plugin state, target, pipeline profile, expected artifacts, and test evidence—through each of these boundaries.

### X01 — Epic BlenderTools ecosystem

**URLs:** https://github.com/EpicGames/BlenderTools and https://www.unrealengine.com/en-US/blog/download-our-new-blender-addons

**Type:** Epic Games maintained open-source repository and Epic blog announcement. **Captured:** 2026-08-18.

**Findings:** Epic maintains BlenderTools under an MIT license, including Send to Unreal for one-click asset transfer and UE to Rigify for node-based Blender Rigify retargeting of Unreal marketplace character assets. The 2020 announcement establishes its intent to streamline Blender–Unreal asset movement and points to official tutorial playlists. The book will treat these as operational components that need explicit version compatibility testing, setup documentation, and per-asset verification—rather than assume a one-click transfer establishes complete semantic fidelity.

### V02 — Unreal Fest: Using Python to Streamline Asset Workflows

**URL:** https://www.youtube.com/watch?v=FOSwlDQY6N0

**Type:** Unreal Fest Europe 2019 practitioner video, presented by Marcus White (Unit 2 Games), analyzed from audio and visual content; not a verbatim transcript. **Captured:** 2026-08-18.

**Findings:** The talk describes a small-team UE4 production pipeline in which Python reduced manual variation in outsourced-asset ingestion and asset-status tracking. Its example standardizes material naming before importing, batches texture processing, presents a purpose-built editor UI, and synchronizes structured asset data with external project tracking. It frames scripts as higher upfront effort with better scaling for repeated tasks and uses Python as an agile editor-tool medium. The book will use these as enduring workflow lessons—schema/naming contracts, deterministic transforms, batch validation, observable metadata, and source-controlled distribution—while marking details such as UE4/Python 2.7 and third-party plugin choices as historical rather than current recommended configuration.

### U09 — Automation testing, reports, and unattended operations

**URLs:** https://dev.epicgames.com/documentation/unreal-engine/run-automation-tests-in-unreal-engine, https://dev.epicgames.com/documentation/unreal-engine/automation-test-framework-in-unreal-engine, https://dev.epicgames.com/documentation/unreal-engine/unreal-automation-tool-overview-for-unreal-engine, and https://dev.epicgames.com/documentation/unreal-engine/setting-up-an-automation-test-report-server

**Type:** Official Unreal Engine documentation. **Captured:** 2026-08-18.

**Findings:** Unreal’s Automation Framework supports unit, feature, smoke, content-stress, and screenshot-comparison testing, plus editor testing in Python. Epic’s design guidance is particularly applicable to agents: tests must not assume execution order or state, must restore files to their prior state, and must survive a prior bad run. Command-line automation can run named tests or groups and emit JSON/HTML evidence using `-ReportExportPath`; reports can be organized by distinct session directories and shared. The Automation Tool is the C# host for unattended build/cook/run/test processes and can enumerate commands via `-List`; its command interface includes optional source-control features such as `-Submit`, which should be classified as an approval-gated side effect. The book will require an agent to collect result artifacts and fail closed on test, report, or cleanup failure.

### M06 — MCP architecture and trust requirements

**URLs:** https://modelcontextprotocol.io/specification/2026-07-28 and https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices

**Type:** Official Model Context Protocol specification and security guidance, version 2026-07-28. **Captured and rendered-page verified:** 2026-08-18.

**Findings:** MCP uses JSON-RPC between a host, client connectors, and servers; it exposes resources, prompts, and tools, with utilities including progress, cancellation, and error reporting. The latest specification also defines optional task support for long-running work. It emphasizes that tool metadata from untrusted servers is untrusted and calls for explicit user consent before tool invocation. Its security guidance identifies local-server compromise, SSRF, token-passthrough, confused-deputy, and state-handle-hijacking risks. Accordingly, a DCC MCP server should use loopback or stdio by default; expose narrowly typed and schema-validated tools; bind every job/state handle to an authenticated principal; use non-predictable expiring handles; avoid arbitrary command or Python tools by default; limit file roots and network egress; preserve explicit approval for external publishing, source-control submit, or irreversible asset changes; and emit audit records with request, actor, capability, effect, and result.

### M07 — Blender Lab MCP Server

**URL:** https://www.blender.org/lab/mcp-server/

**Type:** Official Blender Lab project page. **Captured:** 2026-08-18.

**Findings:** Blender Lab’s MCP server requires Blender 5.1 or newer plus a specific add-on, an MCP server, and an external LLM client; Blender does not itself connect to LLMs. It provides natural-language access to Blender’s Python API and presents scene analysis, data-block renaming, relation queries, debugging, geometry-node documentation, and checklist validation as use cases. Crucially, Blender’s own warning states the server executes LLM-generated code without guards against data deletion or transmission; it recommends a VM or a system without sensitive data. The handbook will classify this native integration as a high-trust exploratory control path, and will recommend read-only inspection and task-specific typed proxies for production automation.

### M08 — Unreal MCP, toolsets, and local server constraints

**URL:** https://dev.epicgames.com/documentation/unreal-engine/unreal-mcp-in-unreal-editor

**Type:** Official Unreal Engine documentation; Experimental. **Captured:** 2026-08-18.

**Findings:** Unreal MCP embeds an MCP server in the editor process and serializes tool invocation onto the game thread. It is experimental; it requires Unreal MCP plus All Toolsets/Toolset Registry for default tools; it supports local HTTP/SSE and defaults to `127.0.0.1:8000/mcp`. The server has no authentication and is explicitly unsafe beyond the local machine. Unreal’s preferred extension path uses Python or C++ `ToolsetDefinition` classes, typed signatures/docstrings for JSON Schema, small focused functions, structured returns, and explicit `RefreshTools`; direct registration exists for advanced dynamic tools. Default tool search returns discovery meta-tools instead of eager schemas, which prevents tool-context overload. The handbook will use these patterns as the baseline for a safe extensible Unreal agent interface: single-threaded editor actions, typed contracts, discovery before invocation, structured results, version/plugin checks, loopback binding, and no remote exposure without an authenticated mediation layer.

### A01 — Direct Python execution and injected code

**URLs:** https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html, https://dev.epicgames.com/documentation/unreal-engine/scripting-the-unreal-editor-using-python, and https://dev.epicgames.com/documentation/unreal-engine/write-editor-tests-with-python-in-unreal-engine

**Type:** Official Blender 5.2 LTS and Unreal Engine documentation. **Captured:** 2026-08-18.

**Findings:** Blender supports file-based Python execution (`--python`) and direct expression execution (`--python-expr`) in addition to background mode; the handbook will recommend file-based, versioned scripts for ordinary automation and reserve inline expressions for short, trusted diagnostics. Unreal’s Python Editor Script Plugin is editor-only and currently embeds Python 3.11.8. It supports interactive console code, startup scripts, editor-only Blueprint nodes, full-editor `-ExecutePythonScript`, and headless `-run=pythonscript -script=<file_or_code>`. Full-editor execution waits for the normal project/level load; the commandlet does not load levels automatically. Unreal advises using engine asset APIs (such as `EditorAssetLibrary` or `AssetTools`) instead of direct operating-system file moves because asset references can break. Its advanced Blueprint command supports a private execution scope, which is safer when a script should not redefine shared Python environment state. The PythonAutomationTest plugin discovers `test_*.py` under project/plugin `Content/Python`, captures exceptions/log errors, supports latent work with `AutomationScheduler`, and enables screenshot/image comparisons. The handbook will use these mechanisms to formalize injection as a capability tier with preconditions, path allowlists, script hashes, stdout/stderr capture, cleanup guarantees, test evidence, and explicit approval for arbitrary code.

### V01 — Blender Conference scripting presentation

**URL:** https://www.youtube.com/watch?v=wWTAQP7-ZUQ

**Type:** Blender Conference 2023 video, “Getting Started with Scripting in Python,” attributed in search metadata to Mike Shah. **Captured:** 2026-08-18.

**Evidence status:** Direct browser access encountered a YouTube traffic challenge and a direct caption-track request returned no extractable content. A separate audio/visual analysis was completed, but this is not a verbatim transcript. It identifies the talk’s progression from manual UI action and Info Log observation to console testing, scripting, and add-on packaging; it presents `bpy.context`, `bpy.data`, `bpy.ops`, and `bmesh` as core surfaces and calls out context/mode checks, error handling, and avoiding slow per-vertex loops. These operational lessons are triangulated with official Blender API sources before inclusion; no book claim will rely solely on this non-verbatim video analysis.
