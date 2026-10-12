import React from "react";
import { CheckCircle2, Clock3 } from "lucide-react";

function ConfirmationBadge({ confirmed, children }) {
  const Icon = confirmed ? CheckCircle2 : Clock3;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${
        confirmed
          ? "border-emerald-200 bg-emerald-100 text-emerald-800"
          : "border-amber-200 bg-amber-100 text-amber-800"
      }`}
    >
      <Icon size={17} className="shrink-0" aria-hidden="true" />
      {children}
    </span>
  );
}

export function FollowupConfirmationSummary({ plans }) {
  const confirmedCount = plans.filter((plan) => Number(plan?.confirmation_received)).length;
  const allConfirmed = plans.length > 0 && confirmedCount === plans.length;
  return (
    <ConfirmationBadge confirmed={allConfirmed}>
      {allConfirmed
        ? plans.length > 1
          ? "Both vessels confirmed"
          : "Confirmed"
        : confirmedCount
          ? `${confirmedCount} of ${plans.length} vessels confirmed`
          : "Awaiting confirmation"}
    </ConfirmationBadge>
  );
}

export default function FollowupConfirmation({ confirmed }) {
  return (
    <div className="mt-3 space-y-1">
      <ConfirmationBadge confirmed={confirmed}>
        Confirmation: {confirmed ? "Yes" : "No"}
      </ConfirmationBadge>
      <p className={`text-xs ${confirmed ? "text-emerald-800" : "text-amber-800"}`}>
        {confirmed ? "Cadet confirmed joining" : "Awaiting cadet confirmation"}
      </p>
    </div>
  );
}
