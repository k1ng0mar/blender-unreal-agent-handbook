# Design Exploration — Blender × Unreal Engine Agent Research

## Three Directions

### 1. Field Manual Atelier
**Very Brief Intro:** A warm, editorial technical field guide that combines scientific annotation, workshop texture, and clear reference-book hierarchy. It should feel like a serious studio notebook rather than a generic software dashboard.

**Probability:** 0.07

### 2. Signal Room
**Very Brief Intro:** A dark operations-console aesthetic built around terminal telemetry, blueprints, and luminous system traces. It expresses real-time control but risks becoming visually familiar for technical products.

**Probability:** 0.04

### 3. Material Library
**Very Brief Intro:** A bright, museum-archive approach with paper labels, object taxonomy, and fine material swatches. It makes complex automation research feel approachable and evidence-led.

**Probability:** 0.09

## Chosen Approach — Field Manual Atelier

### Design Movement

This site follows a **contemporary technical editorial** movement informed by field manuals, architectural specification books, and workshop ephemera. It foregrounds evidence, hierarchy, and traceability while retaining tactile warmth.

### Core Principles

1. **Evidence is spatial.** Sources, confidence, and implementation maturity should be visible alongside assertions rather than hidden in footnotes.
2. **The document is an instrument.** The interface should invite scanning, filtering, and comparison without mimicking a generic SaaS dashboard.
3. **Contrast creates pedagogy.** Dense technical material is balanced by large typographic pauses, crisp dividers, and controlled accent surfaces.
4. **Artifacts feel made.** Fine grain, calibration marks, editorial rules, and subtle material shifts create a composed, studio-quality atmosphere.

### Color Philosophy

The foundational **Paper Stone** background uses a lightly warm mineral tone to remove the sterility of a white canvas. Charcoal ink establishes long-read legibility; **Oxide Orange** acts as the unmistakable action and annotation color, evoking engine heat, workshop labels, and highlighted findings. Slate-blue and moss signals distinguish Blender- and Unreal-oriented systems without treating either as a brand-color clone. Color is functional, never decorative: it tells readers which system, evidence type, or control surface they are encountering.

### Layout Paradigm

The home page is structured as a **research workbench**: an asymmetric left editorial rail anchors navigation and source count, while the main canvas shifts between an oversized thesis statement, a flowing capability map, and long-form chapter cards. Lines, not boxed grids, organize information. On small screens the rail becomes a compact evidence strip above the reading surface.

### Signature Elements

1. **Calibration rulers:** numbered ticks and fine measurement rules flank sections and chapter cards.
2. **System tabs:** blue Blender, moss Unreal, and orange bridge labels make technical provenance scannable.
3. **Field-note callouts:** small monospace annotations describe agent readiness, verification state, or execution boundary.

### Interaction Philosophy

Interactions operate like handling a well-made reference book: chapter filters update the visible material, concept maps reveal implementation details, and source references open deliberately. Controls are direct, quiet, and contextual; the reader always retains orientation.

### Animation

Use short, tactile transitions: navigation states and filters resolve in 160–220ms with a decisive custom ease-out. Field-note cards rise by 2–4px with a restrained shadow on hover. On first view, the chapter rail, thesis, and systems map enter in staggered opacity-and-translate sequences; motion is disabled under `prefers-reduced-motion`. No continuous ambient animation is used.

### Typography System

**Fraunces** supplies a distinct, bookish display voice for major titles and section numerals; **IBM Plex Sans** carries body text and technical UI; **IBM Plex Mono** distinguishes code, IDs, and source metadata. The hierarchy is deliberately non-uniform: dense labels stay compact, while analytical headings become generously sized and slightly condensed through tracking.

### Brand Essence

**A rigorous operating field book for agents that must design, automate, and verify game-development work across Blender and Unreal Engine.**

Personality: **methodical, tactile, lucid**.

### Brand Voice

Headlines are assertive and editorial; CTAs are precise; microcopy names the operation or uncertainty without hype. Avoid generic onboarding phrases and inflated claims.

Example lines: “Build scenes with receipts, not guesses.”

Example lines: “Trace the command path before handing control to an agent.”

### Wordmark & Logo

The mark is a bold **interlocking B/U construction glyph**: two offset workshop brackets form an abstract aperture and directional arrow. It appears in Oxide Orange on the light paper field, and is paired with the custom wordmark “FIELD//ENGINE” in compact, letter-spaced IBM Plex Mono.

### Signature Brand Color

**Oxide Orange — `#E65B35`**. It is reserved for primary markers, critical annotations, and action states.

## Style Decisions

- **Accent rule:** Oxide Orange `#E65B35` is the only primary action and annotation color; moss and slate remain secondary provenance signals for Unreal and Blender.
- **Typography rule:** Fraunces carries major headlines, section numerals, and thesis statements; IBM Plex Sans provides body and UI clarity; IBM Plex Mono marks metadata, IDs, and sources.
- **Brand rule:** The primary identity is the interlocking B/U glyph with the letter-spaced wordmark **FIELD//ENGINE**. “Field Manual Atelier” is the descriptive design mode, not the displayed brand name.
- **Motif rule:** Calibration rulers, numbered ticks, annotation marks, ruled boxes, and indexed cards are persistent field-book instrumentation rather than decorative accents.
