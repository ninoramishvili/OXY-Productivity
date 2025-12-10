# Drag & Drop Task Reordering Feature

**Date:** December 10, 2025  
**Feature:** Drag-and-drop task reordering in Today and Backlog views

---

## 🎯 Feature Overview

Implemented drag-and-drop functionality to allow users to manually reorder tasks in both the **Today** and **Backlog** views. Users can now arrange their tasks in any order they prefer by simply dragging them.

---

## 🔧 Technical Implementation

### 1. **Database Changes**

**Migration Script:** `backend/migrations/add-display-order.js`

- Added `display_order` column (INTEGER) to the `tasks` table
- Set initial display order based on `created_at` (newest first)
- Created index on `(user_id, display_order)` for performance

```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_tasks_display_order ON tasks(user_id, display_order);
```

### 2. **Backend Changes**

**File:** `backend/routes/tasks.js`

- **Modified GET endpoint:** Now orders tasks by `display_order ASC, created_at DESC`
- **Added POST `/tasks/reorder` endpoint:** Accepts array of `{ id, display_order }` and updates task order in a transaction

```javascript
router.post('/reorder', verifyToken, async (req, res) => {
  const { taskOrders } = req.body;
  // Updates display_order for each task in a transaction
});
```

**File:** `frontend/src/utils/api.js`

- Added `reorderTasks(taskOrders)` method to `tasksAPI`

### 3. **Frontend Changes**

**Library:** Installed `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

**Files Modified:**
- `frontend/src/pages/Home.jsx`
- `frontend/src/pages/Backlog.jsx`
- `frontend/src/pages/Home.css`
- `frontend/src/pages/Backlog.css`

**Key Components:**
- Created `SortableTaskCard` component for Today view
- Created `SortableBacklogCard` component for Backlog view
- Both components use `useSortable` hook from `@dnd-kit/sortable`
- Wrapped task lists with `DndContext` and `SortableContext`

**Features:**
- **Drag Handle:** Added `GripVertical` icon as a drag handle on each task card
- **Visual Feedback:** Cards become semi-transparent and scale up while dragging
- **Activation Constraint:** 8px distance required to start dragging (prevents accidental drags)
- **Optimistic Updates:** UI updates immediately, then syncs with backend
- **Error Handling:** Reverts to previous order if backend save fails

### 4. **Sorting Options**

Added "Manual Order (Drag)" as the default sorting option in both views:
- **Manual Order (Drag)** - Uses `display_order` field
- Newest First
- Oldest First
- Name (A-Z)
- Name (Z-A)
- Priority

When "Manual Order" is selected, users can drag-and-drop to reorder. Other sorting options disable drag-and-drop.

---

## 🎨 UI/UX Details

### Drag Handle
- Icon: `GripVertical` from Lucide React
- Position: Left side of each task card
- Cursor: Changes to `grab` on hover, `grabbing` while dragging
- Color: Tertiary text color, becomes secondary on hover

### Dragging State
- Card opacity: 50%
- Card scale: 102%
- Box shadow: Elevated shadow for depth
- Z-index: 999 to appear above other cards

### Activation
- Requires 8px pointer movement to prevent accidental drags
- Works with mouse and touch devices

---

## 🔄 Data Flow

1. **User drags task** → `handleDragEnd` triggered
2. **Calculate new order** → Use `arrayMove` to reorder local state
3. **Optimistic update** → Update UI immediately
4. **Backend sync** → Send `taskOrders` array to `/tasks/reorder`
5. **Success** → Order persisted
6. **Error** → Reload tasks to revert to server state

---

## 🧪 Testing Checklist

- [x] Drag tasks in Today view
- [x] Drag tasks in Backlog view
- [x] Order persists after page refresh
- [x] Order syncs across views (Today and Backlog)
- [x] Drag handle is visible and functional
- [x] Visual feedback during drag
- [x] Other sorting options still work
- [x] Error handling (network failure)
- [x] Works in all themes (Dark, Light, OXY)

---

## 📝 Notes

- Drag-and-drop only works when "Manual Order (Drag)" is selected
- The `display_order` field is user-specific (per `user_id`)
- Initial order is based on creation date (newest first)
- The feature uses modern HTML5 drag-and-drop with pointer sensors for better mobile support

---

## 🚀 Future Enhancements

Potential improvements for future iterations:
- Drag tasks between Today and Backlog
- Drag tasks to calendar dates
- Keyboard shortcuts for reordering
- Undo/redo for reordering actions
- Bulk reordering operations

---

**Status:** ✅ Complete and pushed to GitHub

