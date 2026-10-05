import React from "react";

const DriveCardSkeleton = ({ showMetrics = true }) => (
  <div
    aria-hidden="true"
    className="motion-safe:animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
  >
    <div className="mb-3 space-y-3">
      <div className="h-5 w-3/4 rounded bg-slate-200" />
      <div className="flex items-center gap-3">
        {showMetrics && (
          <div className="h-10 w-10 rounded-full bg-slate-100 sm:h-14 sm:w-14" />
        )}
        <div className="h-6 w-24 rounded-full bg-slate-200" />
      </div>
    </div>
    <div className="mb-3 h-4 w-2/3 rounded bg-slate-100" />
    <div className="mb-5 flex items-center gap-4">
      <div className="h-3 w-16 rounded bg-slate-100" />
      <div className="h-3 w-12 rounded bg-slate-100" />
      <div className="ml-auto h-3 w-8 rounded bg-slate-100" />
    </div>
    {showMetrics && (
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 py-2.5"
          >
            <div className="h-3.5 w-3.5 rounded bg-slate-200" />
            <div className="h-4 w-8 rounded bg-slate-200" />
            <div className="h-2 w-14 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    )}
    <div className="flex items-center justify-between border-t border-slate-50 pt-3">
      <div className="h-3 w-24 rounded bg-slate-100" />
      <div className="h-4 w-4 rounded bg-slate-100" />
    </div>
  </div>
);

export const RecruitmentDrivesSkeleton = ({
  count = 6,
  showMetrics = true,
  includePageChrome = false,
}) => (
  <div role="status" aria-label="Loading recruitment drives" className="space-y-6">
    <span className="sr-only">Loading recruitment drives...</span>
    {includePageChrome && (
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        <div className="space-y-3 p-2">
          <div className="h-8 w-60 rounded bg-slate-200" />
          <div className="h-4 w-full max-w-xl rounded bg-slate-100" />
        </div>
        <div className="grid grid-cols-1 gap-4 rounded-lg border bg-white p-4 shadow-sm md:grid-cols-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-10 rounded-md bg-slate-100" />
          ))}
        </div>
      </div>
    )}
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <DriveCardSkeleton key={index} showMetrics={showMetrics} />
      ))}
    </div>
  </div>
);

export default DriveCardSkeleton;
