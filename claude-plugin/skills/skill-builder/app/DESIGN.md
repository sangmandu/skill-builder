---
name: skill-builder
version: 0.1.0
description: Design tokens and product UI rules for the Skill Builder workflow editor.
references:
  - https://rubric.im/curriculum/design-md/0
tokens:
  colors:
    canvas:
      background: "hsl(220 18% 6%)"
      grid: "hsl(220 12% 22%)"
      minimap: "hsl(220 16% 9%)"
      minimapMask: "rgba(148, 163, 184, 0.14)"
    surface:
      app: "hsl(220 18% 6%)"
      panel: "hsl(220 16% 9%)"
      panelMuted: "hsl(220 13% 15%)"
      border: "hsl(220 11% 22%)"
    accent:
      primary: "hsl(264 38% 62%)"
      flowEdge: "hsl(216 16% 52%)"
      danger: "hsl(0 58% 58%)"
      warning: "hsl(38 46% 56%)"
      info: "hsl(199 42% 54%)"
      success: "hsl(150 42% 48%)"
    groups:
      setup: "hsl(218 48% 55%)"
      investigate: "hsl(264 30% 58%)"
      ticket: "hsl(199 44% 48%)"
      plan: "hsl(164 34% 42%)"
      test: "hsl(40 48% 50%)"
      implement: "hsl(18 38% 52%)"
      commit: "hsl(338 32% 54%)"
      ci: "hsl(190 38% 46%)"
      review: "hsl(252 30% 56%)"
      complete: "hsl(124 28% 44%)"
      brainstorm: "hsl(292 30% 55%)"
  typography:
    family: "system-ui, -apple-system, sans-serif"
    uiText: "12px"
    stepTitle: "11px"
    meta: "10px"
  shape:
    radius: "8px"
    compactRadius: "6px"
  layout:
    groupGap: "60px"
    groupRowGap: "80px"
    groupPadding: "20px"
    stepWidth: "150px"
    stepHeight: "60px"
---

# Skill Builder DESIGN.md

## Overview

Skill Builder is an operational workflow editor. The interface should feel quiet, structural, and repeatable rather than promotional or decorative. The user is building automation, so the canvas must make sequence, grouping, state, and execution mode easy to scan without making every semantic category compete for attention.

This file follows the DESIGN.md pattern from the Rubric reference: tokens carry the concrete design decisions, and the prose explains how to use them.

## Colors

Use dark neutral surfaces for the app shell and canvas. The canvas background is intentionally close to black, but slightly slate so panels, grid lines, and node edges can separate without high contrast glow.

Group colors identify categories, not priority. Keep group hues muted and consistent. Do not raise saturation to make a group feel more important.

All generated group-to-group flow lines use `{tokens.colors.accent.flowEdge}`. The direction of workflow is communicated by placement and arrowheads, not by changing edge color per target group.

Use semantic colors sparingly:

- Success and solo execution: muted green.
- User-involved execution: muted amber.
- Background wait: muted cyan.
- Validation danger: restrained red.

## Typography

Use system UI fonts only. The builder is a work surface, so typography should be compact and predictable.

Step titles should fit within fixed node dimensions. Metadata such as step number, key, and status labels should stay smaller than the title.

## Layout

The canvas is the primary surface. Groups may be freely positioned, but their internal step nodes should stay aligned to fixed horizontal slots. Track views may wrap by row when the sequence becomes too wide.

Minimap and canvas controls stay on the bottom edge. They should not compete with workflow content.

## Elevation

Use elevation to separate floating tools from the canvas, not as decoration. Group nodes may use a subtle shadow because they are movable objects. Step nodes should rely mostly on border, left execution stripe, and hover state.

## Shapes

Use an 8px radius for groups, dialogs, panels, and buttons. Avoid larger rounded card shapes because this UI is an editor, not a landing page.

## Components

### Canvas

The canvas uses `{tokens.colors.canvas.background}` with a low-contrast grid. The grid should support spatial alignment without becoming a pattern.

### Groups

Group headers use the group token color. Group bodies stay neutral so the step cards remain readable. Handles may use the group color, but edges leaving the group still use the shared flow edge color.

### Steps

Step cards use a neutral dark surface. Execution mode is shown through the icon and a narrow left border, not through a full colored card background.

### Helpers

Helpers are reusable common skill instructions. They hold shared rules, guardrails, writing style, and repeated procedures so steps can reference the same instruction instead of duplicating text.

Always helpers describe global behavior that should apply across the skill. On demand helpers describe reusable procedures that a user can attach to selected steps.

Helper guidance should stay compact. Use a short visible definition in the Helpers panel and hover/focus tooltips for mode details.

### Edges

Generated group sequence edges must share one color. Manual semantic edges may use restrained semantic colors only when the edge type communicates a different kind of relation, such as dependency, branch, or validation constraint.

## Do's And Don'ts

- Do use muted, medium-chroma colors.
- Do keep the canvas calmer than the nodes.
- Do preserve consistent edge color for normal workflow sequence.
- Do use color to classify, not to decorate.
- Do not introduce neon purple, bright blue, or high-saturation green as dominant UI colors.
- Do not make every status or group equally loud.
- Do not put large marketing-style visuals into the editor surface.
