import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItem {
  id: number;
  sortOrder: number;
}

interface Props<T extends SortableItem> {
  data: T[];
  onReorder: (items: { id: number; sortOrder: number }[]) => void;
  children: (items: T[]) => React.ReactNode;
  rowKey?: string;
}

function SortableRow({ id, children }: { id: number; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const dndStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={dndStyle} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export function DraggableTable<T extends SortableItem>({
  data,
  onReorder,
  children,
  rowKey = 'id',
}: Props<T>) {
  const ids = data.map((item) => (item as Record<string, unknown>)[rowKey] as number);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ids.indexOf(active.id as number);
    const newIndex = ids.indexOf(over.id as number);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...data];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const updates = reordered.map((item, i) => ({
      id: (item as Record<string, unknown>)[rowKey] as number,
      sortOrder: i,
    }));
    onReorder(updates);
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children(data)}
      </SortableContext>
    </DndContext>
  );
}

export { SortableRow };
