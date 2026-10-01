import { formatAcademicScore } from "../allocationUtils";
import React from "react";
import { Modal, Metric } from "./AllocationPrimitives";
import { Button } from "../../../components/ui/button";

const AcademicScoreCell = ({ allocation, onView }) => (
  <div className="min-w-36">
    <p className="font-bold text-slate-900">
      {formatAcademicScore(allocation.academic_score)}
    </p>
    <p className="text-[10px] text-slate-500">Profile snapshot used</p>
    <button
      type="button"
      onClick={onView}
      className="mt-1 text-xs font-semibold text-[#3a5f9e] hover:text-[#325186] hover:underline"
    >
      View academic scores
    </button>
  </div>
);

const AcademicScoresModal = ({ allocation, onClose }) => {
  const semesterScores = Array.from({ length: 8 }, (_, index) => ({
    label: `IMU Semester ${index + 1}`,
    value: allocation[`imu_sem_${index + 1}_percentage`],
  }));
  return (
    <Modal
      title={`Previous Academic Scores — ${allocation.name_as_in_indos_cert}`}
      onClose={onClose}
      width="max-w-3xl"
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-[#3a5f9e]/20 bg-[#3a5f9e]/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#3a5f9e]">
            Academic score used in this allocation
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {formatAcademicScore(allocation.academic_score)}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Read-only snapshot taken from the candidate profile when the
            candidate was added to this allocation.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            label="10th Average"
            value={formatAcademicScore(allocation.tenth_avg_percentage)}
          />
          <Metric
            label="12th PCM Average"
            value={formatAcademicScore(allocation.twelfth_pcm_avg_percentage)}
          />
          <Metric
            label="Current IMU Average"
            value={formatAcademicScore(allocation.profile_academic_score)}
          />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            IMU semester history
          </h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {semesterScores.map((score) => (
              <div
                key={score.label}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <p className="text-xs text-slate-500">{score.label}</p>
                <p className="mt-1 font-bold text-slate-900">
                  {formatAcademicScore(score.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export { AcademicScoreCell, AcademicScoresModal };
