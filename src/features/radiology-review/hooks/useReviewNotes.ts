import { useEffect, useMemo, useState } from "react";
import type {
  ReviewNote,
  ReviewNoteDraft,
  ReviewNoteType,
  ReviewStudySummary,
} from "@/src/features/radiology-review/types";
import {
  createReviewNote,
  deleteReviewNote,
  fetchReviewNotes,
  updateReviewNoteImportant,
} from "@/src/features/radiology-review/services/mockReviewNotesApi";

const emptyDraft: ReviewNoteDraft = {
  title: "",
  type: "finding",
  message: "",
};

export function useReviewNotes(study: ReviewStudySummary) {
  const [notes, setNotes] = useState<ReviewNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReviewNoteType | "all">("all");
  const [draft, setDraft] = useState<ReviewNoteDraft>(emptyDraft);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadNotes() {
      setLoading(true);
      setError(null);

      try {
        const nextNotes = await fetchReviewNotes(study.studyInstanceUID);
        if (!cancelled) {
          setNotes(nextNotes);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load notes right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadNotes();

    return () => {
      cancelled = true;
    };
  }, [study.studyInstanceUID]);

  const filteredNotes = useMemo(() => {
    if (filter === "all") {
      return notes;
    }

    return notes.filter((note) => note.type === filter);
  }, [filter, notes]);

  const addNote = async () => {
    const trimmedTitle = draft.title.trim();
    const trimmedMessage = draft.message.trim();

    if (!trimmedTitle || !trimmedMessage) {
      setValidationError("Title and message are required before saving a note.");
      return;
    }

    const optimisticNote: ReviewNote = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      studyInstanceUID: study.studyInstanceUID,
      type: draft.type,
      title: trimmedTitle,
      message: trimmedMessage,
      important: false,
      createdAt: new Date().toISOString(),
      author: "You",
    };

    setValidationError(null);
    setSubmitting(true);
    setNotes((current) => [optimisticNote, ...current]);
    setDraft(emptyDraft);

    try {
      const createdNote = await createReviewNote(study.studyInstanceUID, {
        title: trimmedTitle,
        type: draft.type,
        message: trimmedMessage,
      });

      setNotes((current) => current.map((entry) => (entry.id === optimisticNote.id ? createdNote : entry)));
    } catch (err) {
      setNotes((current) => current.filter((entry) => entry.id !== optimisticNote.id));
      setDraft({ title: trimmedTitle, type: draft.type, message: trimmedMessage });
      setError(err instanceof Error ? err.message : "Unable to save the note.");
    } finally {
      setSubmitting(false);
    }
  };

  const removeNote = async (noteId: string) => {
    try {
      await deleteReviewNote(study.studyInstanceUID, noteId);
      setNotes((current) => current.filter((note) => note.id !== noteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete the note.");
    }
  };

  const toggleImportant = async (noteId: string) => {
    const note = notes.find((entry) => entry.id === noteId);

    if (!note) {
      return;
    }

    try {
      const updatedNote = await updateReviewNoteImportant(study.studyInstanceUID, noteId, !note.important);
      setNotes((current) => current.map((entry) => (entry.id === noteId ? updatedNote : entry)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update the note.");
    }
  };

  return {
    notes: filteredNotes,
    allNotes: notes,
    loading,
    error,
    filter,
    draft,
    setDraft,
    validationError,
    submitting,
    setFilter,
    addNote,
    removeNote,
    toggleImportant,
  };
}
