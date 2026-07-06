import type { RadiologyReviewModeConfig, SupportedModality } from "@/src/features/radiology-review/types";

export const radiologyReviewModeConfig: RadiologyReviewModeConfig = {
  name: "Radiology Review Mode",
  route: "/review/:studyInstanceUIDs",
  supportedModalities: ["CT", "MR", "CR", "DX", "US"],
  layout: {
    leftPanelTitle: "Study/Series Browser",
    mainPanelTitle: "Cornerstone Viewport",
    rightPanelTitle: "Review Notes",
  },
  toolbarButtons: [{ id: "review-complete", label: "Review Complete" }],
};

export function isSupportedModality(modality: string): modality is SupportedModality {
  return radiologyReviewModeConfig.supportedModalities.includes(modality as SupportedModality);
}
