"use client";

import { useState } from "react";
import type {
  ReviewNote,
  ReviewNoteDraft,
  ReviewNoteType,
  ReviewStudySummary,
} from "@/src/features/radiology-review/types";

type ReviewNotesPanelProps = {
  study: ReviewStudySummary;
  notes: ReviewNote[];
  loading: boolean;
  error: string | null;
  filter: ReviewNoteType | "all";
  draft: ReviewNoteDraft;
  validationError: string | null;
  submitting: boolean;
  onFilterChange: (nextFilter: ReviewNoteType | "all") => void;
  onDraftChange: (nextDraft: ReviewNoteDraft) => void;
  onAddNote: () => void;
  onDeleteNote: (noteId: string) => void;
  onToggleImportant: (noteId: string) => void;
};

const noteTypeLabels: Record<ReviewNoteType | "all", string> = {
  all: "All",
  finding: "Finding",
  instruction: "Instruction",
  "follow-up": "Follow-up",
};

export function ReviewNotesPanel({
  study,
  notes,
  loading,
  error,
  filter,
  draft,
  validationError,
  submitting,
  onFilterChange,
  onDraftChange,
  onAddNote,
  onDeleteNote,
  onToggleImportant,
}: ReviewNotesPanelProps) {
  const [notePendingDelete, setNotePendingDelete] = useState<{ id: string; title: string } | null>(null);

  const handleDeleteRequest = (noteId: string, noteTitle: string) => {
    setNotePendingDelete({ id: noteId, title: noteTitle });
  };

  const confirmDelete = () => {
    if (!notePendingDelete) {
      return;
    }

    onDeleteNote(notePendingDelete.id);
    setNotePendingDelete(null);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Current study</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">{study.patientName}</h3>
        <p className="mt-1 text-sm text-slate-600">{study.modality} · {study.description}</p>
        <p className="mt-1 text-sm text-slate-600">{study.studyDate} · {study.seriesCount} series</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Add a note</h3>
            <p className="text-sm text-slate-500">Capture findings, instructions, or follow-ups.</p>
          </div>
          <select
            className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            value={draft.type}
            aria-label="Note type"
            onChange={(event) =>
              onDraftChange({
                ...draft,
                type: event.target.value as ReviewNoteType,
              })
            }
          >
            <option value="finding">Finding</option>
            <option value="instruction">Instruction</option>
            <option value="follow-up">Follow-up</option>
          </select>
        </div>

        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            placeholder="Short title"
            value={draft.title}
            onChange={(event) => onDraftChange({ ...draft, title: event.target.value })}
          />
          <textarea
            className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            placeholder="Add your review note"
            value={draft.message}
            onChange={(event) => onDraftChange({ ...draft, message: event.target.value })}
          />
        </div>

        {validationError ? <p className="mt-3 text-sm text-rose-600">{validationError}</p> : null}

        <button
          className="mt-4 cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
          onClick={onAddNote}
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Add note"}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">Saved notes</h3>
          <select
            className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            value={filter}
            aria-label="Filter notes"
            onChange={(event) => onFilterChange(event.target.value as ReviewNoteType | "all")}
          >
            {Object.entries(noteTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Loading notes…</div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
            {error}
          </div>
        ) : null}

        {!loading && !error && notes.length === 0 ? (
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            No notes yet for this study. Add the first one above.
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{note.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{note.type}</p>
                </div>
                <button
                  className={`cursor-pointer rounded-full px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                    note.important ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                  }`}
                  onClick={() => onToggleImportant(note.id)}
                  aria-pressed={note.important}
                >
                  {note.important ? "Important" : "Mark important"}
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-600">{note.message}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{new Date(note.createdAt).toLocaleString()}</span>
                <button
                  className="cursor-pointer text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-200"
                  onClick={() => handleDeleteRequest(note.id, note.title)}
                  aria-label={`Delete note ${note.title}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {notePendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="delete-note-title">
            <h3 id="delete-note-title" className="text-lg font-semibold text-slate-900">Delete note?</h3>
            <p className="mt-2 text-sm text-slate-600">
              This will permanently remove “{notePendingDelete.title}” from this review.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => setNotePendingDelete(null)}
              >
                Cancel
              </button>
              <button
                className="cursor-pointer rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
                onClick={confirmDelete}
              >
                Delete note
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
