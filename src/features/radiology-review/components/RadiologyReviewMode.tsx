"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { radiologyReviewModeConfig, isSupportedModality } from "@/src/features/radiology-review/config/radiologyReviewMode";
import { useReviewNotes } from "@/src/features/radiology-review/hooks/useReviewNotes";
import { useReviewRouteState, type ReviewRouteStatus } from "@/src/features/radiology-review/hooks/useReviewRouteState";
import { getMockStudySummary } from "@/src/features/radiology-review/services/mockReviewNotesApi";
import type { ReviewNoteType, ReviewStudySummary } from "@/src/features/radiology-review/types";

type RadiologyReviewModeProps = {
  studyInstanceUIDs: string;
  modality?: string;
};

const ReviewNotesPanel = dynamic(
  () => import("@/src/features/radiology-review/components/ReviewNotesPanel").then((mod) => mod.ReviewNotesPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Loading notes panel…
      </div>
    ),
  },
);

export function RadiologyReviewMode({ studyInstanceUIDs, modality }: RadiologyReviewModeProps) {
  const study = useMemo<ReviewStudySummary>(() => {
    const summary = getMockStudySummary(studyInstanceUIDs);
    return {
      ...summary,
      modality: (modality?.toUpperCase() as ReviewStudySummary["modality"]) ?? summary.modality,
    };
  }, [modality, studyInstanceUIDs]);

  const { state, setState } = useReviewRouteState(studyInstanceUIDs, modality);
  const { notes, loading, error, filter, draft, setDraft, validationError, submitting, setFilter, addNote, removeNote, toggleImportant } = useReviewNotes(study);

  const isValidStudy = isSupportedModality(study.modality);
  const toolbarTools = [
    { id: "pan", label: "Pan" },
    { id: "zoom", label: "Zoom" },
    { id: "window", label: "WW/WL" },
    { id: "reset", label: "Reset" },
  ] as const;

  const [viewportState, setViewportState] = useState({ panX: 0, panY: 0, zoom: 1, brightness: 1, contrast: 1 });
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const reviewStatusOptions: Array<{ id: ReviewRouteStatus; label: string }> = [
    { id: "in-review", label: "In Review" },
    { id: "pending", label: "Pending" },
    { id: "complete", label: "Completed" },
  ];
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const resetViewport = () => {
    setViewportState({ panX: 0, panY: 0, zoom: 1, brightness: 1, contrast: 1 });
  };

  const viewportStyle = useMemo(() => {
    return {
      transform: `translate(${viewportState.panX}px, ${viewportState.panY}px) scale(${viewportState.zoom})`,
      filter: `brightness(${viewportState.brightness}) contrast(${viewportState.contrast})`,
      transition: state.activeTool === "reset" ? "transform 180ms ease, filter 180ms ease" : "none",
    };
  }, [state.activeTool, viewportState]);

  useEffect(() => {
    if (!statusToast) {
      return;
    }

    const timer = window.setTimeout(() => setStatusToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [statusToast]);

  const handleReviewStatusChange = (nextStatus: ReviewRouteStatus) => {
    setState({ reviewStatus: nextStatus });
    setStatusToast(
      nextStatus === "complete"
        ? "Review complete confirmed."
        : nextStatus === "in-review"
          ? "Review moved to in review."
          : "Marked as pending."
    );
  };

  const statusBadgeClasses = state.reviewStatus === "pending"
    ? "rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700"
    : state.reviewStatus === "in-review"
      ? "rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700"
      : "rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700";

  const activeStatusLabel = state.reviewStatus === "pending"
    ? "Pending"
    : state.reviewStatus === "in-review"
      ? "In Review"
      : "Completed";

  const handleToolSelection = (toolId: (typeof toolbarTools)[number]["id"]) => {
    if (toolId === "reset") {
      resetViewport();
      return;
    }

    setState({ activeTool: toolId });
  };

  const handleViewportPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (state.activeTool !== "pan" && state.activeTool !== "window") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: viewportState.panX,
      originY: viewportState.panY,
    };

    viewportRef.current = event.currentTarget;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleViewportPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    if (!drag) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (state.activeTool === "pan") {
      setViewportState((current) => ({
        ...current,
        panX: drag.originX + deltaX,
        panY: drag.originY + deltaY,
      }));
      return;
    }

    if (state.activeTool === "window") {
      setViewportState((current) => ({
        ...current,
        brightness: clamp(current.brightness + deltaY / 300, 0.7, 1.4),
        contrast: clamp(current.contrast + deltaX / 300, 0.8, 1.4),
      }));
    }
  };

  const handleViewportPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragState.current = null;
    if (viewportRef.current === event.currentTarget) {
      viewportRef.current = null;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleViewportWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (state.activeTool === "zoom") {
      event.preventDefault();
      const zoomDelta = event.deltaY < 0 ? 0.12 : -0.12;
      setViewportState((current) => ({
        ...current,
        zoom: clamp(current.zoom + zoomDelta, 0.8, 2.2),
      }));
      return;
    }

    if (state.activeTool === "window") {
      event.preventDefault();
      setViewportState((current) => ({
        ...current,
        brightness: clamp(current.brightness + (event.deltaY < 0 ? 0.04 : -0.04), 0.7, 1.4),
        contrast: clamp(current.contrast + (event.deltaY < 0 ? 0.04 : -0.04), 0.8, 1.4),
      }));
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">OHIF mode</p>
            <h1 className="text-2xl font-semibold">{radiologyReviewModeConfig.name}</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
            {reviewStatusOptions.map((option) => {
              const isActive = state.reviewStatus === option.id;
              const activeClasses = option.id === "pending"
                ? "bg-amber-100 text-amber-700"
                : option.id === "in-review"
                  ? "bg-sky-100 text-sky-700"
                  : "bg-emerald-100 text-emerald-700";

              return (
                <button
                  key={option.id}
                  className={`cursor-pointer rounded-full px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                    isActive ? activeClasses : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                  onClick={() => handleReviewStatusChange(option.id)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {statusToast ? (
        <div
          className={`mx-6 mt-4 inline-flex w-fit items-center rounded-full border px-4 py-2 text-sm font-medium shadow-sm ${
            statusToast === "Review complete confirmed."
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : statusToast === "Review moved to in review."
                ? "border-sky-200 bg-sky-50 text-sky-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
          role="status"
          aria-live="polite"
        >
          {statusToast}
        </div>
      ) : null}

      {!isValidStudy ? (
        <div className="mx-6 mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This mode is only available for supported modalities: {radiologyReviewModeConfig.supportedModalities.join(", ")}.
        </div>
      ) : null}

      <main className="grid flex-1 grid-cols-1 gap-4 p-6 lg:grid-cols-[320px_minmax(0,1fr)_360px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{radiologyReviewModeConfig.layout.leftPanelTitle}</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{study.studyInstanceUID}</span>
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Study summary</p>
            <p className="mt-2">Patient: {study.patientName}</p>
            <p>Modality: {study.modality}</p>
            <p>Institution: {study.institutionName}</p>
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Series browser and study navigation would appear here in the full OHIF workflow.
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{radiologyReviewModeConfig.layout.mainPanelTitle}</h2>
            <span className={statusBadgeClasses}>
              {activeStatusLabel}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {toolbarTools.map((tool) => {
              const isActive = state.activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  className={`cursor-pointer rounded-full px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                    isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  onClick={() => handleToolSelection(tool.id)}
                >
                  {tool.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex min-h-105 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 to-slate-100 p-6 text-center text-sm text-slate-600">
            <div
              className="relative h-72 w-full max-w-[480px] overflow-hidden rounded-2xl border border-slate-300 bg-slate-900 shadow-inner"
              onPointerDown={handleViewportPointerDown}
              onPointerMove={handleViewportPointerMove}
              onPointerUp={handleViewportPointerUp}
              onPointerLeave={handleViewportPointerUp}
              onWheel={handleViewportWheel}
            >
              <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.18),_transparent_55%)]"
                style={viewportStyle}
              />
              <div className="absolute inset-0 flex items-center justify-center" style={viewportStyle}>
                <div className="h-48 w-48 rounded-full border-[24px] border-white/70 bg-gradient-to-br from-cyan-400 via-slate-200 to-emerald-300 opacity-90" />
              </div>
              <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                {state.activeTool === "window" ? "WW/WL" : state.activeTool.toUpperCase()}
              </div>
              <div className="absolute right-3 top-3 rounded-full bg-slate-950/70 px-3 py-1 text-[11px] font-medium text-white">
                {state.activeTool === "pan" ? "Drag to pan" : state.activeTool === "zoom" ? "Scroll to zoom" : state.activeTool === "window" ? "Drag or scroll for WW/WL" : "Ready"}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">{radiologyReviewModeConfig.layout.rightPanelTitle}</h2>
          <div className="mt-4 h-[calc(100%-2rem)]">
            <ReviewNotesPanel
              study={study}
              notes={notes}
              loading={loading}
              error={error}
              filter={filter}
              draft={draft}
              validationError={validationError}
              submitting={submitting}
              onFilterChange={setFilter as (nextFilter: ReviewNoteType | "all") => void}
              onDraftChange={setDraft}
              onAddNote={addNote}
              onDeleteNote={removeNote}
              onToggleImportant={toggleImportant}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
