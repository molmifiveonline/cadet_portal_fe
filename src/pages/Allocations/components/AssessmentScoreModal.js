import React, { useState } from "react";
import api from "../../../lib/utils/apiConfig";
import { toast } from "sonner";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../components/ui/select";
import { FieldError } from "./AllocationPrimitives";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";

const AssessmentScoreModal = ({
  allocation,
  assessmentTypes,
  onClose,
  onSaved,
}) => {
  const existingScores = (allocation.scores || []).filter(
    (item) => item.score !== null && item.score !== "",
  );
  const [rows, setRows] = useState(
    existingScores.length
      ? existingScores.map((item) => ({
          course_id: item.course_id,
          score: String(item.score),
        }))
      : [{ course_id: "", score: "" }],
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const choices = [...assessmentTypes];
  existingScores.forEach((score) => {
    if (!choices.some((item) => item.id === score.course_id)) {
      choices.push({
        id: score.course_id,
        name: score.course_name_snapshot,
        status: "Inactive",
      });
    }
  });

  const selectedIds = new Set(rows.map((row) => row.course_id).filter(Boolean));
  const hasUnusedAssessment =
    rows.every((row) => row.course_id) &&
    choices.some((choice) => !selectedIds.has(choice.id));
  const validScoreValues = rows
    .filter((row) => row.course_id && row.score !== "")
    .map((row) => Number(row.score))
    .filter((score) => Number.isFinite(score) && score >= 0 && score <= 100);
  const hasCompletePreview =
    rows.length > 0 && validScoreValues.length === rows.length;
  const assessmentAverage = hasCompletePreview
    ? validScoreValues.reduce((total, score) => total + score, 0) /
      validScoreValues.length
    : null;
  const academicScore = Number(allocation.academic_score);
  const finalScorePreview =
    assessmentAverage !== null && Number.isFinite(academicScore)
      ? (academicScore + assessmentAverage) / 2
      : null;

  const updateRow = (index, field, value) => {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
    setErrors((current) => ({
      ...current,
      form: "",
      [`${index}.${field}`]: "",
    }));
  };

  const addRow = () => {
    setRows((current) => [...current, { course_id: "", score: "" }]);
    setErrors((current) => ({ ...current, form: "" }));
  };

  const removeRow = (index) => {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
    setErrors({});
  };

  const save = async () => {
    const nextErrors = {};
    if (!rows.length)
      nextErrors.form = "Add at least one Assessment Type for this cadet.";

    const usedCourses = new Set();
    rows.forEach((row, index) => {
      if (!row.course_id) {
        nextErrors[`${index}.course_id`] = "Select an Assessment Type.";
      } else if (usedCourses.has(row.course_id)) {
        nextErrors[`${index}.course_id`] =
          "This Assessment Type is already selected.";
      } else {
        usedCourses.add(row.course_id);
      }

      const score = row.score === "" ? null : Number(row.score);
      if (score === null) {
        nextErrors[`${index}.score`] = "Enter the score.";
      } else if (!Number.isFinite(score) || score < 0 || score > 100) {
        nextErrors[`${index}.score`] = "Score must be between 0 and 100.";
      }
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setSaving(true);
      await api.put(
        `/allocations/candidate-allocations/${allocation.id}/scores`,
        {
          scores: rows.map((row) => ({
            course_id: row.course_id,
            score: Number(row.score),
          })),
        },
      );
      toast.success("Cadet assessment saved");
      onSaved();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to save cadet assessment",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ConfirmationModal
      isOpen
      onClose={onClose}
      onConfirm={save}
      title={`Assessment — ${allocation.name_as_in_indos_cert}`}
      message="Select only the Assessment Types required for this cadet. Every score is out of 100."
      confirmText="Save Assessment"
      isLoading={saving}
      confirmDisabled={!rows.length}
      maxWidthClass="max-w-2xl"
    >
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-[#3a5f9e]/20 bg-[#3a5f9e]/5 px-3 py-2 text-xs text-[#2b4b80]">
        <Pencil size={14} />
        <strong>Rank List Status: Draft</strong>
        <span>
          · Assessment scores are editable and saving recalculates the final
          score.
        </span>
      </div>
      <div className="mb-4 rounded-xl border border-[#3a5f9e]/15 bg-[#3a5f9e]/5 p-3">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[11px] font-medium text-slate-500">
              Academic Score
            </p>
            <p className="mt-1 font-bold text-slate-900">
              {Number.isFinite(academicScore) ? academicScore.toFixed(2) : "—"}%
            </p>
          </div>
          <div className="border-x border-[#3a5f9e]/15 px-2">
            <p className="text-[11px] font-medium text-slate-500">
              Assessment Average
            </p>
            <p className="mt-1 font-bold text-[#3a5f9e]">
              {assessmentAverage === null ? "—" : assessmentAverage.toFixed(2)}{" "}
              / 100
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">
              Final Score
            </p>
            <p className="mt-1 font-bold text-emerald-700">
              {finalScorePreview === null ? "—" : finalScorePreview.toFixed(2)}{" "}
              / 100
            </p>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-500">
          Formula: Final Score = (Profile IMU Academic % + Assessment Average %)
          ÷ 2
        </p>
      </div>
      <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
        {rows.map((row, index) => {
          const rowChoices = choices.filter(
            (choice) =>
              choice.id === row.course_id || !selectedIds.has(choice.id),
          );
          return (
            <div
              key={`${row.course_id || "new"}-${index}`}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_40px] sm:items-start">
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Assessment Type
                  </label>
                  <Select
                    value={row.course_id}
                    onValueChange={(value) =>
                      updateRow(index, "course_id", value)
                    }
                  >
                    <SelectTrigger
                      className="mt-1 bg-white"
                      invalid={Boolean(errors[`${index}.course_id`])}
                    >
                      <SelectValue placeholder="Select Assessment Type" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-white">
                      {rowChoices.map((choice) => (
                        <SelectItem key={choice.id} value={choice.id}>
                          {choice.name}
                          {choice.status === "Inactive" ? " (Inactive)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[`${index}.course_id`] && (
                    <FieldError>{errors[`${index}.course_id`]}</FieldError>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Score (Out of 100)
                  </label>
                  <Input
                    className="mt-1 bg-white"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={row.score}
                    invalid={Boolean(errors[`${index}.score`])}
                    onChange={(event) =>
                      updateRow(index, "score", event.target.value)
                    }
                    placeholder="0-100"
                  />
                  {errors[`${index}.score`] && (
                    <FieldError>{errors[`${index}.score`]}</FieldError>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-5 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => removeRow(index)}
                  title="Remove Assessment Type"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          );
        })}
        {!rows.length && (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">
            No Assessment Type selected.
          </div>
        )}
      </div>
      {errors.form && <FieldError>{errors.form}</FieldError>}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={addRow}
        disabled={!hasUnusedAssessment}
      >
        <Plus size={14} className="mr-1.5" />
        Add Another Assessment
      </Button>
      {!choices.length && (
        <p className="mt-2 text-xs text-red-600">
          No active Assessment Types are available. Add one in Assessment Type
          Master first.
        </p>
      )}
    </ConfirmationModal>
  );
};

export default AssessmentScoreModal;
