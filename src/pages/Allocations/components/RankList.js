import { isVesselAllocated } from "../allocationUtils";
import React, { lazy, useState } from "react";
import api from "../../../lib/utils/apiConfig";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import {
  Plus,
  RotateCcw,
  Lock,
  Unlock,
  Pencil,
  ChevronUp,
  ChevronDown,
  Eye,
  Trash2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  Status,
  ReadinessItem,
  Th,
  Td,
  brandedSelectTriggerClass,
  BrandedSelectContent,
  BrandedSelectItem,
} from "./AllocationPrimitives";
import { AcademicScoreCell, AcademicScoresModal } from "./AcademicScores";
import AssessmentCell from "./AssessmentCell";
import VesselAssignmentCell from "./VesselAssignmentCell";
import { RankHistorySummary, RankHistoryModal } from "./RankHistory";
import AdminRemarksHistory from "./AdminRemarksHistory";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import {
  Select,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import DeferredDialog from "./DeferredDialog";

const AssessmentScoreModal = lazy(() => import("./AssessmentScoreModal"));

const RankList = ({
  list,
  assessmentTypes,
  reload,
  openCandidates,
  openVessel,
  isSuperAdmin,
  canEdit,
  canFinalizePermission,
}) => {
  const locked = list.status === "Finalized";
  const editable = !locked && canEdit;
  const candidateCount = list.allocations.length;
  const scoredCount = list.allocations.filter(
    (item) => item.final_score !== null,
  ).length;
  const rankedCount = list.allocations.filter(
    (item) => item.current_rank !== null,
  ).length;
  const allocatedCount = list.allocations.filter(isVesselAllocated).length;
  const finalizationIssues = list.allocations
    .map((allocation) => {
      const issues = [];
      if (allocation.final_score === null)
        issues.push("Final Score incomplete");
      if (!allocation.current_rank) issues.push("Rank unavailable");
      return {
        id: allocation.id,
        candidate: allocation.name_as_in_indos_cert,
        candidateId: allocation.cadet_unique_id,
        issues,
      };
    })
    .filter((item) => item.issues.length);
  const readyToFinalize = candidateCount > 0 && !finalizationIssues.length;
  const formulaLabel =
    list.formula_snapshot?.scoring_method === "AcademicAssessmentAverage"
      ? "Final = (IMU Academic % + Assessment Average %) ÷ 2"
      : `${list.formula_name || "Configured formula"} v${list.formula_version || 1}`;
  const [confirmation, setConfirmation] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [targetRank, setTargetRank] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [rankHistoryAllocation, setRankHistoryAllocation] = useState(null);
  const [assessmentAllocation, setAssessmentAllocation] = useState(null);
  const [academicAllocation, setAcademicAllocation] = useState(null);
  const act = async (action, message, body = {}) => {
    try {
      await api.post(`/allocations/rank-lists/${list.id}/${action}`, body);
      toast.success(message);
      reload();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
      return false;
    }
  };
  const openConfirmation = (config) => {
    setRemarks("");
    setTargetRank(
      config.defaultTargetRank ? String(config.defaultTargetRank) : "",
    );
    setConfirmation(config);
  };
  const closeConfirmation = () => {
    if (!actionLoading) {
      setConfirmation(null);
      setRemarks("");
      setTargetRank("");
    }
  };
  const confirmAction = async () => {
    if (!confirmation || (confirmation.remarksRequired && !remarks.trim()))
      return;
    try {
      setActionLoading(true);
      const completed = await confirmation.action(
        remarks.trim(),
        targetRank ? Number(targetRank) : null,
      );
      if (completed !== false) {
        setConfirmation(null);
        setRemarks("");
        setTargetRank("");
      }
    } finally {
      setActionLoading(false);
    }
  };
  const finalize = () =>
    openConfirmation({
      title: `Finalize ${list.department} Rank List`,
      message: readyToFinalize
        ? "Review scores and ranks before finalizing. Each vessel remains editable until its own joining plan is created."
        : "Resolve every blocking item before this Rank List can be finalized.",
      confirmText: "Finalize",
      showFinalizeSummary: true,
      finalizeBlocked: !readyToFinalize,
      showRemarks: true,
      remarksLabel: "Remarks (optional)",
      action: (value) =>
        act("finalize", `${list.department} list finalized`, {
          remarks: value,
        }),
    });
  const unlock = () =>
    openConfirmation({
      title: `Unlock ${list.department} Rank List`,
      message:
        "Unlocking allows rank and score changes and marks existing joining plans for review. Each vessel with a joining plan remains locked.",
      confirmText: "Unlock",
      showRemarks: true,
      remarksRequired: true,
      remarksLabel: "Reason for unlocking",
      action: (value) =>
        act("unlock", `${list.department} list unlocked`, { remarks: value }),
    });
  const reset = () =>
    openConfirmation({
      title: "Reset Rank Order",
      message: "Ranks will return to automatic Final Score order.",
      confirmText: "Reset Ranks",
      showRemarks: true,
      remarksRequired: true,
      remarksLabel: "Reason for resetting ranks",
      action: (value) => act("reset-ranks", "Ranks reset", { remarks: value }),
    });

  const move = (allocation, direction) => {
    const movingUp = direction === "up";
    const currentRank = Number(allocation.current_rank);
    const rankOptions = list.allocations
      .filter((item) => item.current_rank)
      .map((item) => Number(item.current_rank))
      .filter((rank) => (movingUp ? rank < currentRank : rank > currentRank))
      .sort((left, right) => left - right);
    if (!rankOptions.length) return;
    openConfirmation({
      title: `${movingUp ? "Move Up" : "Move Down"} — ${allocation.name_as_in_indos_cert}`,
      message: `${allocation.name_as_in_indos_cert} is currently ranked #${currentRank}. Select any ${movingUp ? "higher" : "lower"} position; candidates between the two ranks will shift automatically.`,
      confirmText: movingUp ? "Move Up" : "Move Down",
      showRankSelection: true,
      rankDirection: direction,
      rankOptions,
      currentRank,
      defaultTargetRank: movingUp ? currentRank - 1 : currentRank + 1,
      showRemarks: true,
      remarksRequired: true,
      remarksLabel: "Reason for changing rank",
      action: async (value, newRank) => {
        try {
          await api.post(
            `/allocations/candidate-allocations/${allocation.id}/move-rank`,
            { direction, target_rank: newRank, remarks: value },
          );
          toast.success(
            `Rank changed from ${allocation.current_rank} to ${newRank}`,
          );
          reload();
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to move rank");
          return false;
        }
      },
    });
  };
  const remove = (allocation) => {
    openConfirmation({
      title: "Remove Candidate",
      message: `Remove ${allocation.name_as_in_indos_cert} from this allocation?`,
      confirmText: "Remove",
      confirmButtonClass: "bg-red-600 hover:bg-red-700 shadow-red-600/20",
      action: async () => {
        try {
          await api.delete(
            `/allocations/candidate-allocations/${allocation.id}`,
          );
          toast.success("Candidate removed");
          reload();
          return true;
        } catch (error) {
          toast.error(
            error.response?.data?.message || "Failed to remove candidate",
          );
          return false;
        }
      },
    });
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{list.department} Rank List</h2>
          <p className="text-sm text-slate-500">
            {formulaLabel} ·{" "}
            <span className="font-semibold">{list.ranking_mode}</span> ranking
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editable && (
            <Button variant="outline" onClick={openCandidates}>
              <Plus size={16} className="mr-2" />
              Add Candidates
            </Button>
          )}
          {editable && list.ranking_mode === "Manual" && (
            <Button variant="outline" onClick={reset}>
              <RotateCcw size={16} className="mr-2" />
              Reset Score Order
            </Button>
          )}
          {!locked && canFinalizePermission && (
            <Button
              onClick={finalize}
              disabled={!candidateCount}
              title={
                !candidateCount
                  ? "Add candidates before finalizing"
                  : "Review readiness and finalize this rank list"
              }
            >
              <Lock size={16} className="mr-2" />
              Finalize
            </Button>
          )}
          {locked && isSuperAdmin && (
            <Button variant="outline" onClick={unlock}>
              <Unlock size={16} className="mr-2" />
              Unlock
            </Button>
          )}
          <Status status={list.status} />
        </div>
      </div>
      <div
        className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${!editable ? "border-amber-200 bg-amber-50 text-amber-900" : "border-[#3a5f9e]/25 bg-[#3a5f9e]/5 text-[#2b4b80]"}`}
      >
        <div
          className={`mt-0.5 rounded-full p-1 ${!editable ? "bg-amber-200" : "bg-[#3a5f9e]/15"}`}
        >
          {!editable ? <Lock size={14} /> : <Pencil size={14} />}
        </div>
        <div>
          <p className="font-semibold">
            {locked
              ? "Ranks and assessment scores are locked."
              : `Assessment scores are ${editable ? "editable" : "read-only"}.`}
          </p>
          <p className="mt-0.5 text-xs opacity-80">
            {locked
              ? `This ${list.department} Rank List is Finalized. ${canEdit ? "Each vessel locks when its own joining plan is created. " : ""}A Super Admin can unlock ranks and scores with a reason.`
              : canEdit
                ? list.ranking_mode === "Manual"
                  ? "Saving assessments updates the Final Score. Newly scored cadets are ranked after the existing manual order."
                  : "This Rank List is Draft. Saving assessment scores recalculates the Final Score and automatic rank immediately."
                : "You have view-only access to this Draft Rank List."}
          </p>
        </div>
      </div>
      {!locked && (
        <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-4">
          <ReadinessItem
            label="Candidates"
            complete={candidateCount > 0}
            value={candidateCount}
          />
          <ReadinessItem
            label="Scores complete"
            complete={candidateCount > 0 && scoredCount === candidateCount}
            value={`${scoredCount}/${candidateCount}`}
          />
          <ReadinessItem
            label="Ranks ready"
            complete={candidateCount > 0 && rankedCount === candidateCount}
            value={`${rankedCount}/${candidateCount}`}
          />
          <ReadinessItem
            label="Vessels allocated"
            complete={candidateCount > 0 && allocatedCount === candidateCount}
            value={`${allocatedCount}/${candidateCount}`}
          />
        </div>
      )}
      <div className="max-h-[65vh] overflow-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-[1900px] w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
            <tr>
              <Th>Rank</Th>
              <Th>Candidate</Th>
              <Th>Institute</Th>
              <Th>Academic Score</Th>
              <Th>Assessment</Th>
              <Th>
                Final Score
                <span className="block text-[10px] font-normal">
                  Out of 100
                </span>
              </Th>
              <Th>Vessel Type Allocation</Th>
              <Th>CTV Vessel Allocation</Th>
              <Th>Secondary Vessel Allocation</Th>
              <Th>Rank Change Remarks</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {list.allocations.map((allocation) => (
              <tr
                key={allocation.id}
                className="border-t align-top hover:bg-[#3a5f9e]/[0.025]"
              >
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="min-w-7 rounded bg-[#3a5f9e]/10 px-2 py-1 text-center font-bold text-[#3a5f9e]">
                      {allocation.current_rank || "—"}
                    </span>
                    {editable && allocation.current_rank && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Move ${allocation.name_as_in_indos_cert} up`}
                          title={
                            Number(allocation.current_rank) <= 1
                              ? "This candidate is already first"
                              : "Move to any higher rank"
                          }
                          disabled={Number(allocation.current_rank) <= 1}
                          onClick={() => move(allocation, "up")}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#3a5f9e]/30 text-[#3a5f9e] hover:bg-[#3a5f9e]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a5f9e] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronUp size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ${allocation.name_as_in_indos_cert} down`}
                          title={
                            Number(allocation.current_rank) >= rankedCount
                              ? "This candidate is already last"
                              : "Move to any lower rank"
                          }
                          disabled={
                            Number(allocation.current_rank) >= rankedCount
                          }
                          onClick={() => move(allocation, "down")}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#3a5f9e]/30 text-[#3a5f9e] hover:bg-[#3a5f9e]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a5f9e] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronDown size={16} aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                </Td>
                <Td>
                  <p className="font-semibold text-slate-900">
                    {allocation.name_as_in_indos_cert}
                  </p>
                  <p className="text-xs text-slate-500">
                    {allocation.cadet_unique_id}
                  </p>
                </Td>
                <Td>{allocation.institute_name || "—"}</Td>
                <Td>
                  <AcademicScoreCell
                    allocation={allocation}
                    onView={() => setAcademicAllocation(allocation)}
                  />
                </Td>
                <Td>
                  <AssessmentCell
                    allocation={allocation}
                    locked={!editable}
                    lockReason={locked ? "Finalized" : "Read-only access"}
                    onEdit={() => setAssessmentAllocation(allocation)}
                  />
                </Td>
                <Td>
                  <span
                    className={`rounded-full px-2.5 py-1 font-bold ${allocation.final_score === null ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                  >
                    {allocation.final_score === null
                      ? "Incomplete"
                      : Number(allocation.final_score).toFixed(2)}
                  </span>
                </Td>
                <Td>
                  <div className="min-w-40 space-y-1">
                    <p>
                      <span className="text-xs text-slate-500">Primary:</span>{" "}
                      <strong>
                        {allocation.vessel_type_name || "Not selected"}
                      </strong>
                    </p>
                    <p>
                      <span className="text-xs text-slate-500">Secondary:</span>{" "}
                      <strong>
                        {allocation.secondary_vessel_type_name ||
                          "Not selected"}
                      </strong>
                    </p>
                  </div>
                </Td>
                <Td>
                  <VesselAssignmentCell
                    allocation={allocation}
                    role="Primary"
                    locked={
                      !canEdit || allocation.onboarding_status === "Onboarded"
                    }
                    openVessel={openVessel}
                  />
                </Td>
                <Td>
                  <VesselAssignmentCell
                    allocation={allocation}
                    role="Secondary"
                    locked={
                      !canEdit || allocation.onboarding_status === "Onboarded"
                    }
                    openVessel={openVessel}
                  />
                </Td>
                <Td>
                  <RankHistorySummary
                    allocation={allocation}
                    onView={() => setRankHistoryAllocation(allocation)}
                  />
                </Td>
                <Td>
                  <Status status={list.status} />
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    <button
                      className="rounded p-1.5 text-[#3a5f9e] hover:bg-[#3a5f9e]/10"
                      title="View candidate"
                      onClick={() =>
                        window.open(
                          `/cadets/view/${allocation.cadet_id}`,
                          "_blank",
                        )
                      }
                    >
                      <Eye size={16} />
                    </button>
                    {editable && (
                      <button
                        className="rounded p-1.5 text-red-600 hover:bg-red-50"
                        title="Remove candidate"
                        onClick={() => remove(allocation)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
            {!list.allocations.length && (
              <tr>
                <td colSpan={12} className="p-10 text-center text-slate-500">
                  No candidates added to this list.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <AdminRemarksHistory list={list} />
      <ConfirmationModal
        isOpen={Boolean(confirmation)}
        onClose={closeConfirmation}
        onConfirm={confirmAction}
        title={confirmation?.title}
        message={confirmation?.message}
        confirmText={confirmation?.confirmText}
        confirmButtonClass={confirmation?.confirmButtonClass}
        isLoading={actionLoading}
        maxWidthClass={
          confirmation?.showFinalizeSummary ? "max-w-2xl" : "max-w-md"
        }
        confirmDisabled={
          (confirmation?.remarksRequired && !remarks.trim()) ||
          confirmation?.finalizeBlocked ||
          (confirmation?.showRankSelection &&
            (!targetRank || Number(targetRank) === confirmation.currentRank))
        }
      >
        {confirmation?.showFinalizeSummary && (
          <div className="mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Scores", scoredCount, candidateCount],
                ["Ranks", rankedCount, candidateCount],
              ].map(([label, complete, total]) => {
                const ready = total > 0 && complete === total;
                return (
                  <div
                    key={label}
                    className={`rounded-lg border p-3 text-center ${ready ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}
                  >
                    <p className="text-xs font-medium text-slate-500">
                      {label}
                    </p>
                    <p
                      className={`mt-1 font-bold ${ready ? "text-emerald-700" : "text-amber-700"}`}
                    >
                      {complete}/{total}
                    </p>
                  </div>
                );
              })}
            </div>
            {finalizationIssues.length ? (
              <div className="max-h-44 overflow-auto rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-900">
                  Blocking items ({finalizationIssues.length})
                </p>
                <ul className="mt-2 space-y-2 text-xs text-amber-900">
                  {finalizationIssues.map((item) => (
                    <li key={item.id}>
                      <strong>{item.candidate}</strong> ({item.candidateId}):{" "}
                      {item.issues.join(" · ")}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                <CheckCircle2 size={16} /> All candidates are ready. Finalizing
                locks scores, ranks and candidate membership. Vessel assignments
                remain editable.
              </div>
            )}
            <p className="text-xs text-slate-500">
              Vessels can be allocated before or after finalizing. Vessel
              compatibility is checked whenever an assignment is saved. Seat
              counts are for reference only.
            </p>
          </div>
        )}
        {confirmation?.showRankSelection && (
          <label className="mb-4 block text-sm font-medium text-slate-700">
            {confirmation.rankDirection === "up"
              ? "Move up to rank"
              : confirmation.rankDirection === "down"
                ? "Move down to rank"
                : "Move to rank"}
            <Select
              value={targetRank || "no-target-rank"}
              onValueChange={(value) =>
                setTargetRank(value === "no-target-rank" ? "" : value)
              }
            >
              <SelectTrigger
                className={`${brandedSelectTriggerClass} mt-1`}
                aria-label="Move candidate to rank"
              >
                <SelectValue />
              </SelectTrigger>
              <BrandedSelectContent>
                <BrandedSelectItem value="no-target-rank">
                  Select target rank
                </BrandedSelectItem>
                {confirmation.rankOptions
                  ?.filter((rank) => rank !== confirmation.currentRank)
                  .map((rank) => (
                    <BrandedSelectItem key={rank} value={String(rank)}>
                      Rank {rank}
                    </BrandedSelectItem>
                  ))}
              </BrandedSelectContent>
            </Select>
            {targetRank && Number(targetRank) !== confirmation.currentRank && (
              <span className="mt-2 flex items-center gap-2 rounded-lg border border-[#3a5f9e]/20 bg-[#3a5f9e]/5 px-3 py-2 text-xs text-[#2b4b80]">
                <strong>Rank {confirmation.currentRank}</strong>
                <ArrowRight size={14} />
                <strong>Rank {targetRank}</strong>
                <span>
                  · {Math.abs(confirmation.currentRank - Number(targetRank))}{" "}
                  other candidate(s) will shift
                </span>
              </span>
            )}
          </label>
        )}
        {confirmation?.showRemarks && (
          <label className="block text-sm font-medium text-slate-700">
            {confirmation.remarksLabel}
            <textarea
              className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-[#3a5f9e] focus:ring-2 focus:ring-[#3a5f9e]/20"
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder={
                confirmation.remarksRequired ? "Required" : "Optional"
              }
            />
          </label>
        )}
      </ConfirmationModal>
      {rankHistoryAllocation && (
        <RankHistoryModal
          allocation={rankHistoryAllocation}
          onClose={() => setRankHistoryAllocation(null)}
        />
      )}
      {academicAllocation && (
        <AcademicScoresModal
          allocation={academicAllocation}
          onClose={() => setAcademicAllocation(null)}
        />
      )}
      {assessmentAllocation && (
        <DeferredDialog onClose={() => setAssessmentAllocation(null)}>
          <AssessmentScoreModal
            allocation={assessmentAllocation}
            assessmentTypes={assessmentTypes}
            onClose={() => setAssessmentAllocation(null)}
            onSaved={() => {
              setAssessmentAllocation(null);
              reload();
            }}
          />
        </DeferredDialog>
      )}
    </div>
  );
};

export default RankList;
