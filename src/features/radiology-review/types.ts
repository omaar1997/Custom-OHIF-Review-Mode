export type SupportedModality = "CT" | "MR" | "CR" | "DX" | "US";
export type ReviewNoteType = "finding" | "instruction" | "follow-up";

export interface ReviewStudySummary {
  studyInstanceUID: string;
  modality: SupportedModality;
  patientName: string;
  studyDate: string;
  description: string;
  seriesCount: number;
  institutionName: string;
}

export interface ReviewNote {
  id: string;
  studyInstanceUID: string;
  type: ReviewNoteType;
  title: string;
  message: string;
  important: boolean;
  createdAt: string;
  author: string;
}

export interface ReviewNoteDraft {
  title: string;
  type: ReviewNoteType;
  message: string;
}

export interface RadiologyReviewModeConfig {
  name: string;
  route: string;
  supportedModalities: SupportedModality[];
  layout: {
    leftPanelTitle: string;
    mainPanelTitle: string;
    rightPanelTitle: string;
  };
  toolbarButtons: Array<{ id: string; label: string }>;
}
