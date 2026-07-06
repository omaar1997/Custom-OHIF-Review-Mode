import type {
  ReviewNote,
  ReviewNoteDraft,
  ReviewStudySummary,
  SupportedModality,
} from "@/src/features/radiology-review/types";

const STORAGE_KEY = "rosenfield-review-notes";

const seedNotes: Record<string, ReviewNote[]> = {
  demo: [
    {
      id: "note-1",
      studyInstanceUID: "demo",
      type: "finding",
      title: "Small pleural effusion",
      message: "A subtle left-sided pleural effusion is visible in the lower lobe series.",
      important: true,
      createdAt: "2026-07-06T08:30:00.000Z",
      author: "Dr. Rivera",
    },
    {
      id: "note-2",
      studyInstanceUID: "demo",
      type: "instruction",
      title: "Correlate with prior imaging",
      message: "Please compare the current CT slices with the prior examination before signing off.",
      important: false,
      createdAt: "2026-07-06T09:00:00.000Z",
      author: "Dr. Chen",
    },
  ],
};

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function readStoredNotes(): Record<string, ReviewNote[]> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    return JSON.parse(raw) as Record<string, ReviewNote[]>;
  } catch {
    return {};
  }
}

function writeStoredNotes(nextNotes: Record<string, ReviewNote[]>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextNotes));
}

function getStudyNotes(studyInstanceUID: string): ReviewNote[] {
  const storedNotes = readStoredNotes();
  const existing = storedNotes[studyInstanceUID];

  if (existing) {
    return [...existing];
  }

  if (studyInstanceUID === "demo") {
    const seededNotes = [...seedNotes.demo];
    const nextStore = { ...storedNotes, [studyInstanceUID]: seededNotes };
    writeStoredNotes(nextStore);
    return seededNotes;
  }

  return [];
}

function saveStudyNotes(studyInstanceUID: string, nextNotes: ReviewNote[]) {
  const storedNotes = readStoredNotes();
  const nextStore = { ...storedNotes, [studyInstanceUID]: nextNotes };
  writeStoredNotes(nextStore);
}

export async function fetchReviewNotes(studyInstanceUID: string): Promise<ReviewNote[]> {
  await delay(600);
  return getStudyNotes(studyInstanceUID);
}

export async function createReviewNote(
  studyInstanceUID: string,
  draft: ReviewNoteDraft,
): Promise<ReviewNote> {
  await delay(400);
  const nextNote: ReviewNote = {
    id: createId("note"),
    studyInstanceUID,
    title: draft.title.trim(),
    message: draft.message.trim(),
    type: draft.type,
    important: false,
    createdAt: new Date().toISOString(),
    author: "Current Reviewer",
  };

  const existingNotes = getStudyNotes(studyInstanceUID);
  saveStudyNotes(studyInstanceUID, [nextNote, ...existingNotes]);
  return nextNote;
}

export async function deleteReviewNote(studyInstanceUID: string, noteId: string): Promise<void> {
  await delay(300);
  const existingNotes = getStudyNotes(studyInstanceUID);
  saveStudyNotes(studyInstanceUID, existingNotes.filter((note) => note.id !== noteId));
}

export async function updateReviewNoteImportant(
  studyInstanceUID: string,
  noteId: string,
  important: boolean,
): Promise<ReviewNote> {
  await delay(250);
  const existingNotes = getStudyNotes(studyInstanceUID);
  const note = existingNotes.find((entry) => entry.id === noteId);

  if (!note) {
    throw new Error("The note could not be found.");
  }

  const updatedNote = { ...note, important };
  const nextNotes = existingNotes.map((entry) => (entry.id === noteId ? updatedNote : entry));
  saveStudyNotes(studyInstanceUID, nextNotes);
  return updatedNote;
}

export function getMockStudySummary(studyInstanceUID: string): ReviewStudySummary {
  const modalities: SupportedModality[] = ["CT", "MR", "CR", "DX", "US"];
  const modality = modalities[(studyInstanceUID.length + studyInstanceUID.charCodeAt(0)) % modalities.length];

  return {
    studyInstanceUID,
    modality,
    patientName: "A. Johnson",
    studyDate: "2026-07-06",
    description: "Routine review study",
    seriesCount: 4,
    institutionName: "Rosenfield Medical Center",
  };
}
