import React, { useId, useRef, useState } from "react";
import { Ban, Info } from "lucide-react";
import { toast } from "sonner";
import api from "../../../lib/utils/apiConfig";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import { Button } from "../../../components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";

const getBlockedReason = (cycle) => {
  const lists = cycle.rank_lists || [];
  if (lists.some((list) => list.status === "Finalized")) {
    return "This allocation cannot be disabled because a rank list is finalized.";
  }
  const allocations = lists.flatMap((list) => list.allocations || []);
  if (
    Number(cycle.existing_joining_plan_count) > 0 ||
    allocations.some((row) => row.primary_joining_plan_id || row.secondary_joining_plan_id)
  ) {
    return "This allocation cannot be disabled because it has joining plans.";
  }
  if (Number(cycle.existing_onboarding_count) > 0 || allocations.some((row) => row.onboarding_id)) {
    return "This allocation cannot be disabled because it has onboarding records.";
  }
  return "";
};

export default function DisableAllocationButton({ cycle, onDisabled }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [disabling, setDisabling] = useState(false);
  const submitting = useRef(false);
  const reasonId = useId();
  const blockedReason = getBlockedReason(cycle);

  const confirmDisable = async () => {
    if (submitting.current || blockedReason || cycle.deleted_at || !reason.trim()) return;
    submitting.current = true;
    setDisabling(true);
    try {
      await api.delete(`/allocations/${cycle.id}`, { data: { reason: reason.trim() } });
      toast.success(`${cycle.allocation_number} disabled`);
      setOpen(false);
      await onDisabled();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to disable allocation");
    } finally {
      submitting.current = false;
      setDisabling(false);
    }
  };

  if (cycle.deleted_at) return null;

  return (
    <>
      <div className="inline-flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          disabled={Boolean(blockedReason) || disabling}
          aria-describedby={blockedReason ? reasonId : undefined}
          onClick={() => {
            setReason("");
            setOpen(true);
          }}
        >
          <Ban size={14} className="mr-1.5" aria-hidden="true" />
          Disable Allocation
        </Button>
        {blockedReason && (
          <>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Why disable allocation is unavailable"
                    className="rounded-md p-1 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <Info size={16} aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end" className="max-w-[280px] text-xs">
                  {blockedReason}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span id={reasonId} className="sr-only">
              {blockedReason}
            </span>
          </>
        )}
      </div>
      <ConfirmationModal
        isOpen={open}
        onClose={() => {
          if (!submitting.current) setOpen(false);
        }}
        onConfirm={confirmDisable}
        title="Disable CTV Vessel Allocation"
        message={`Disable ${cycle.allocation_number}? All records will remain available as history. Eligible cadets can be selected in another allocation. This action cannot be undone.`}
        confirmText="Confirm Disable"
        confirmDisabled={!reason.trim() || Boolean(blockedReason)}
        confirmButtonClass="bg-red-600 hover:bg-red-700 shadow-red-600/20"
        isLoading={disabling}
      >
        <label className="block text-sm font-medium text-slate-700">
          Reason for disabling <span className="text-red-600">*</span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={disabling}
            maxLength={1000}
            rows={3}
            required
            className="mt-2 w-full rounded-lg border border-slate-300 p-2"
          />
        </label>
      </ConfirmationModal>
    </>
  );
}
