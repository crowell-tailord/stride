"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, Label, CustomFieldDefinition } from "@/types/stride";
import { CheckSquare, Calendar, MessageSquare, AlertCircle, Paperclip } from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";

interface CardItemProps {
  card: Card;
  labels: Label[];
  customFields?: CustomFieldDefinition[];
  onCardClick: (card: Card) => void;
}

const COLOR_CLASSES: Record<string, string> = {
  emerald: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  amber: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  rose: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  indigo: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  sky: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  purple: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  teal: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  orange: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  zinc: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
};

export default function CardItem({
  card,
  labels,
  customFields,
  onCardClick,
}: CardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: "Card",
      card,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const cardLabels = labels.filter((l) => card.labelIds?.includes(l.id));

  // Checklists stats
  const totalChecks = card.checklist?.length || 0;
  const completedChecks = card.checklist?.filter((c) => c.isDone).length || 0;

  // Due date status formatting
  let dueDateInfo: { text: string; statusClass: string } | null = null;
  if (card.dueDate) {
    const due = new Date(card.dueDate);
    if (card.isCompleted) {
      dueDateInfo = {
        text: format(due, "MMM d"),
        statusClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      };
    } else if (isPast(due) && !isToday(due)) {
      dueDateInfo = {
        text: `${format(due, "MMM d")} (Overdue)`,
        statusClass: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      };
    } else if (isToday(due)) {
      dueDateInfo = {
        text: "Due today",
        statusClass: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      };
    } else if (isTomorrow(due)) {
      dueDateInfo = {
        text: "Tomorrow",
        statusClass: "bg-amber-500/10 text-amber-200 border-amber-500/20",
      };
    } else {
      dueDateInfo = {
        text: format(due, "MMM d"),
        statusClass: "bg-slate-800 text-slate-300 border-slate-700",
      };
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      suppressHydrationWarning
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Only trigger click modal if not dragging
        if (!isDragging) {
          e.stopPropagation();
          onCardClick(card);
        }
      }}
      className={`group relative bg-slate-900/90 hover:bg-slate-850 border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing select-none ${
        isDragging
          ? "opacity-30 border-dashed border-indigo-500 shadow-xl"
          : "border-slate-800/90 hover:border-slate-700"
      }`}
    >
      {/* Cover Image */}
      {card.coverImageUrl && (
        <div className="w-full h-28 overflow-hidden bg-slate-950 border-b border-slate-800/80 -mt-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.coverImageUrl}
            alt="Card cover"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
        </div>
      )}

      <div className="p-3">
        {/* Label Pills */}
        {cardLabels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {cardLabels.map((lbl) => (
              <span
                key={lbl.id}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                  COLOR_CLASSES[lbl.color] || COLOR_CLASSES.indigo
                }`}
              >
                {lbl.name}
              </span>
            ))}
          </div>
        )}

      {/* Card Title */}
      <h4
        className={`text-sm font-medium text-slate-100 leading-snug break-words ${
          card.isCompleted ? "line-through text-slate-400" : ""
        }`}
      >
        {card.title}
      </h4>

      {/* Badges footer */}
      <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs text-slate-400">
        {/* Due Date */}
        {dueDateInfo && (
          <div
            suppressHydrationWarning
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium border ${dueDateInfo.statusClass}`}
          >
            <Calendar className="w-3 h-3" />
            <span suppressHydrationWarning>{dueDateInfo.text}</span>
          </div>
        )}

        {/* Checklists */}
        {totalChecks > 0 && (
          <div
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] border ${
              completedChecks === totalChecks
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-slate-800 text-slate-400 border-slate-700/60"
            }`}
          >
            <CheckSquare className="w-3 h-3" />
            <span>
              {completedChecks}/{totalChecks}
            </span>
          </div>
        )}

        {/* Comments Count */}
        {(card.comments?.length || 0) > 0 && (
          <div className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <MessageSquare className="w-3 h-3" />
            <span>{card.comments.length}</span>
          </div>
        )}

        {/* Attachments Count */}
        {(card.attachments?.length || 0) > 0 && (
          <div className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <Paperclip className="w-3 h-3 text-indigo-400" />
            <span>{card.attachments!.length}</span>
          </div>
        )}

        {/* Priority Badge */}
        {card.priority === "urgent" && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
            <AlertCircle className="w-3 h-3" /> Urgent
          </span>
        )}
      </div>

      {/* Custom Fields (Show on Front) */}
      {(() => {
        // Deduplicate fields by ID to guarantee unique React keys
        const uniqueFieldsMap = new Map<string, CustomFieldDefinition>();
        (customFields || []).forEach((f) => {
          if (!uniqueFieldsMap.has(f.id)) {
            uniqueFieldsMap.set(f.id, f);
          }
        });

        const visibleFields = Array.from(uniqueFieldsMap.values()).filter(
          (f) =>
            f.showOnFront &&
            card.customFieldValues &&
            card.customFieldValues[f.id] !== undefined &&
            card.customFieldValues[f.id] !== ""
        );

        if (visibleFields.length === 0) return null;

        return (
          <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-800/60">
            {visibleFields.map((fld) => (
              <div
                key={fld.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-[10px] text-slate-300"
              >
                <span className="text-slate-500 font-medium">{fld.name}:</span>
                <span className="font-semibold text-indigo-300">
                  {card.customFieldValues![fld.id]}
                </span>
              </div>
            ))}
          </div>
        );
      })()}
      </div>
    </div>
  );
}
