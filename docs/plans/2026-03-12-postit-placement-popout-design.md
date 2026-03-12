# Design: PostIt Drag-to-Reorder + Hover Popout

**Date:** 2026-03-12
**Status:** Approved

## Overview

Two UX improvements to the Eisenhower board:
1. Users can drag PostIt notes to reorder them within a quadrant
2. Hovering a PostIt expands it in place so all text is readable

---

## Feature 1: Drag to Reorder Within Quadrant

### Approach
Extend the existing HTML5 drag API. No new dependencies.

### Data Model
No schema change. Tasks are stored as an ordered array in localStorage. The display order within each quadrant is the implicit array order. Reordering = splicing the array.

### Logic
- `App.reorderTask(draggedId: string, targetId: string)` — removes the dragged task from the array and inserts it immediately before the target task.
- This fires only when the drop target is another PostIt (detected via `onDragOver` on the PostIt itself), not the quadrant background.
- Cross-quadrant drop (onto the quadrant background) continues to call `moveTask` as before — no change to existing behaviour.

### Visual Feedback
- While dragging over a target note, it receives a visible left-border highlight (e.g. `border-l-4 border-indigo-500`) as an insertion indicator.

### Component Changes
- **`PostIt.tsx`**: add `onReorder: (draggedId: string, targetId: string) => void` prop; add `onDragOver` handler that calls `onReorder`.
- **`App.tsx`**: add `reorderTask` function; pass `onReorder={reorderTask}` to each `PostIt`.

---

## Feature 2: Hover Popout (Expand in Place)

### Approach
Large CSS scale transform on hover with high z-index. Pure CSS, no JS state.

### Behaviour
- Hover triggers `scale-[2.2]` (desktop) / `scale-[1.8]` (mobile) with `z-[999]`
- Note straightens (`rotate-0`) as it expands — consistent with existing hover
- Popout is suppressed while editing (`isEditing`) and while dragging (`isDragging`)
- Edit, delete, and move buttons remain functional on the expanded note

### Overflow Fix
The quadrant outer div currently has `overflow-hidden` (required for rounded corners to clip the header). This clips scaled notes at the quadrant boundary. Fix:
- Remove `overflow-hidden` from the outer quadrant wrapper
- The header and background colour are naturally contained by their own structure; rounded corner visual is preserved via `rounded-xl` on inner elements

### Component Changes
- **`PostIt.tsx`**: replace `hover:scale-110 hover:-translate-y-2` with larger responsive scale classes; add `hover:z-[999]`
- **`App.tsx`** (`renderQuadrant`): remove `overflow-hidden` from the outer quadrant `div`
