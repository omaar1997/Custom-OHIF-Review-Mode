"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type ReviewRouteStatus = "pending" | "in-review" | "complete";
export type ReviewToolbarTool = "pan" | "zoom" | "window" | "reset";

export interface ReviewRouteState {
  modality: string;
  reviewStatus: ReviewRouteStatus;
  activeTool: ReviewToolbarTool;
  selectedSeries: string;
}

const defaultState: ReviewRouteState = {
  modality: "CT",
  reviewStatus: "pending",
  activeTool: "pan",
  selectedSeries: "series-1",
};

export function useReviewRouteState(studyInstanceUIDs: string, initialModality?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state = useMemo<ReviewRouteState>(() => {
    const nextState: ReviewRouteState = {
      ...defaultState,
      modality: initialModality?.toUpperCase() ?? defaultState.modality,
    };

    const modalityParam = searchParams.get("modality");
    if (modalityParam) {
      nextState.modality = modalityParam.toUpperCase();
    }

    const reviewStatusParam = searchParams.get("reviewStatus");
    if (reviewStatusParam === "complete" || reviewStatusParam === "pending" || reviewStatusParam === "in-review") {
      nextState.reviewStatus = reviewStatusParam;
    }

    const activeToolParam = searchParams.get("tool");
    if (activeToolParam === "pan" || activeToolParam === "zoom" || activeToolParam === "window" || activeToolParam === "reset") {
      nextState.activeTool = activeToolParam;
    }

    const selectedSeriesParam = searchParams.get("series");
    if (selectedSeriesParam) {
      nextState.selectedSeries = selectedSeriesParam;
    }

    return nextState;
  }, [initialModality, searchParams]);

  const setState = (nextState: Partial<ReviewRouteState>) => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextState.modality) {
      params.set("modality", nextState.modality.toUpperCase());
    }

    if (nextState.reviewStatus) {
      params.set("reviewStatus", nextState.reviewStatus);
    }

    if (nextState.activeTool) {
      params.set("tool", nextState.activeTool);
    }

    if (nextState.selectedSeries) {
      params.set("series", nextState.selectedSeries);
    }

    const queryString = params.toString();
    const targetPath = `${pathname ?? `/review/${studyInstanceUIDs}`}${queryString ? `?${queryString}` : ""}`;

    router.replace(targetPath, { scroll: false });
  };

  return {
    state,
    setState,
  };
}
