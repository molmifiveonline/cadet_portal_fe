import React, { useState, useEffect, useCallback } from "react";
import api from "../../../lib/utils/apiConfig";
import { toast } from "sonner";
import {
  isDepartmentCompatible,
  inputClass,
  formatAcademicScore,
} from "../allocationUtils";
import {
  Modal,
  Field,
  brandedSelectTriggerClass,
  BrandedSelectContent,
  BrandedSelectItem,
  Th,
  Td,
  Status,
} from "./AllocationPrimitives";
import { Button } from "../../../components/ui/button";
import { Search, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import CandidateQuickView from "./CandidateQuickView";

const candidatePageSize = 20;

const CandidatePicker = ({
  list: activeList,
  assessmentTypes,
  vesselTypes,
  onClose,
  onSaved,
}) => {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [candidateById, setCandidateById] = useState({});
  const [scoresByCandidate, setScoresByCandidate] = useState({});
  const [vesselTypeByCandidate, setVesselTypeByCandidate] = useState({});
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [batch, setBatch] = useState("");
  const [institute, setInstitute] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    page: 1,
    total: 0,
    total_pages: 1,
    batches: [],
    institutes: [],
  });
  const [quickView, setQuickView] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      const response = await api.get(
        `/allocations/rank-lists/${activeList.id}/eligible-candidates`,
        {
          params: {
            search: debouncedSearch || undefined,
            batch_year: batch || undefined,
            institute_id: institute || undefined,
            eligibility: "eligible",
            page,
            limit: candidatePageSize,
          },
        },
      );
      const candidates = response.data.data || [];
      setRows(candidates);
      setCandidateById((current) => ({
        ...current,
        ...Object.fromEntries(
          candidates.map((candidate) => [candidate.id, candidate]),
        ),
      }));
      const responseMeta = response.data.meta || {};
      setMeta((current) => ({ ...current, ...responseMeta }));
      if (responseMeta.page && responseMeta.page !== page) {
        setPage(responseMeta.page);
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load candidates";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [activeList.id, batch, debouncedSearch, institute, page]);

  useEffect(() => {
    load();
  }, [load]);

  const compatibleTypes = vesselTypes.filter(
    (item) =>
      item.status === "Active" &&
      isDepartmentCompatible(item.department, activeList.department),
  );
  const selectedSet = new Set(selected);

  const toggleCandidate = (row, checked) => {
    setSelected((current) =>
      checked
        ? [...new Set([...current, row.id])]
        : current.filter((candidateId) => candidateId !== row.id),
    );
  };

  const updateCandidateScore = (candidateId, scoreIndex, field, value) => {
    setScoresByCandidate((current) => ({
      ...current,
      [candidateId]: (current[candidateId] || []).map((score, index) =>
        index === scoreIndex ? { ...score, [field]: value } : score,
      ),
    }));
  };

  const addCandidateScore = (candidateId) => {
    setScoresByCandidate((current) => ({
      ...current,
      [candidateId]: [
        ...(current[candidateId] || []),
        { course_id: "", score: "" },
      ],
    }));
  };

  const removeCandidateScore = (candidateId, scoreIndex) => {
    setScoresByCandidate((current) => ({
      ...current,
      [candidateId]: (current[candidateId] || []).filter(
        (_, index) => index !== scoreIndex,
      ),
    }));
  };

  const getPreviewScore = (candidate) => {
    const scores = scoresByCandidate[candidate.id] || [];
    if (
      !scores.length ||
      scores.some((item) => item.score === "" || !item.course_id)
    ) {
      return null;
    }
    const values = scores.map((item) => Number(item.score));
    if (
      values.some(
        (value) => !Number.isFinite(value) || value < 0 || value > 100,
      )
    ) {
      return null;
    }
    const assessmentPercentage =
      values.reduce((total, value) => total + value, 0) / values.length;
    return (Number(candidate.academic_score) + assessmentPercentage) / 2;
  };

  const provisionalRanks = (() => {
    const rankedCandidates = [
      ...(activeList.allocations || [])
        .filter((allocation) => allocation.final_score !== null)
        .map((allocation) => ({
          key: `existing-${allocation.id}`,
          candidateId: allocation.cadet_unique_id,
          currentRank: allocation.current_rank,
          finalScore: Number(allocation.final_score),
          academicScore: Number(allocation.academic_score),
        })),
      ...selected
        .map((candidateId) => candidateById[candidateId])
        .filter(Boolean)
        .map((candidate) => ({
          key: `candidate-${candidate.id}`,
          candidateId: candidate.cadet_unique_id,
          finalScore: getPreviewScore(candidate),
          academicScore: Number(candidate.academic_score),
        }))
        .filter((candidate) => candidate.finalScore !== null),
    ].sort((left, right) => {
      if (activeList.ranking_mode === "Manual") {
        const leftRank = Number(left.currentRank) || Infinity;
        const rightRank = Number(right.currentRank) || Infinity;
        if (leftRank !== rightRank) return leftRank - rightRank;
      }
      return (
        right.finalScore - left.finalScore ||
        right.academicScore - left.academicScore ||
        String(left.candidateId).localeCompare(String(right.candidateId))
      );
    });
    return new Map(
      rankedCandidates.map((candidate, index) => [candidate.key, index + 1]),
    );
  })();

  const hasInvalidScores = selected.some((candidateId) => {
    const scores = scoresByCandidate[candidateId] || [];
    const courseIds = scores.map((score) => score.course_id);
    return (
      scores.some(
        (score) =>
          !score.course_id ||
          score.score === "" ||
          !Number.isFinite(Number(score.score)) ||
          Number(score.score) < 0 ||
          Number(score.score) > 100,
      ) || new Set(courseIds).size !== courseIds.length
    );
  });

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setBatch("");
    setInstitute("");
    setPage(1);
  };

  const add = async () => {
    try {
      setSaving(true);
      await api.post(`/allocations/rank-lists/${activeList.id}/candidates`, {
        candidates: selected.map((cadetId) => ({
          cadet_id: cadetId,
          scores: scoresByCandidate[cadetId] || [],
          vessel_type_id: vesselTypeByCandidate[cadetId] || null,
        })),
      });
      toast.success(
        `${selected.length} candidate${selected.length === 1 ? "" : "s"} added to ${activeList.department}. Continue to Score Entry when ready.`,
      );
      onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add candidates");
    } finally {
      setSaving(false);
    }
  };

  const firstResult = meta.total ? (meta.page - 1) * candidatePageSize + 1 : 0;
  const lastResult = Math.min(meta.page * candidatePageSize, meta.total);

  return (
    <>
      <Modal
        title={`Select ${activeList.department} Candidates`}
        onClose={() => {
          if (!saving) onClose();
        }}
        width="h-[92vh] max-w-[96vw]"
        bodyClassName="flex min-h-0 flex-col overflow-auto xl:overflow-hidden"
      >
        <div className="mb-3 flex shrink-0 flex-col gap-3 rounded-xl border border-[#3a5f9e]/20 bg-[#3a5f9e]/5 p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[#3a5f9e]">
              Step 1 of 5 · Candidate selection
            </p>
            <p className="mt-1 text-sm text-[#2b4b80]">
              Choose document-approved cadets. Scores can be entered now or
              later. Set Vessel Type on each cadet row.
            </p>
            {hasInvalidScores && (
              <p className="mt-1 text-xs font-semibold text-red-600">
                Complete or remove every started course-score row before adding.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="rounded-lg border border-[#3a5f9e]/20 bg-white px-4 py-2 text-sm font-bold text-[#3a5f9e]">
              {activeList.department} candidates
            </span>
            {selected.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-[#3a5f9e] hover:bg-[#3a5f9e]/10 hover:text-[#325186]"
                disabled={saving}
                onClick={() => {
                  setSelected([]);
                  setScoresByCandidate({});
                  setVesselTypeByCandidate({});
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="mb-3 flex shrink-0 flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-3">
            <Field label="Search">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className={`${inputClass} w-full pl-9`}
                  placeholder="Candidate ID or name"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </Field>
            <Field label="Batch / Year">
              <Select
                value={batch || "all-batches"}
                onValueChange={(value) => {
                  setBatch(value === "all-batches" ? "" : value);
                  setPage(1);
                }}
              >
                <SelectTrigger
                  className={brandedSelectTriggerClass}
                  aria-label="Filter by batch or year"
                >
                  <SelectValue />
                </SelectTrigger>
                <BrandedSelectContent>
                  <BrandedSelectItem value="all-batches">
                    All batches/years
                  </BrandedSelectItem>
                  {(meta.batches || []).map((value) => (
                    <BrandedSelectItem key={value} value={String(value)}>
                      {value}
                    </BrandedSelectItem>
                  ))}
                </BrandedSelectContent>
              </Select>
            </Field>
            <Field label="Institute">
              <Select
                value={institute || "all-institutes"}
                onValueChange={(value) => {
                  setInstitute(value === "all-institutes" ? "" : value);
                  setPage(1);
                }}
              >
                <SelectTrigger
                  className={brandedSelectTriggerClass}
                  aria-label="Filter by institute"
                >
                  <SelectValue />
                </SelectTrigger>
                <BrandedSelectContent>
                  <BrandedSelectItem value="all-institutes">
                    All institutes
                  </BrandedSelectItem>
                  {(meta.institutes || []).map((item) => (
                    <BrandedSelectItem key={item.id} value={String(item.id)}>
                      {item.name}
                    </BrandedSelectItem>
                  ))}
                </BrandedSelectContent>
              </Select>
            </Field>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="text-[#3a5f9e] hover:bg-[#3a5f9e]/10 hover:text-[#325186]"
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        </div>

        <div className="min-h-[340px] shrink-0 flex-1 overflow-auto rounded-xl border border-slate-200 xl:min-h-0 xl:shrink [&_tbody_td]:!py-2">
          <table className="w-full min-w-[1730px] table-fixed text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
              <tr>
                <Th className="w-12">
                  <span className="sr-only">Select candidate</span>
                </Th>
                <Th className="w-[135px]">Candidate ID</Th>
                <Th className="w-[190px]">Name</Th>
                <Th className="w-[170px]">Institute</Th>
                <Th className="w-[130px]">
                  Academic Score
                  <span className="block text-[10px] font-normal">
                    Read-only · /100
                  </span>
                </Th>
                <Th className="w-[360px]">Assessment Score per Course</Th>
                <Th className="w-[115px]">
                  Final Score
                  <span className="block text-[10px] font-normal">Auto</span>
                </Th>
                <Th className="w-[120px]">
                  Current Rank
                  <span className="block text-[10px] font-normal">
                    {activeList.ranking_mode === "Manual"
                      ? "After manual ranks"
                      : "Auto"}
                  </span>
                </Th>
                <Th className="w-[190px]">Vessel Type</Th>
                <Th className="w-[145px]">Allocation Status</Th>
                <Th className="w-[130px]">Action</Th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                [1, 2, 3, 4, 5].map((item) => (
                  <tr key={item} className="border-t">
                    <td colSpan={11} className="px-4 py-3">
                      <div className="h-8 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))}
              {!loading &&
                rows.map((row) => {
                  const isSelected = selectedSet.has(row.id);
                  const draftScores = scoresByCandidate[row.id] || [];
                  const previewScore = getPreviewScore(row);
                  const previewRank = provisionalRanks.get(
                    `candidate-${row.id}`,
                  );
                  return (
                    <tr
                      key={row.id}
                      className={`group border-t align-top ${isSelected ? "bg-[#3a5f9e]/5" : "hover:bg-[#3a5f9e]/[0.03]"}`}
                    >
                      <Td className="w-12">
                        <input
                          type="checkbox"
                          aria-label={`Select ${row.name_as_in_indos_cert}`}
                          disabled={!row.eligible || saving}
                          checked={isSelected}
                          onChange={(event) =>
                            toggleCandidate(row, event.target.checked)
                          }
                          className="h-4 w-4 rounded border-slate-300 text-[#3a5f9e] focus:ring-[#3a5f9e]/30"
                        />
                      </Td>
                      <Td className="break-words font-mono text-xs">
                        {row.cadet_unique_id}
                      </Td>
                      <Td>
                        <p className="font-semibold text-slate-900">
                          {row.name_as_in_indos_cert}
                        </p>
                        {!row.eligible && (
                          <p className="mt-1 text-xs font-medium text-amber-800">
                            {row.ineligible_reasons.join(" · ")}
                          </p>
                        )}
                      </Td>
                      <Td>{row.institute_name || "—"}</Td>
                      <Td>
                        <span className="font-bold text-slate-900">
                          {formatAcademicScore(row.academic_score)}
                        </span>
                      </Td>
                      <Td>
                        <div className="min-w-[330px] space-y-2">
                          {isSelected ? (
                            <>
                              {draftScores.map((score, scoreIndex) => {
                                const usedCourseIds = new Set(
                                  draftScores
                                    .filter((_, index) => index !== scoreIndex)
                                    .map((item) => item.course_id),
                                );
                                const invalidScore =
                                  score.score !== "" &&
                                  (!Number.isFinite(Number(score.score)) ||
                                    Number(score.score) < 0 ||
                                    Number(score.score) > 100);
                                return (
                                  <div
                                    key={scoreIndex}
                                    className="grid grid-cols-[minmax(170px,1fr)_90px_30px] gap-1.5"
                                  >
                                    <Select
                                      disabled={saving}
                                      value={score.course_id || "no-course"}
                                      onValueChange={(value) =>
                                        updateCandidateScore(
                                          row.id,
                                          scoreIndex,
                                          "course_id",
                                          value === "no-course" ? "" : value,
                                        )
                                      }
                                    >
                                      <SelectTrigger
                                        aria-label={`Assessment course ${scoreIndex + 1} for ${row.name_as_in_indos_cert}`}
                                        invalid={!score.course_id}
                                        className={`${brandedSelectTriggerClass} w-full`}
                                      >
                                        <SelectValue />
                                      </SelectTrigger>
                                      <BrandedSelectContent>
                                        <BrandedSelectItem value="no-course">
                                          Select course
                                        </BrandedSelectItem>
                                        {assessmentTypes
                                          .filter(
                                            (course) =>
                                              course.status === "Active" &&
                                              !usedCourseIds.has(course.id),
                                          )
                                          .map((course) => (
                                            <BrandedSelectItem
                                              key={course.id}
                                              value={String(course.id)}
                                            >
                                              {course.name}
                                            </BrandedSelectItem>
                                          ))}
                                      </BrandedSelectContent>
                                    </Select>
                                    <input
                                      aria-label={`Assessment score ${scoreIndex + 1} for ${row.name_as_in_indos_cert}`}
                                      className={`${inputClass} w-full ${invalidScore ? "border-red-500" : ""}`}
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                      placeholder="0–100"
                                      disabled={saving}
                                      value={score.score}
                                      onChange={(event) =>
                                        updateCandidateScore(
                                          row.id,
                                          scoreIndex,
                                          "score",
                                          event.target.value,
                                        )
                                      }
                                    />
                                    <button
                                      type="button"
                                      aria-label={`Remove assessment course ${scoreIndex + 1}`}
                                      className="rounded text-red-600 hover:bg-red-50"
                                      disabled={saving}
                                      onClick={() =>
                                        removeCandidateScore(row.id, scoreIndex)
                                      }
                                    >
                                      ×
                                    </button>
                                  </div>
                                );
                              })}
                              <button
                                type="button"
                                disabled={
                                  saving ||
                                  draftScores.length >=
                                    assessmentTypes.filter(
                                      (course) => course.status === "Active",
                                    ).length
                                }
                                className="text-xs font-bold text-[#3a5f9e] hover:text-[#325186] hover:underline disabled:text-slate-400"
                                onClick={() => addCandidateScore(row.id)}
                              >
                                + Add course score
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Select candidate to enter course scores
                            </span>
                          )}
                        </div>
                      </Td>
                      <Td>
                        {previewScore === null ? (
                          <span className="text-xs font-semibold text-slate-400">
                            Not scored
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-bold text-emerald-700">
                            {previewScore.toFixed(2)}
                          </span>
                        )}
                      </Td>
                      <Td>
                        <span
                          className={`font-bold ${previewRank ? "text-[#3a5f9e]" : "text-slate-400"}`}
                        >
                          {previewRank ? `#${previewRank}` : "Not ranked"}
                        </span>
                      </Td>
                      <Td>
                        <Select
                          disabled={!isSelected || saving}
                          value={
                            vesselTypeByCandidate[row.id] || "choose-later"
                          }
                          onValueChange={(value) =>
                            setVesselTypeByCandidate((current) => ({
                              ...current,
                              [row.id]: value === "choose-later" ? "" : value,
                            }))
                          }
                        >
                          <SelectTrigger
                            aria-label={`Vessel type for ${row.name_as_in_indos_cert}`}
                            className={`${brandedSelectTriggerClass} min-w-0`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <BrandedSelectContent>
                            <BrandedSelectItem value="choose-later">
                              Choose later
                            </BrandedSelectItem>
                            {compatibleTypes.map((item) => (
                              <BrandedSelectItem
                                key={item.id}
                                value={String(item.id)}
                              >
                                {item.name}
                              </BrandedSelectItem>
                            ))}
                          </BrandedSelectContent>
                        </Select>
                      </Td>
                      <Td>
                        <Status status="Pending" />
                        <p className="mt-1 text-[10px] text-slate-400">
                          Until vessel assignment
                        </p>
                      </Td>
                      <Td>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold text-[#3a5f9e] hover:text-[#325186] hover:underline"
                          onClick={() => setQuickView(row)}
                        >
                          <Eye size={15} /> View Candidate
                        </button>
                      </Td>
                    </tr>
                  );
                })}
              {!loading && !rows.length && (
                <tr>
                  <td colSpan={11} className="p-10 text-center">
                    {loadError ? (
                      <div>
                        <p className="font-semibold text-red-700">
                          {loadError}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          onClick={load}
                        >
                          Retry
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-slate-700">
                          No eligible {activeList.department} candidates match
                          these filters.
                        </p>
                        <button
                          type="button"
                          className="mt-2 text-sm font-bold text-[#3a5f9e] hover:text-[#325186] hover:underline"
                          onClick={clearFilters}
                        >
                          Clear filters
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 grid shrink-0 grid-cols-1 items-center gap-2 text-sm text-slate-500 lg:grid-cols-[1fr_auto_1fr]">
          <p className="hidden justify-self-start lg:block">
            Showing {firstResult}–{lastResult} of {meta.total || 0}
          </p>
          <div className="flex items-center justify-self-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-[#3a5f9e]/30 text-[#3a5f9e] hover:bg-[#3a5f9e]/10 hover:text-[#325186]"
              disabled={loading || meta.page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft size={15} className="mr-1" /> Previous
            </Button>
            <span className="min-w-24 text-center text-xs font-bold text-slate-600">
              Page {meta.page || 1} of {meta.total_pages || 1}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-[#3a5f9e]/30 text-[#3a5f9e] hover:bg-[#3a5f9e]/10 hover:text-[#325186]"
              disabled={loading || meta.page >= meta.total_pages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next <ChevronRight size={15} className="ml-1" />
            </Button>
          </div>
          <div className="flex items-center justify-self-center gap-2 lg:justify-self-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!selected.length || hasInvalidScores || saving}
              onClick={add}
            >
              {saving
                ? "Adding…"
                : `Add ${selected.length || ""} to ${activeList.department}`}
            </Button>
          </div>
        </div>
      </Modal>
      {quickView && (
        <CandidateQuickView
          candidate={quickView}
          department={activeList.department}
          onClose={() => setQuickView(null)}
        />
      )}
    </>
  );
};

export { candidatePageSize };
export default CandidatePicker;
