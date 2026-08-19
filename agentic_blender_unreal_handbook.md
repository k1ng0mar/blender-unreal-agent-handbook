# The Blender × Unreal Engine Field Manual for Autonomous Game-Development Agents

**A research-led technical handbook for language-model agents, tool builders, technical artists, and pipeline engineers**

**Research current to 18 August 2026**

> **Purpose.** This book teaches a general-purpose autonomous agent—not a particular model or vendor integration—how to reason about, inspect, control, validate, and safely automate Blender and Unreal Engine in game-development pipelines. It does not assume that natural-language output is reliable enough to be applied directly to a digital-content-creation (DCC) project. Instead, it treats each requested change as an auditable engineering operation with explicit preconditions, typed actions, observable effects, and validation evidence.

## Abstract

Blender and Unreal Engine are unusually capable automation environments. Blender exposes a broad embedded Python surface, a command-line runtime, data-block APIs, operators, and BMesh editing; Unreal Engine supplies editor Python, Blueprints, C++, commandlets, the Unreal Automation Tool (UAT), BuildGraph, Interchange, USD workflows, test frameworks, and—experimentally—an embedded Model Context Protocol (MCP) server. These interfaces allow an agent to move from narrow inspection to asset generation, import, world assembly, validation, testing, cooking, and packaging. They also create risks: source assets can execute code, contextual UI operators can fail nondeterministically, scene formats do not guarantee semantic fidelity, editor and game threads impose execution constraints, and naïvely exposing arbitrary Python or commands through an MCP server creates a direct exfiltration and destructive-action path.[1] [6] [15] [22]

The central thesis is that **autonomous DCC control should be designed as a capability ladder, not as unrestricted code generation**. An agent should first observe, normalize, and validate. It should prefer declarative job specifications and narrow typed operations over arbitrary expression evaluation. It should stage transformations in isolated workspaces, capture manifests and artifacts, use application-native APIs rather than modifying engine assets as ordinary files, and only cross a destructive or external side-effect boundary after a policy decision. This handbook develops that approach from foundational concepts through advanced Blender–Unreal interoperability and production-grade MCP design.

| Research question | Position developed in this manual |
|---|---|
| Can an agent control both applications? | Yes, through Python, CLI/commandlets, MCP, C++/Blueprint extensions, and project automation surfaces; the appropriate control path depends on the operation and trust level. |
| Is raw Python injection sufficient? | It is powerful but is a high-risk escape hatch. For repeatable production work, typed tools, versioned scripts, manifests, and validation should be the default. |
| What is the primary game-development bridge? | Use an explicit interchange contract. FBX, glTF, and USD can be useful, but format support does not imply full fidelity. Interchange and USD workflows should be paired with asset and visual tests. |
| What makes an agent reliable? | State discovery, idempotency, explicit ownership, serial editor mutation, transactions/rollback plans, evidence capture, and a fail-closed validation gate. |

## Contents

1. [Foundations and operating model](#1-foundations-and-operating-model)  
2. [A capability and risk taxonomy](#2-a-capability-and-risk-taxonomy)  
3. [Blender’s automation model](#3-blenders-automation-model)  
4. [Blender command-line and Python control](#4-blender-command-line-and-python-control)  
5. [Reliable Blender scene and mesh manipulation](#5-reliable-blender-scene-and-mesh-manipulation)  
6. [Blender security, concurrency, and recovery](#6-blender-security-concurrency-and-recovery)  
7. [Unreal Editor Python, Blueprints, and C++](#7-unreal-editor-python-blueprints-and-c)  
8. [Unreal commandlets, UAT, BuildGraph, and tests](#8-unreal-commandlets-uat-buildgraph-and-tests)  
9. [Unreal assets, levels, cinematics, and editor state](#9-unreal-assets-levels-cinematics-and-editor-state)  
10. [Interchange, USD, and Blender–Unreal contracts](#10-interchange-usd-and-blenderunreal-contracts)  
11. [MCP architecture for DCC control](#11-mcp-architecture-for-dcc-control)  
12. [Native Blender and Unreal MCP paths](#12-native-blender-and-unreal-mcp-paths)  
13. [Safe Python injection and escape hatches](#13-safe-python-injection-and-escape-hatches)  
14. [An agent execution protocol](#14-an-agent-execution-protocol)  
15. [Reference tools and schemas](#15-reference-tools-and-schemas)  
16. [End-to-end game-development workflows](#16-end-to-end-game-development-workflows)  
17. [Evaluation, observability, and acceptance](#17-evaluation-observability-and-acceptance)  
18. [Failure catalogue and recovery playbook](#18-failure-catalogue-and-recovery-playbook)  
19. [Implementation roadmap](#19-implementation-roadmap)  
20. [References](#references)

---

## 1. Foundations and operating model

### 1.1 The agent is a pipeline participant, not a macro recorder

An autonomous agent must not be modeled as a human clicking through an interface at high speed. UI state is ephemeral, selection-based operations depend on mode and active areas, and dialog workflows vary across versions and plugins. A robust agent is instead a pipeline participant that consumes a **desired-state specification**, queries the current project state, produces a transformation plan, executes an approved set of operations, and returns evidence that the desired state was reached.

The desirable control loop is:

```text
intent → constraints → inspect → plan → preflight → mutate → validate → package evidence → report
```

This loop scales from “rename incorrectly named meshes” to “create a modular environment, import it into a game project, run editor tests, cook a build, and publish a review package.” It intentionally separates **planning** from **mutation**, because mutation changes the evidence on which planning was based.

### 1.2 Four planes of work

An agent should maintain a clear boundary between four planes.

| Plane | Question | Typical mechanisms | Safe default |
|---|---|---|---|
| Intent | What outcome is required? | Natural-language request, structured brief, style guide | Parse into constraints and acceptance criteria. |
| State | What exists now? | Scene/asset inventories, metadata, checksums, screenshots, logs | Read-only inspection first. |
| Action | What changes may be made? | Typed tools, scripts, CLI jobs, editor APIs | Execute the least powerful suitable capability. |
| Evidence | How do we know it worked? | Reports, manifests, tests, screenshots, asset registry queries, build artifacts | Fail closed when evidence is missing or contradictory. |

> **Definition: desired-state contract.** A machine-readable statement of the result the agent is authorized to produce, including target project, allowed roots, source inputs, format and coordinate conventions, naming rules, budget constraints, validation checks, and permitted side effects.

### 1.3 The minimal project contract

Before opening Blender or Unreal, the agent should create or receive a project contract. This eliminates common “correct geometry, wrong project” and “valid asset, wrong scale” errors.

```yaml
job_id: env_gatehouse_014
workspace:
  blender_file: /workspace/blender/gatehouse.blend
  unreal_project: /workspace/UE/Gatehouse/Gatehouse.uproject
  staging_root: /workspace/staging/env_gatehouse_014
  output_root: /workspace/output/env_gatehouse_014
source_control: read_only
asset_contract:
  asset_kind: modular_static_mesh_set
  naming_prefix: SM_Gatehouse_
  export_format: gltf
  units: centimeters
  up_axis: Z
  forward_axis: -Y
  material_model: metal_roughness_pbr
acceptance:
  max_triangles_per_module: 15000
  required_uv_sets: [UV0]
  no_nonmanifold_edges: true
  no_absolute_texture_paths: true
  unreal_import_path: /Game/Art/Environment/Gatehouse
  visual_test_map: /Game/Tests/Maps/GatehouseValidation
permissions:
  allow_mutation: true
  allow_external_network: false
  allow_source_control_submit: false
  allow_arbitrary_python: false
```

The contract is a control mechanism, not merely documentation. An operation outside the allowed roots or side-effect policy should be refused or escalated.

---

## 2. A capability and risk taxonomy

### 2.1 Control paths are not equivalent

The following paths may all “control Blender or Unreal,” but they differ substantially in reproducibility, observability, runtime assumptions, and blast radius.

| Tier | Control path | Example | Strength | Principal risk | Recommended use |
|---:|---|---|---|---|---|
| 0 | Read-only query | List Blender objects; query Unreal Asset Registry | Lowest blast radius | Incomplete state model | Always first. |
| 1 | Typed idempotent tool | `rename_assets`, `set_object_transform` | Clear contract, schema validation | Tool coverage may be narrow | Default production path. |
| 2 | Versioned file-based script | `blender -b file.blend --python validate.py` | Reproducible, code reviewed | Full application privilege | Batch transforms and tests. |
| 3 | Commandlet/build graph | Unreal Python commandlet, BuildGraph target | Unattended and CI-friendly | Environment and build cost | Imports, tests, cook/package. |
| 4 | Local MCP toolset | Unreal MCP `ActorTools`; Blender MCP | Agent-friendly discovery | In-process privilege, server exposure | Interactive local DCC work. |
| 5 | Inline Python/expression | `--python-expr`, `-script=<code>` | Flexible diagnostics | Quoting, review, arbitrary code | Short trusted probes only. |
| 6 | Arbitrary shell/network execution | `subprocess`, curl, external publish | Maximum capability | Data loss/exfiltration | Explicit high-trust approval only. |

The key rule is **least capability sufficient for the job**. A request to “find meshes over 100k triangles” does not require a live code-execution tool. A request to “author a custom procedural geometry-node graph” may require a reviewed script, but not network access or source-control submission.

### 2.2 Side-effect classes

Tool descriptions should expose a side-effect classification visible to both an agent and the user.

| Class | Effect | Examples | Default policy |
|---|---|---|---|
| R0 | Read-only | inspect scene, list assets, generate report | Auto-allowed. |
| R1 | Reversible local edit | rename, transform, add unreferenced asset in a staged branch | Allowed with rollback/artifact plan. |
| R2 | Destructive local edit | delete asset, overwrite source `.blend`, replace material assignments | Require explicit confirmation or snapshot. |
| R3 | Project-wide effect | reimport shared asset, save all packages, change project settings | Require preflight and approval. |
| R4 | External side effect | upload, source-control submit, publish, transmit data | Require explicit user confirmation. |

### 2.3 Capability discovery must precede calls

APIs shift with version, enabled plugins, and project configuration. Unreal’s Python surface reflects what is exposed to Blueprints and changes as plugins are enabled; its Python API reference is not a complete inventory of plugin-provided features.[15] Blender’s application and add-on versions likewise affect available operators, export options, and node types. Agents should therefore query capabilities at session start and include the result in their manifest.

```json
{
  "engine": {"product": "Unreal Engine", "version": "5.8.x"},
  "plugins": ["PythonScriptPlugin", "Interchange", "ModelContextProtocol"],
  "mcp": {"transport": "http", "tool_search": true},
  "toolsets": ["ActorTools", "SceneTools", "MaterialInstanceTools"],
  "permissions": {"network": false, "arbitrary_python": false}
}
```

---

## 3. Blender’s automation model

### 3.1 The main API surfaces

Blender’s Python API distinguishes application data, context, operators, types, and specialized modules. A reliable agent must understand this separation rather than apply `bpy.ops` indiscriminately.[2] [3]

| Surface | Role | Agent guidance |
|---|---|---|
| `bpy.data` | Persistent data-block collections: objects, meshes, materials, scenes, images, texts | Prefer for deterministic inspection and direct data mutation. |
| `bpy.context` | Ephemeral UI/editor state: active object, selection, mode, window/area | Read carefully; avoid assuming it survives another action. |
| `bpy.ops` | Operators corresponding to user-facing actions | Use when an operation is naturally operator-based; ensure the context/mode first. |
| `bpy.types` | RNA type definitions | Use to inspect available properties and construct extensible tools. |
| `bmesh` | Editable mesh representation | Prefer for nontrivial low-level mesh edits. |
| `bpy.app` | Runtime details, handlers, timers, version information | Use for capability checks and controlled lifecycle hooks. |

The robust default is **data API first, operator second, UI automation last**. For example, creating a material and linking it to an object is normally more deterministic through data-block references than through an operator whose poll conditions depend on the active editor.

### 3.2 Data blocks, ownership, and naming

Blender projects are graphs of data blocks. An object can reference mesh data, material slots can reference materials, node trees can reference images, collections can link objects, and scenes can contain multiple view layers. An agent should not infer ownership from display names alone. It should query IDs, library/override state, user counts, collection links, and dependencies before mutation.

Suggested naming is structured but not excessive:

```text
SCN_Main
COL_Environment
SM_Gatehouse_Pillar_A
MAT_Gatehouse_Stone
T_Gatehouse_Stone_BaseColor
```

The purpose is not aesthetic consistency. It creates predictable namespace predicates for tools, import mapping, and test assertions.

### 3.3 Operator context is a known reliability boundary

Blender operators frequently depend on selection, active object, mode, and sometimes a particular editor region. The Blender API documentation calls out operators, modes, and mesh access as dedicated “gotchas.”[2] A model that produces a correct operator name but uses it in the wrong mode may silently fail, return `CANCELLED`, or mutate the wrong data.

An agent should follow this pattern:

```python
import bpy

def ensure_object_mode():
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')

def select_only(obj):
    ensure_object_mode()
    for candidate in bpy.context.selected_objects:
        candidate.select_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

def apply_scale_by_name(object_name: str) -> dict:
    obj = bpy.data.objects.get(object_name)
    if obj is None:
        raise ValueError(f"Object not found: {object_name}")
    select_only(obj)
    result = bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if 'FINISHED' not in result:
        raise RuntimeError(f"transform_apply failed: {result}")
    return {"object": obj.name, "scale": list(obj.scale), "result": sorted(result)}
```

The code is intentionally explicit. It restores required state, checks the return set, and reports a structured result. A production implementation should also capture the pre-state and decide whether applying scale is allowed by the asset contract.

---

## 4. Blender command-line and Python control

### 4.1 Use file-based scripts as the normal CLI path

Blender supports background mode, file-based Python with `--python`, direct expressions with `--python-expr`, interactive console mode, and Python module embedding.[1] [4] These choices should not be treated as interchangeable.

```bash
# Safe-by-default validation of an untrusted or external .blend.
blender --background --disable-autoexec \
  /workspace/blender/gatehouse.blend \
  --python /workspace/scripts/validate_gatehouse.py \
  -- --report /workspace/output/gatehouse_validation.json
```

The `--` separator gives the script a clear boundary for its own arguments. The script should parse only declared parameters, use absolute allowed paths, emit JSON, and exit nonzero on a failed acceptance check.

### 4.2 Inline expressions are an exception

Blender accepts `--python-expr` and Unreal’s Python commandlet accepts code in `-script`. Both allow quick diagnostics, but make review, escaping, reuse, source mapping, and incident analysis harder.[1] [6] Use inline execution only for short, local, trusted probes such as version checks.

```bash
blender -b --factory-startup --python-expr \
  "import bpy, json; print(json.dumps({'version': bpy.app.version_string}))"
```

Never construct such expressions from untrusted prompt text. If the text is generated by an LLM, store it as a proposed script, lint it, display a diff, apply policy checks, and then run it only in a dedicated high-trust capability.

### 4.3 Background jobs need deterministic exits

The agent should regard a Blender invocation as a job with a request, environment, exit status, and artifacts. A job wrapper must record:

| Field | Why it matters |
|---|---|
| Blender executable and version | Export/operator behavior may change between releases. |
| Input file hash and source path | Supports provenance and stale-input detection. |
| Script hash and arguments | Allows reproducibility and postmortem analysis. |
| Auto-execution policy | Signals whether blend-file scripts could run. |
| Stdout/stderr and exit code | Captures Blender and script failures. |
| Output hashes and validation report | Separates claimed completion from verified outcome. |

### 4.4 Blender as a Python module

Blender documents an advanced “Blender as a Python Module” route that embeds Blender in a Python process.[4] This is suitable for carefully controlled systems that need in-process orchestration, but it increases dependency and lifecycle complexity. It should not be the first choice for an agent service. A separate Blender process provides failure isolation, clearer resource accounting, and less risk that an application crash destroys the orchestrator.

---

## 5. Reliable Blender scene and mesh manipulation

### 5.1 Scene inspection before transformation

The following read-only inventory is a useful first call in an agent workflow.

```python
import bpy

def scene_inventory() -> dict:
    scene = bpy.context.scene
    objects = []
    for obj in scene.objects:
        mesh = obj.data if obj.type == 'MESH' else None
        objects.append({
            "name": obj.name,
            "type": obj.type,
            "collections": [c.name for c in obj.users_collection],
            "triangles": len(mesh.polygons) if mesh else 0,
            "materials": [slot.material.name if slot.material else None
                          for slot in getattr(obj, 'material_slots', [])],
            "location": [round(v, 6) for v in obj.location],
            "scale": [round(v, 6) for v in obj.scale],
        })
    return {
        "scene": scene.name,
        "unit_system": scene.unit_settings.system,
        "objects": sorted(objects, key=lambda x: x["name"]),
    }
```

The result is both agent context and evidence. It should be persisted before any mutation so tests can compare expected deltas rather than merely inspect the end state.

### 5.2 BMesh for topology-aware editing

For sophisticated geometry operations, BMesh provides access to vertices, edges, and faces beyond context-sensitive UI operators.[2] A production tool should validate mesh type and mode, operate on one selected object or a declared target set, update the mesh, and run topology tests after mutation.

```python
import bpy
import bmesh

def count_non_manifold_edges(obj_name: str) -> int:
    obj = bpy.data.objects.get(obj_name)
    if obj is None or obj.type != 'MESH':
        raise ValueError(f"Expected mesh object: {obj_name}")
    bm = bmesh.new()
    try:
        bm.from_mesh(obj.data)
        return sum(1 for edge in bm.edges if not edge.is_manifold)
    finally:
        bm.free()
```

For a game asset, manifoldness is an acceptance check, not a universal goal. Open edges may be intentional for modular meshes or foliage planes; the contract should identify exceptions.

### 5.3 Geometry Nodes should be treated as authored programs

Geometry Nodes graphs can be inspected, documented, parameterized, and validated like a program. An agent should not destroy a node graph merely because it cannot infer every artistic intent. Prefer these actions:

1. Record node group name, modifier owner, exposed inputs, links, and dependencies.
2. Generate a plain-language explanation for human review.
3. Suggest a patch or add a non-destructive duplicate graph.
4. Validate output bounds, instance counts, material assignment, and export compatibility.

Blender’s official MCP examples include Geometry Nodes documentation and scene-validation use cases, but the same page warns that its MCP server executes model-generated code without safety guards.[20] This demonstrates the value of the task but not the adequacy of unrestricted execution.

### 5.4 Asset validation should be semantic and measurable

| Check | Blender implementation idea | Unreal/import implication |
|---|---|---|
| Naming | Regex on data-blocks and collection scope | Stable generated asset names and paths. |
| Scale | Object transforms + measured bounds | Avoid unit/physics/lightmap anomalies. |
| Topology | Non-manifold, degenerate faces, normal consistency | Import and collision reliability. |
| UVs | UV layer names/coverage/overlap policy | Texturing, lightmapping, packed data. |
| Materials | Principled/PBR subset and image paths | Predictable glTF/USD/engine material mapping. |
| References | Relative texture and library paths | Portable project/package. |
| Budget | Triangles, material slots, texture dimensions | Performance and platform constraints. |

---

## 6. Blender security, concurrency, and recovery

### 6.1 Blend files are executable content

Blender’s manual states that embedded Python is not restricted, automatic execution is disabled by default, and registered text blocks and animation drivers can execute automatically.[5] It also notes that a user can allow execution manually, and that background mode can override preferences with `--enable-autoexec` or `--disable-autoexec`.[5]

> “The ability to include Python scripts within blend-files is valuable … However, it poses a security risk since Python does not restrict what a script can do.” — Blender Manual [5]

An autonomous agent should open unknown `.blend` assets with auto-execution disabled. It should report the presence of text blocks, registered scripts, drivers, external paths, and packed libraries before an authorized trust decision.

### 6.2 Blender Python is not a general thread-safe API

Blender’s Python documentation warns that threads are not supported in the general case and can cause crashes; workers should not call Blender API functions, and independent work should normally be moved into separate processes.[2] Consequently, the agent architecture should look like this:

```text
orchestrator process
  ├─ pure compute/download/analysis workers (no bpy)
  ├─ Blender job process A (single main thread mutation)
  ├─ Blender job process B (separate file/workspace)
  └─ artifact validator process
```

Do not have multiple concurrent sessions write the same `.blend`. File locking, snapshotting, and workspace isolation are required even if no Python threads are used.

### 6.3 Recovery patterns

| Failure | Detection | Recovery |
|---|---|---|
| Script error | Nonzero exit, exception JSON | Restore snapshot; mark job failed; attach traceback. |
| Corrupt/unexpected scene state | Validation delta mismatch | Discard staged copy; inspect source read-only. |
| Long render/export | Job timeout, missing progress heartbeat | Cancel safely; preserve logs; retry only under defined policy. |
| Context/operator failure | `CANCELLED`, poll exception | Re-inspect mode/selection; use data API or context override. |
| Memory pressure | Renderer/job diagnostics | Lower scope; chunk task; avoid saving partial source state. |

---

## 7. Unreal Editor Python, Blueprints, and C++

### 7.1 Editor Python is a production pipeline language, not gameplay code

Unreal’s Python Editor Script Plugin is enabled per project and currently embeds Python 3.11.8. Python can automate asset management, level layout, and custom editor UIs, but it is only available in the Unreal Editor—not in Play In Editor, standalone game, or cooked executable.[6] This boundary matters: use Python for DCC and pipeline automation; use Blueprint or C++ for runtime gameplay systems.

### 7.2 Choose the right Unreal extension surface

| Requirement | Best primary surface | Why |
|---|---|---|
| Batch asset tagging, import, LOD setup | Editor Python | Fast iteration and native asset APIs. |
| Repeatable UI for technical artists | Editor Utility Widget / Blueprint | Dockable editor controls and editor-only nodes. |
| Custom asset pipeline tied to imports | Interchange Python/Blueprint/C++ pipeline | Runs at the import boundary. |
| High-performance or unavailable engine API | C++ | Full engine access and reflected typed contracts. |
| Runtime game mechanics | Blueprint/C++ | Python is not a runtime gameplay language. |
| Agent discovery/control | Unreal MCP Toolset | Typed schema, tool discovery, game-thread serialization. |

### 7.3 The `unreal` module is reflected and version-sensitive

Unreal exposes a broad `unreal` Python module derived from Blueprint-exposed APIs. Enabling new plugins can expose additional Python capabilities, so no agent should assume a symbol exists merely because it saw an example online.[6] [15]

```python
import unreal

def require_symbol(module, name: str):
    symbol = getattr(module, name, None)
    if symbol is None:
        raise RuntimeError(f"Capability unavailable: unreal.{name}")
    return symbol

AssetToolsHelpers = require_symbol(unreal, "AssetToolsHelpers")
asset_tools = AssetToolsHelpers.get_asset_tools()
```

This pattern should be extended to plugin checks, project version checks, and explicit fallback messages.

### 7.4 Never treat Unreal assets as ordinary files

Epic recommends using `unreal.EditorAssetLibrary` or `unreal.AssetTools` rather than `os.rename`, `shutil.move`, or other direct filesystem manipulation, because Unreal assets have internal content references that may break.[6] This is a hard rule for an agent:

```python
import unreal

def move_asset(source_path: str, destination_path: str) -> dict:
    library = unreal.EditorAssetLibrary
    if not library.does_asset_exist(source_path):
        raise ValueError(f"Missing asset: {source_path}")
    if library.does_asset_exist(destination_path):
        raise ValueError(f"Destination already exists: {destination_path}")
    result = library.rename_asset(source_path, destination_path)
    if not result:
        raise RuntimeError("Unreal rejected asset rename")
    return {"from": source_path, "to": destination_path, "renamed": True}
```

The tool should also verify redirectors, save required packages, and run a referencer audit when performing project-wide moves.

### 7.5 Editor utility patterns

Unreal supports Editor Utility Widgets for rich dockable tools, Editor Utility Blueprints for editor-only logic, Call-in-Editor methods for selected level objects, and startup objects for consistent project initialization.[16] An agent should use these surfaces to create reusable human-supervised controls rather than leaving a one-off Python file as the only record of a production process.

---

## 8. Unreal commandlets, UAT, BuildGraph, and tests

### 8.1 Commandlet versus full editor execution

Unreal offers two relevant command-line Python routes.[6]

```bash
# Full Editor: useful when the script must work after startup level load.
UnrealEditor-Cmd.exe "C:\projects\MyProject.uproject" \
  -ExecutePythonScript="C:\agent\jobs\import_gatehouse.py"

# Commandlet: faster/headless; script must explicitly load levels when needed.
UnrealEditor-Cmd.exe "C:\projects\MyProject.uproject" \
  -run=pythonscript \
  -script="C:\agent\jobs\validate_import.py"
```

The full-editor path waits until the project and startup level are ready. The `pythonscript` commandlet does not automatically load a level; a script that needs world content must load it explicitly. Use the commandlet for headless, deterministic asset work. Use full editor only when the job genuinely needs loaded editor state or UI-backed facilities.

### 8.2 UAT is the unattended operations host

UAT is Unreal’s host program and C# utility library set for unattended processes such as building, cooking, running automation tests, and build-farm operations.[13] It supports command enumeration and source-control options. The presence of `-Submit` means a source-control mutation can be technically simple; policy must still require approval.[13]

### 8.3 BuildGraph turns a build into a dependency graph

BuildGraph represents work in XML nodes with ordered tasks, dependencies, outputs, agents, triggers, aggregates, options, and conditional values.[12] It can distribute graph nodes and move tagged artifacts through shared storage. This aligns well with autonomous execution because it makes dependencies and resulting artifacts explicit.

```xml
<BuildGraph>
  <Option Name="Project" DefaultValue="C:/projects/Gatehouse/Gatehouse.uproject" />
  <Node Name="ValidateAssets">
    <Commandlet Project="$(Project)" Commandlet="pythonscript"
                Arguments="-script=C:/agent/jobs/validate_assets.py" />
  </Node>
  <Node Name="CookWindows" Requires="ValidateAssets">
    <Cook Project="$(Project)" Platform="Win64" />
  </Node>
  <Node Name="PackageReview" Requires="CookWindows">
    <Tag Files=".../StagedBuild/**" With="#ReviewBuild" />
  </Node>
</BuildGraph>
```

The exact task syntax should be validated against the installed engine’s BuildGraph schema. The structural pattern is the important part: **validation gates cook; cook gates packaging; artifacts are tagged and recorded**.

### 8.4 Testing is the evidence layer

Unreal supports unit, feature, smoke, content-stress, screenshot-comparison, Blueprint, and Python editor tests.[17] [18] The automation guidance explicitly says tests must not assume order or prior state, must leave files as found, and must survive an earlier bad run.[18] These are precisely the properties required for an agent retry loop.

```bash
UnrealEditor-Cmd.exe "C:\projects\Gatehouse\Gatehouse.uproject" \
  -ExecCmds="Automation RunTest Editor.Python.Gatehouse;Quit" \
  -ReportExportPath="C:\agent\evidence\gatehouse_test_run"
```

`-ReportExportPath` creates JSON and related HTML report artifacts, which should be attached to the job record rather than summarized by a model alone.[17]

---

## 9. Unreal assets, levels, cinematics, and editor state

### 9.1 Asset imports require a preflight policy

Before importing, the agent should identify source format, target path, importer/pipeline profile, reimport policy, naming collision policy, material mapping, skeleton policy, and expected output asset types. Unchecked import is not a benign action: it can create duplicate assets, alter existing material/skeleton assignments, or update shared content.

### 9.2 Sequencer is a structured timeline API

Unreal’s Sequencer API represents a LevelSequence, bindings, tracks, sections, channels, and keys. The editor subsystems can create/load sequences, bind actors, create cameras, add tracks and sections, set timebase/ranges, and refresh the editor.[16] An agent should preserve the project’s intended display rate, tick resolution, and playback bounds rather than assuming a default 30 fps sequence is correct.

```python
import unreal

def set_sequence_range(path: str, start: int, end: int, fps: int):
    seq = unreal.load_asset(path)
    if not isinstance(seq, unreal.LevelSequence):
        raise ValueError(f"Not a LevelSequence: {path}")
    if end <= start:
        raise ValueError("Playback end must exceed start")
    seq.set_display_rate(unreal.FrameRate(numerator=fps, denominator=1))
    seq.set_playback_start(start)
    seq.set_playback_end(end)
    unreal.EditorAssetLibrary.save_loaded_asset(seq)
    return {"sequence": path, "range": [start, end], "fps": fps}
```

An advanced workflow should render a proof frame or Movie Render Queue sample and compare it with a reference or quality target.

### 9.3 Transactions, slow tasks, and user visibility

The Python API includes `ScopedEditorTransaction` and `ScopedSlowTask` types.[15] Where available, a production-grade tool should wrap coherent changes in transactions and surface progress. This aids undo, editorial review, and recovery. An agent should not make thousands of small invisible modifications without a progress and cancellation model.

---

## 10. Interchange, USD, and Blender–Unreal contracts

### 10.1 Interchange is a pipeline stack, not merely an importer

Unreal Interchange is a file-format-agnostic, asynchronous, customizable import/export framework. It converts source data into intermediary nodes, processes an ordered pipeline stack, and generates assets through factories; custom pipelines can be authored in C++, Blueprints, or Python.[10] The framework offers preview and conflict displays, and remembers prior reimport pipeline options.[10]

The agent should treat every import as:

```text
source → translate → pipeline stack → factory → assets → post-import validation
```

| Import property | Required agent decision |
|---|---|
| Source extension | Select supported path; record fallback/experimental status. |
| Pipeline profile | Declare assets/materials/textures/scene stacks and custom stages. |
| Destination path | Confirm path is within contract and collision policy. |
| Reimport | Compare source hash and prior options before overwriting. |
| Preview | Inspect intended assets, types, materials, and skeleton changes. |
| Validation | Query produced assets, dependencies, dimensions, materials, and test map. |

FBX Interchange support is documented as experimental, so a pipeline should pin the tested engine version and retain a non-Interchange fallback or test corpus.[10]

### 10.2 USD is powerful but has explicit limits

USD supports composition, overrides, scenegraphs, and interchange across DCC applications. Unreal’s USD support is Beta; its USD Stage can retain and work natively with USD data, supports bidirectional Python workflows, and can import to assets/actors when required.[11] Blender’s USD support imports a useful set of prim types and automatically converts Y-up USD to Blender’s Z-up convention, but documents composition limitations, lossy material conversions, and export caveats around cameras, node graphs, instancing, and Geometry Nodes.[8]

> **Interchange principle.** A format identifies an encoding, not an invariant meaning. An agent must validate the subset of semantics that matters to the project.

### 10.3 Build an interchange contract

```yaml
interchange_contract:
  format: usd
  format_version: "tested-with-project"
  source_coordinate_system:
    up: Z
    forward: -Y
    length_unit: meter
  unreal_coordinate_system:
    length_unit: centimeter
  selection_scope: "COL_Export"
  baked_state:
    modifiers: apply_for_static_meshes
    geometry_nodes: realize_or_validate_output_type
  material_scope:
    allowed_nodes: [PrincipledBSDF, ImageTexture, UVMap, SeparateRGB]
    target_model: USDPreviewSurface
  textures:
    policy: copy_relative
    root: textures/
  acceptance:
    expected_meshes: [SM_Gatehouse_Pillar_A, SM_Gatehouse_Wall_A]
    no_missing_textures: true
    max_materials_per_mesh: 3
```

The contract must include forward/up axes, units, selection scope, modifier/evaluation policy, material subset, texture relocation policy, expected assets, and validation. Omitting these turns every importer default into an implicit and version-dependent decision.

### 10.4 glTF and FBX still need semantic verification

Blender’s glTF exporter supports a metal/roughness PBR model, while its USD exporter can approximate Principled BSDF networks as USD Preview Surface or MaterialX subject to documented limitations.[8] A general agent should not claim “materials transferred” just because import completed. It should inspect produced material slots, texture references, normal-map handling, alpha behavior, and required engine material-instance parameters.

### 10.5 Epic BlenderTools is helpful but not a substitute for validation

Epic’s maintained BlenderTools repository includes Send to Unreal and UE to Rigify, intended to streamline Blender–Unreal transfer and character retargeting.[19] Treat this as an accelerator with versioned configuration—not as proof of target-state correctness. The agent must still check generated asset names, skeleton assignment, materials, LODs, collisions, and gameplay/map behavior.

---

## 11. MCP architecture for DCC control

### 11.1 What MCP adds

MCP standardizes host–client–server communication over JSON-RPC. Servers can expose resources, prompts, and tools; the protocol also includes utilities for progress, cancellation, and errors, and current extensions include asynchronous tasks.[21] For DCC control, MCP provides a discoverable and typed interface that can be used by different compatible agents.

MCP does **not** make tools safe. The specification warns that tools are arbitrary code-execution paths and that tool descriptions/annotations from untrusted servers should be treated as untrusted.[21]

### 11.2 Design a DCC server around jobs, not arbitrary commands

The preferred topology is:

```text
agent host
  │ MCP JSON-RPC
  ▼
policy-aware DCC tool server
  ├─ capability registry
  ├─ job queue and state store
  ├─ artifact/evidence store
  ├─ Blender adapter (single job process per workspace)
  └─ Unreal adapter (serialized editor/game-thread calls)
```

Each mutable action should return a job identifier and evidence references, not merely a prose statement.

```json
{
  "job_id": "job_01HTR8",
  "status": "validated",
  "effects": [{"kind": "asset_created", "path": "/Game/Art/Environment/SM_Gatehouse_Pillar_A"}],
  "artifacts": [
    {"kind": "validation_report", "uri": "artifact://job_01HTR8/validation.json"},
    {"kind": "screenshot", "uri": "artifact://job_01HTR8/viewport.png"}
  ],
  "warnings": []
}
```

### 11.3 Tool schema principles

| Principle | Good design | Poor design |
|---|---|---|
| Narrow responsibility | `validate_static_mesh(asset_path, profile)` | `execute_unreal_code(code)` |
| Typed parameters | `max_triangles: integer` | `instructions: string` |
| Structured results | object list, violations, artifact URI | Human prose only |
| Explicit policy | `mode: inspect|stage|apply` | Hidden immediate mutation |
| Idempotency | explicit target and expected state | depends on current selection |
| Discoverability | capability/version/permissions tool | undocumented operator magic |
| Evidence | manifest and report URI | “Done” |

### 11.4 MCP security is an architectural concern

Official MCP security guidance covers confused-deputy attacks, token passthrough, SSRF, state-handle hijacking, local server compromise, and scope minimization.[22] A local DCC server is especially sensitive because it may have file-system, application, rendering, and external-network privileges.

Required baseline controls:

1. Use stdio or loopback transport by default; never bind an unauthenticated editor-control server to a public interface.
2. Treat tool descriptions and any resource text as untrusted data.
3. Enforce allowed workspace roots and refuse path traversal.
4. Bind every job handle to an authenticated or local session principal; possession of an ID is not authorization.[22]
5. Validate structured arguments against a schema; do not interpolate them into shell commands.
6. Restrict network egress and prohibit hidden remote downloads in import tools.
7. Preserve a user approval boundary for R3/R4 effects.
8. Log exact tool, arguments hash, actor/session, policy decision, result, and artifact IDs.

---

## 12. Native Blender and Unreal MCP paths

### 12.1 Blender Lab MCP Server

Blender Lab provides a lightweight MCP integration that connects an external client through an add-on and server to Blender 5.1+.[20] Its stated use cases include scene analysis, renaming, relation queries, debugging, Geometry Nodes explanations, and validation. But Blender’s own page warns that it executes LLM-generated code **without guards** against deletion or remote transmission and recommends running it in a VM or a system without sensitive information.[20]

This leads to a practical decision table:

| Scenario | Blender Lab MCP suitability | Recommended guard |
|---|---|---|
| Disposable demo scene | Useful exploratory interface | Dedicated VM, no sensitive credentials. |
| Read-only scene audit | Useful if no saving/network tools | Copy input, disable autoexec, persist report. |
| Production asset changes | Insufficient alone | Narrow wrapper tools or reviewed scripts. |
| External files/secrets present | High risk | Do not use unrestricted generated code. |

### 12.2 Unreal MCP

Unreal MCP is experimental, embeds the server in the Unreal Editor, exposes engine functionality as tools, and serializes tool invocations on the game thread.[23] It is local HTTP/SSE, loopback by default, has no authentication layer, and is explicitly not safe to expose remotely.[23]

Its `ToolsetDefinition` model is highly relevant for custom agent integration. Python or C++ toolsets expose typed, documented methods. Python type hints and docstrings contribute to JSON Schema; focused functions with structured returns are recommended. In default tool-search mode, a connected agent first discovers toolsets and then requests detailed schemas, avoiding hundreds of tools in the initial context.[23]

```python
# Conceptual Unreal MCP toolset; validate class names against the installed UE version.
import unreal
import toolset_registry

@unreal.uclass()
class AssetAuditTools(unreal.ToolsetDefinition):
    """Read-only auditing tools for static-mesh assets."""

    @staticmethod
    @toolset_registry.tool_call
    def inspect_static_mesh(asset_path: str) -> dict:
        """Return lightweight metrics for a static mesh.

        Args:
            asset_path: Unreal content path such as /Game/Art/SM_Wall.
        Returns:
            Object describing the asset and validation-relevant metrics.
        """
        asset = unreal.load_asset(asset_path)
        if asset is None:
            return {"ok": False, "error": "asset_not_found", "path": asset_path}
        return {"ok": True, "path": asset_path, "class": asset.get_class().get_name()}
```

The tool is deliberately read-only. A separate R2 mutation tool should require expected pre-state/version and return an exact change report.

---

## 13. Safe Python injection and escape hatches

### 13.1 When an escape hatch is warranted

Some tasks cannot be captured immediately in a narrow tool surface: a one-off data migration, a novel geometry analysis, or a specialized plugin API. Arbitrary Python may be justified only if:

1. A typed tool cannot perform the action.
2. The agent states the proposed code’s scope, inputs, outputs, and expected effect.
3. The code is saved as a versioned file, not silently embedded in a tool call.
4. Policy scans it for prohibited capabilities.
5. It runs in a disposable/staged workspace with execution limits.
6. Validation proves the expected result and identifies no unauthorized effects.

### 13.2 An injection request format

```json
{
  "capability": "unreal.python.run_reviewed_script",
  "script_uri": "artifact://proposals/fix_material_slots.py",
  "script_sha256": "<hash>",
  "project": "/workspace/UE/Gatehouse/Gatehouse.uproject",
  "mode": "commandlet",
  "allowed_paths": ["/Game/Art/Environment/Gatehouse"],
  "network": "deny",
  "expected_effects": ["normalize material slot names"],
  "validation": ["asset_audit", "editor_python_test"],
  "approval": "required"
}
```

### 13.3 Policy checks for DCC scripts

Static inspection is not complete security, but it catches accidental scope expansion. Flag imports/calls to `subprocess`, `socket`, `requests`, `urllib`, `os.system`, recursive file deletion, environment-secret access, direct Unreal asset filesystem mutation, and arbitrary `exec`/`eval`. Blender scripts should be reviewed for `bpy.ops.wm.save_as_mainfile`, `bpy.ops.object.delete`, external library paths, and auto-execution changes. Unreal scripts should be reviewed for source-control submit, direct file changes to `.uasset`, package deletion, and unscoped `EditorAssetLibrary` calls.

### 13.4 Private scope and code isolation

Unreal’s advanced Blueprint Python execution supports a private execution scope for files, reducing the ability of a script to redefine the shared interpreter state; its documentation recommends private scope as safer where shared variables/functions are not needed.[6] Use the analogous concept everywhere: per-job interpreter/process, per-job temporary directory, explicit imports, and no shared mutable global state.

---

## 14. An agent execution protocol

### 14.1 The nine-step protocol

| Step | Agent action | Required output |
|---:|---|---|
| 1 | Parse request into desired-state contract | Constraints, acceptance tests, requested effect class. |
| 2 | Discover environment | Versions, plugins, capabilities, project lock status. |
| 3 | Inspect existing state | Inventory, asset metadata, hashes, screenshots. |
| 4 | Produce a plan | Ordered actions and alternatives; no mutation yet. |
| 5 | Preflight | Validate paths, naming, budgets, importer/tool availability. |
| 6 | Stage | Copy/branch/temporary workspace as policy requires. |
| 7 | Apply | Lowest-risk typed tool or reviewed script; serialized mutation. |
| 8 | Validate | Structural checks, application tests, visual proof, artifact hashes. |
| 9 | Report | Status, effects, evidence, warnings, recovery/rollback reference. |

### 14.2 Idempotency and drift control

An agent may retry after a model, network, or process failure. Therefore, a tool must not create a new `Cube.001` every time it runs. Prefer stable logical identifiers and desired-state comparisons.

```python
def ensure_collection(name: str):
    import bpy
    collection = bpy.data.collections.get(name)
    if collection is None:
        collection = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(collection)
        return collection, True
    return collection, False
```

For Unreal, use content paths and asset-existence checks. For both applications, record the before/after inventory and classify any unexpected addition, deletion, or rename as a policy violation.

### 14.3 Serial mutation, parallel analysis

Run DCC mutations serially within a project workspace, especially in the Unreal editor/game thread and Blender Python context. Parallelize only independent, non-mutating work: mesh metric extraction from exported copies, texture analysis, code linting, reference documentation lookup, report generation, or tests that are designed for isolated workspaces. Unreal BuildGraph can coordinate graph-level parallel work when nodes and artifacts are properly declared.[12]

### 14.4 Approval as a first-class result

If an action is R2–R4, the plan should return an approval request rather than silently stop or proceed. The request needs a human-readable description and machine-readable diff/effect list:

```json
{
  "status": "awaiting_approval",
  "reason": "Reimport would replace 14 material assignments on shared static mesh assets.",
  "effects": [{"asset": "/Game/Art/SM_Wall_A", "kind": "reimport_overwrite"}],
  "rollback": "restore source-control revision or snapshot asset package",
  "evidence": "artifact://job_42/interchange_conflicts.json"
}
```

---

## 15. Reference tools and schemas

### 15.1 Core cross-DCC tool palette

| Tool | Effect | Risk | Inputs | Returns |
|---|---|---:|---|---|
| `environment.get_capabilities` | Read | R0 | none | versions, plugins, tools, policies |
| `blender.inspect_scene` | Read | R0 | file/session, profile | inventory, budgets, warnings |
| `blender.validate_asset_set` | Read | R0 | collection, contract | violations and report artifact |
| `blender.export_asset_set` | Write staged | R1/R2 | collection, interchange contract | exported files, manifest, hashes |
| `unreal.inspect_assets` | Read | R0 | content paths | registry metadata and dependencies |
| `unreal.preflight_import` | Read | R0 | source, profile, destination | intended assets/conflicts |
| `unreal.import_assets` | Write | R1/R3 | approved import plan | created assets, manifest, warnings |
| `unreal.run_tests` | Read/compute | R0 | suite/map/report path | pass/fail, report URI |
| `unreal.build_target` | Compute | R2/R3 | graph target/platform/config | artifacts, logs, test gate state |
| `job.get_status` | Read | R0 | job id | progress, artifacts, failures |

### 15.2 Example structured validation report

```json
{
  "schema_version": "1.0",
  "subject": "COL_Export_Gatehouse",
  "status": "failed",
  "summary": {"errors": 1, "warnings": 2, "checks": 12},
  "violations": [
    {
      "code": "MESH.NON_MANIFOLD",
      "severity": "error",
      "subject": "SM_Gatehouse_Pillar_A",
      "observed": 4,
      "expected": 0,
      "suggested_action": "Inspect boundary edges or declare intentional openings."
    }
  ],
  "artifacts": ["artifact://job_42/blender_scene_inventory.json"],
  "input_hash": "<hash>",
  "tool_version": "blender-validation/1.3"
}
```

The model should use the report as its operating context. It should not reason from a screenshot alone when a deterministic report is available.

---

## 16. End-to-end game-development workflows

### 16.1 Workflow A: Static environment asset from Blender to Unreal

**Objective:** Turn a Blender modular asset collection into validated Unreal static meshes and a proof map.

| Stage | Blender / Unreal action | Evidence gate |
|---|---|---|
| Discover | Inventory collection and current Unreal destination | Versions, plugin state, existing asset collision report. |
| Validate source | Check naming, scale, transforms, manifold policy, UVs, materials, texture paths | JSON source validation report. |
| Export | Export declared collection via glTF/USD/FBX profile into staging | Export manifest, output hashes. |
| Preflight import | Use Interchange preview/pipeline configuration | Intended output assets and conflict report. |
| Import | Import with recorded pipeline profile | Created/reimported asset list. |
| Normalize | Create/assign required material instances, collision/LOD policy | Asset metadata report. |
| Visual proof | Place selected assets in validation map; screenshot/render | Proof image(s). |
| Test | Python/automation test validates references and target map | JSON/HTML automation report. |

**Critical rule:** Never overwrite a production source or shared content asset solely because a model says the result “looks correct.” Require the source contract and artifacts.

### 16.2 Workflow B: Procedural prop generation in Blender

**Objective:** Create many variation-controlled props from a Geometry Nodes source.

1. Agent reads the existing node graph and exposed parameters.
2. It proposes a parameter batch table (seed, dimensions, material variant) under budget constraints.
3. It creates outputs in a dedicated collection and assigns stable names.
4. It evaluates resulting mesh/instance output as required by the export contract.
5. It validates triangles, bounds, materials, transforms, and texture references.
6. It exports a manifest that maps Unreal asset paths to source seed/parameter values.

This preserves provenance: an Unreal prop can later be traced back to a Blender generator input set.

### 16.3 Workflow C: Unreal cinematic review sequence

**Objective:** Generate a reviewable Level Sequence without silently replacing cinematic intent.

1. Inspect the target LevelSequence and existing bindings, frame rate, ranges, tracks, and camera cuts.
2. Generate a plan with explicit shot/timeline changes.
3. Require approval if removing/replacing existing tracks or bindings.
4. Use `LevelSequenceEditorSubsystem`/asset APIs to add or edit discrete tracks and sections.[16]
5. Save required assets, then render or capture proof frames.
6. Run an editor Python test to assert expected frame rate, cameras, bindings, and duration.

### 16.4 Workflow D: Automated nightly asset health audit

**Objective:** Detect pipeline regressions without mutating production.

```text
source-control snapshot
  → Blender headless validation for declared source assets
  → Unreal commandlet asset audit
  → Unreal PythonAutomationTest screenshot/reference comparisons
  → automation report export
  → aggregate dashboard + actionable violations
```

The audit must be read-only. It should produce results in an immutable session directory, because Unreal’s report guidance recommends separate directories to avoid overwriting prior sessions.[17]

---

## 17. Evaluation, observability, and acceptance

### 17.1 Measure agent quality by evidence, not eloquence

| Dimension | Weak evidence | Strong evidence |
|---|---|---|
| Completion | “Imported successfully.” | Artifact manifest, generated asset list, importer output. |
| Correctness | One viewport screenshot | Contract checks plus visual proof and test report. |
| Reproducibility | Chat transcript | Script hash, command line, versions, input/output hashes. |
| Safety | Tool invocation logs only | Policy decisions, approvals, restricted roots, no-egress record. |
| Recovery | “Can undo.” | Snapshot/version reference and explicit rollback procedure. |
| Performance | “Optimized.” | Measured triangle/material/texture metrics vs. budget. |

### 17.2 Agent test corpus

Create a corpus of small, representative projects rather than evaluating only on ideal projects:

| Corpus case | Intended stressor |
|---|---|
| Clean static mesh pack | Baseline create/export/import path. |
| Non-manifold modular mesh | Contract exception reasoning. |
| Multiple UV/material slots | Mapping preservation and importer policy. |
| Broken texture references | Path remediation. |
| Untrusted `.blend` with text block/driver | Auto-execution safety. |
| Unreal asset rename with referencers | Native asset API enforcement. |
| Existing sequence with tracked actors | Non-destructive cinematic editing. |
| Delayed/latent Unreal test | Scheduler and test evidence. |
| Unsupported/experimental import setting | Capability discovery and fail-closed behavior. |

### 17.3 A practical scorecard

Score runs across five dimensions: contract compliance, asset correctness, visual correctness, safety compliance, and evidence completeness. A run that produces aesthetically acceptable content but violates a safety policy or loses evidence should not be marked successful.

---

## 18. Failure catalogue and recovery playbook

| Symptom | Likely cause | First diagnostic action | Safe remediation |
|---|---|---|---|
| Blender operator returns `CANCELLED` | Wrong mode/selection/context | Capture current mode, active object, selected objects | Use data API or set explicit context. |
| Blender crashes during worker activity | Thread misuse or invalid data lifetime | Examine job log and thread model | Move compute to subprocess; main-thread Blender API only. |
| Unexpected script runs on file open | Autoexec/driver/text block | Open with `--disable-autoexec`; inventory scripts | Treat file as untrusted; do not enable blindly. |
| Unreal imported duplicate/incorrect assets | Destination/collision/pipeline ambiguity | Run preflight and compare prior import metadata | Isolate target path; use declared collision policy. |
| Unreal asset references break | Direct filesystem manipulation | Query Asset Registry/referencers | Use `EditorAssetLibrary`/`AssetTools`; repair redirectors. |
| Unreal Python action cannot find level actors | Commandlet did not load level | Log world state | Explicitly load target level or use full editor mode. |
| MCP calls overlap/fail in editor | Unreal MCP serial game-thread model | Inspect job queue/call trace | Serialize calls; await job completion. |
| Tool result is vague/missing | Free-form output / unstructured tool | Inspect schema | Return typed JSON and artifact URIs. |
| Remote server exposed | Misconfigured local HTTP binding | Check listener and origin handling | Bind loopback; use authenticated mediator if remote use is unavoidable. |
| Automated test flakes | State/order dependency | Inspect cleanup and test isolation | Restore files; generate fresh output; remove order assumptions. |

---

## 19. Implementation roadmap

### Phase 1: Safe read-only foundation

Implement capability discovery, Blender scene inventory, Unreal asset inventory, project contract parsing, JSON report storage, and a job/evidence manifest. Do not enable arbitrary Python or remote MCP access. This phase creates the factual context an agent needs to make credible plans.

### Phase 2: Typed asset operations

Add idempotent tools for validating assets, staging exports, preflighting Interchange import, importing to a constrained destination, and running editor tests. Each tool should have strict schemas and a clear risk class.

### Phase 3: Reusable procedural and cinematic workflows

Add Blender procedural asset adapters, Geometry Nodes inspection, Unreal Sequencer tools, material-instance operations, and validation-map screenshot capture. Build a test corpus before granting broad mutation permissions.

### Phase 4: Controlled escape hatch

Add reviewed file-based Blender/Unreal Python jobs running in isolated workspaces. Require a policy scan, input/output manifest, hard timeout, no-egress default, and post-run acceptance tests. Never expose raw prompt text directly to an interpreter.

### Phase 5: MCP ergonomics and managed scaling

Expose the typed tools through MCP with tool search/discovery, asynchronous job progress, cancellation, scoped permissions, audit logs, and approval handoffs. For Unreal MCP, respect loopback-only/no-auth experimental constraints; wrap or mediate any broader deployment.[23]

---

## Conclusion

Blender and Unreal Engine give autonomous agents sufficient technical access to participate meaningfully in modern game-development pipelines. The limiting factor is not whether an LLM can emit Python, a console command, or an MCP request. The limiting factor is whether the system turns those capabilities into **controlled, reproducible, evidence-bearing operations**.

The most durable implementation has three characteristics. First, it treats Blender and Unreal as authoritative stateful applications, not generic folders of files. Second, it uses staged, typed, least-privilege controls for ordinary work and reserves raw Python/code injection for reviewed exceptions. Third, it makes validation, artifacts, and recovery integral to each job. With these properties, the same manual can guide a lightweight local assistant, a technical-art pipeline tool, or a multi-stage game-production automation system without tying the architecture to a single agent vendor.

---

## References

[1]: https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html "Blender 5.2 LTS Manual — Command Line Arguments"
[2]: https://docs.blender.org/api/current/info_gotcha.html "Blender Python API — Gotchas"
[3]: https://docs.blender.org/api/current/info_overview.html "Blender Python API — Overview"
[4]: https://docs.blender.org/api/current/info_advanced_blender_as_bpy.html "Blender Python API — Blender as a Python Module"
[5]: https://docs.blender.org/manual/en/latest/advanced/scripting/security.html "Blender 5.2 LTS Manual — Scripting & Security"
[6]: https://dev.epicgames.com/documentation/unreal-engine/scripting-the-unreal-editor-using-python "Unreal Engine — Scripting the Unreal Editor Using Python"
[7]: https://docs.blender.org/api/current/bmesh.html "Blender Python API — BMesh Module"
[8]: https://docs.blender.org/manual/en/latest/files/import_export/usd.html "Blender 5.2 LTS Manual — Universal Scene Description"
[9]: https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html "Blender 5.2 LTS Manual — glTF 2.0"
[10]: https://dev.epicgames.com/documentation/unreal-engine/importing-assets-using-interchange-in-unreal-engine "Unreal Engine — Importing Assets Using Interchange"
[11]: https://dev.epicgames.com/documentation/unreal-engine/universal-scene-description-in-unreal-engine "Unreal Engine — Universal Scene Description"
[12]: https://dev.epicgames.com/documentation/unreal-engine/buildgraph-for-unreal-engine "Unreal Engine — BuildGraph"
[13]: https://dev.epicgames.com/documentation/unreal-engine/unreal-automation-tool-overview-for-unreal-engine "Unreal Engine — Automation Tool Overview"
[14]: https://dev.epicgames.com/documentation/unreal-engine/build-operations-cooking-packaging-deploying-and-running-projects-in-unreal-engine "Unreal Engine — Build Operations: Cook, Package, Deploy, and Run"
[15]: https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/?application_version=5.8 "Unreal Engine 5.8 — Python API Documentation"
[16]: https://dev.epicgames.com/documentation/unreal-engine/python-scripting-in-sequencer-in-unreal-engine "Unreal Engine — Python Scripting in Sequencer"
[17]: https://dev.epicgames.com/documentation/unreal-engine/run-automation-tests-in-unreal-engine "Unreal Engine — Run Automation Tests"
[18]: https://dev.epicgames.com/documentation/unreal-engine/automation-test-framework-in-unreal-engine "Unreal Engine — Automation Test Framework"
[19]: https://github.com/EpicGames/BlenderTools "Epic Games — BlenderTools Repository"
[20]: https://www.blender.org/lab/mcp-server/ "Blender Lab — MCP Server"
[21]: https://modelcontextprotocol.io/specification/2026-07-28 "Model Context Protocol — Specification (2026-07-28)"
[22]: https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices "Model Context Protocol — Security Best Practices"
[23]: https://dev.epicgames.com/documentation/unreal-engine/unreal-mcp-in-unreal-editor "Unreal Engine — Unreal MCP"
[24]: https://dev.epicgames.com/documentation/unreal-engine/write-editor-tests-with-python-in-unreal-engine "Unreal Engine — Write Editor Tests with Python"
[25]: https://dev.epicgames.com/documentation/unreal-engine/scripting-the-unreal-editor-using-blueprints "Unreal Engine — Scripting the Unreal Editor Using Blueprints"
[26]: https://dev.epicgames.com/documentation/unreal-engine/setting-up-an-automation-test-report-server "Unreal Engine — Automation Test Report Server"
[27]: https://www.unrealengine.com/en-US/blog/download-our-new-blender-addons "Epic Games Blog — Download Our New Blender Addons"
[28]: https://www.youtube.com/watch?v=wWTAQP7-ZUQ "Blender Conference 2023 — Getting Started with Scripting in Python (video; non-verbatim analysis used)"
[29]: https://www.youtube.com/watch?v=FOSwlDQY6N0 "Unreal Fest Europe 2019 — Using Python to Streamline Asset Workflows (video; non-verbatim analysis used)"
