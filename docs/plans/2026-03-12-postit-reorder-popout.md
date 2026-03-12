# PostIt Reorder + Hover Popout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to drag-reorder PostIt notes within a quadrant, and expand notes on hover so all text is readable.

**Architecture:** Extend the existing HTML5 drag API to detect within-quadrant reordering via `onDragOver` on PostIt nodes. Hover popout is pure CSS scale transform; the quadrant's `overflow-hidden` is removed to allow notes to visually overflow their container boundary.

**Tech Stack:** React 19, TypeScript, Tailwind CSS (CDN), Vite. No test runner is configured — verify each task manually in the browser via `npm run dev`.

---

### Task 1: Add `reorderTask` to App.tsx and wire up the prop

**Files:**
- Modify: `App.tsx` (around line 155 — after `moveTask`)
- Modify: `App.tsx` (around line 201 — the `PostIt` render call)

**Step 1: Add `reorderTask` function**

Insert after the `moveTask` function (line 157):

```tsx
const reorderTask = (draggedId: string, targetId: string) => {
  if (draggedId === targetId) return;
  const dragged = tasks.find(t => t.id === draggedId);
  if (!dragged) return;
  const without = tasks.filter(t => t.id !== draggedId);
  const targetIndex = without.findIndex(t => t.id === targetId);
  if (targetIndex === -1) return;
  const reordered = [...without.slice(0, targetIndex), dragged, ...without.slice(targetIndex)];
  persistAndSetTasks(reordered);
};
```

**Step 2: Pass `onReorder` to PostIt**

On line 201, update the `PostIt` render call:

```tsx
<PostIt key={task.id} task={task} onDelete={deleteTask} onMove={moveTask} onEdit={editTask} onReorder={reorderTask} />
```

**Step 3: Verify manually**

Run `npm run dev`. Check that the app still loads and notes render correctly (no errors in console). No visible change yet.

**Step 4: Commit**

```bash
git add App.tsx
git commit -m "feat: add reorderTask and wire onReorder prop"
```

---

### Task 2: Add `onReorder` prop and drag-over handler to PostIt.tsx

**Files:**
- Modify: `components/PostIt.tsx`

**Step 1: Add `onReorder` to the props interface**

Update the `PostItProps` interface (line 6–11):

```tsx
interface PostItProps {
  task: Task;
  onDelete: (id: string) => void;
  onMove: (id: string, newQuadrant: QuadrantType) => void;
  onEdit: (id: string, newSubject: string) => void;
  onReorder: (draggedId: string, targetId: string) => void;
}
```

**Step 2: Destructure `onReorder` in the component signature**

Line 13 — update:

```tsx
const PostIt: React.FC<PostItProps> = ({ task, onDelete, onMove, onEdit, onReorder }) => {
```

**Step 3: Add `isDragOver` state and drag-over handler**

After `const [isDragging, setIsDragging] = useState(false);` (line 16), add:

```tsx
const [isDragOver, setIsDragOver] = useState(false);
```

After `handleDragEnd` (line 47), add:

```tsx
const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation(); // prevent quadrant drop handler from also firing
  const draggedId = e.dataTransfer.getData('taskId');
  // dataTransfer.getData is empty during dragover in some browsers;
  // use the state set on drag start instead — we rely on the quadrant
  // handler being stopped via stopPropagation
  setIsDragOver(true);
};

const handleDragOverLeave = () => {
  setIsDragOver(false);
};

const handleDropOnNote = (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragOver(false);
  const draggedId = e.dataTransfer.getData('taskId');
  if (draggedId && draggedId !== task.id) {
    onReorder(draggedId, task.id);
  }
};
```

**Step 4: Attach handlers to the root div and add visual feedback**

Update the root `<div>` in the return statement. Add the handlers and the `isDragOver` border class:

```tsx
<div
  draggable={!isEditing}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  onDragOver={handleDragOver}
  onDragLeave={handleDragOverLeave}
  onDrop={handleDropOnNote}
  style={{ transform: `rotate(${rotation}deg)` }}
  className={`group relative bg-[#fff9c4] p-2 sm:p-4 md:p-2.5 lg:p-5 w-full max-w-[90px] sm:max-w-[140px] md:max-w-[100px] lg:max-w-[180px] aspect-square transition-all duration-300 post-it-shadow border-b-[1px] md:border-b-2 border-r-[1px] md:border-r-2 border-[#f0e68c] flex flex-col active:cursor-grabbing hover:z-50 ${
    isDragOver ? 'border-l-4 border-l-indigo-500 scale-105' : ''
  } ${
    isEditing ? 'z-[60] scale-105 shadow-2xl cursor-default rotate-0' : 'cursor-grab hover:rotate-0 hover:scale-110 hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-2xl'
  } ${
    isDragging
      ? 'opacity-40 scale-90 rotate-0'
      : ''
  }`}
>
```

**Step 5: Verify manually**

Run `npm run dev`. Drag a note over another note in the same quadrant — you should see the target note get a left indigo border. Release — the dragged note should appear before the target. Drag to a different quadrant — should still move the note to the new quadrant.

**Step 6: Commit**

```bash
git add components/PostIt.tsx
git commit -m "feat: drag-to-reorder postits within quadrant"
```

---

### Task 3: Remove overflow-hidden from quadrant wrapper in App.tsx

**Files:**
- Modify: `App.tsx` (line 178 — the quadrant outer `div`)

**Step 1: Remove `overflow-hidden` from the quadrant wrapper**

On line 178, the outer quadrant div currently reads:

```tsx
className={`flex flex-col h-full rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden border transition-all duration-300 ${
```

Remove `overflow-hidden`:

```tsx
className={`flex flex-col h-full rounded-xl sm:rounded-2xl md:rounded-3xl border transition-all duration-300 ${
```

**Step 2: Verify rounded corners are intact**

Run `npm run dev`. The quadrant corners should still appear rounded. The header should still clip correctly to its colour (the header div has its own colour class and sits inside the flex column — rounding comes from the parent, which still has `rounded-xl`).

If the header color bleeds past the corner, add `overflow-hidden` only to the header div:

```tsx
<div className={`px-2.5 sm:px-4 ... overflow-hidden ${q.color} ...`}>
```

**Step 3: Commit**

```bash
git add App.tsx
git commit -m "fix: remove overflow-hidden from quadrant to allow popout overflow"
```

---

### Task 4: Implement hover popout scale on PostIt.tsx

**Files:**
- Modify: `components/PostIt.tsx` (the root div `className`)

**Step 1: Replace the hover scale classes**

In the root div className (from Task 2, Step 4), the non-editing idle hover classes are:

```
cursor-grab hover:rotate-0 hover:scale-110 hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-2xl
```

Replace with:

```
cursor-grab hover:rotate-0 hover:scale-[1.8] lg:hover:scale-[2.2] hover:-translate-y-2 hover:shadow-2xl hover:z-[999]
```

The full `isEditing` ternary block should now read:

```tsx
isEditing
  ? 'z-[60] scale-105 shadow-2xl cursor-default rotate-0'
  : 'cursor-grab hover:rotate-0 hover:scale-[1.8] lg:hover:scale-[2.2] hover:-translate-y-2 hover:shadow-2xl hover:z-[999]'
```

**Step 2: Verify manually**

Run `npm run dev`. Hover over a PostIt — it should expand significantly, float above neighbouring notes, show all its text, and not be clipped by the quadrant boundary. Moving the mouse away should return it to normal.

Check edge cases:
- Note at the edge of the quadrant — should overflow into the neighbouring quadrant area without being clipped
- Note being edited — should NOT trigger the large popout scale
- Note being dragged — should NOT trigger the popout

**Step 3: Commit**

```bash
git add components/PostIt.tsx
git commit -m "feat: hover popout scale on postit notes"
```

---

### Task 5: Manual smoke test of combined behaviour

**No code changes — verification only.**

Scenarios to test in the browser:

1. Add 3+ notes to one quadrant. Drag note A over note C — A should insert before C.
2. Drag a note to a different quadrant — should move quadrant (not reorder).
3. Hover a note with long text — full text should be visible, note floats above neighbours.
4. Hover then click to edit — edit mode activates, no large popout while editing.
5. Hover a note in the corner of a quadrant — expanded note overflows into adjacent area without clipping.
6. Export board as JSON, refresh, reimport — order should be preserved (it's stored in array order).

If all pass, the feature is complete.
