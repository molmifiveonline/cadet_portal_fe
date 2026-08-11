import React, { useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  FileText,
  Ship,
  UserCheck,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  ClipboardList,
  Anchor,
  Bell,
} from "lucide-react";
import { cn } from "../lib/utils/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import api from "../lib/utils/apiConfig";
import { formatDateForDisplay } from "../lib/utils/dateUtils";
import PageLoader from "../components/common/PageLoader";
import { STAGE_CONFIG } from "../lib/constant";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
// ─── Stage label + color mapping ────────────────────────────────────────────

const getStageInfo = (stage) => {
  if (!stage)
    return {
      label: "Unknown",
      color: "from-slate-400 to-slate-500",
      bg: "bg-slate-50",
      text: "text-slate-700",
    };

  const customStages = {
    cadets: {
      label: "Cadets",
      color: "from-indigo-500 to-indigo-600",
      bg: "bg-indigo-50/50",
      text: "text-indigo-700",
    },
    shortlisted: {
      label: "Shortlisted",
      color: "from-purple-500 to-purple-600",
      bg: "bg-purple-50/50",
      text: "text-purple-700",
    },
    assessment: {
      label: "Assessment",
      color: "from-cyan-500 to-cyan-600",
      bg: "bg-cyan-50/50",
      text: "text-cyan-700",
    },
    interview: {
      label: "Interview",
      color: "from-emerald-500 to-emerald-600",
      bg: "bg-emerald-50/50",
      text: "text-emerald-700",
    },
    medical: {
      label: "Medical",
      color: "from-lime-500 to-lime-600",
      bg: "bg-lime-50/50",
      text: "text-lime-700",
    },
    documents: {
      label: "Documents",
      color: "from-slate-500 to-slate-600",
      bg: "bg-slate-50/50",
      text: "text-slate-700",
    },
  };

  const key = stage.toLowerCase().trim();
  if (customStages[key]) return customStages[key];

  if (STAGE_CONFIG[stage]) return STAGE_CONFIG[stage];

  // Try normalized string format (e.g., "CV Submitted" -> "cv_submitted")
  const normalizedStage = stage.toLowerCase().replace(/\s+/g, "_");
  if (STAGE_CONFIG[normalizedStage]) return STAGE_CONFIG[normalizedStage];

  // Try match by label case-insensitive
  const matchByLabel = Object.values(STAGE_CONFIG).find(
    (config) => config.label.toLowerCase() === stage.toLowerCase(),
  );
  if (matchByLabel) return matchByLabel;

  // Vibrant beautiful fallback instead of plain gray
  return {
    label: stage,
    color: "from-indigo-400 to-purple-500",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
  };
};

const PipelineProgressBar = ({ count, percentage, info }) => {
  const [animatedCount, setAnimatedCount] = useState(0);

  useEffect(() => {
    let animationFrameId;
    const duration = 1000; // 1 second
    const startCount = 0;
    const endCount = count;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progressFraction = Math.min(elapsedTime / duration, 1);

      const easeOutQuad = (t) => t * (2 - t);
      const easedFraction = easeOutQuad(progressFraction);

      const currentCount = Math.round(
        startCount + easedFraction * (endCount - startCount),
      );

      setAnimatedCount(currentCount);

      if (progressFraction < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [count]);

  const currentPercentage =
    count > 0 ? (animatedCount / count) * percentage : 0;

  return (
    <div className="flex-1 flex items-center gap-3">
      <div className="flex-1 h-6 sm:h-8 bg-slate-100 rounded-xl overflow-hidden relative">
        <div
          className={cn(
            "h-full rounded-xl bg-gradient-to-r transition-none",
            info.color,
          )}
          style={{ width: `${Math.max(currentPercentage, 3)}%` }}
        />
      </div>
      <div className="w-12 sm:w-16 text-right">
        <span className={cn("text-xs sm:text-sm font-bold", info.text)}>
          {animatedCount}
        </span>
      </div>
    </div>
  );
};

// ─── Stats Card ─────────────────────────────────────────────────────────────
const StatsCard = ({ title, value, icon: Icon, gradient, subtitle }) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (typeof value !== "number") {
      setAnimatedValue(value);
      return;
    }

    let animationFrameId;
    const duration = 1000; // 1 second
    const startValue = 0;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progressFraction = Math.min(elapsedTime / duration, 1);

      const easeOutQuad = (t) => t * (2 - t);
      const easedFraction = easeOutQuad(progressFraction);

      const currentValue = Math.round(
        startValue + easedFraction * (endValue - startValue),
      );

      setAnimatedValue(currentValue);

      if (progressFraction < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value]);

  const displayValue =
    typeof value === "number" ? animatedValue.toLocaleString() : value;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl p-4 sm:p-6 min-h-[140px] sm:min-h-[180px] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-white/40 shadow-lg",
        "bg-white/60 backdrop-blur-2xl",
      )}
    >
      <div
        className={`absolute right-0 top-0 w-24 h-24 sm:w-32 sm:h-32 opacity-20 rounded-bl-full bg-gradient-to-br ${gradient} -mr-6 -mt-6 sm:-mr-8 sm:-mt-8`}
      />
      <div className="relative z-10">
        <div
          className={cn(
            "inline-flex p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br text-white shadow-lg shadow-black/5",
            gradient,
          )}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
      <div className="absolute inset-x-4 sm:inset-x-6 bottom-4 sm:bottom-6 z-10 flex items-end justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <p className="text-[11px] sm:text-sm font-semibold text-slate-500 truncate">
            {title}
          </p>
          {subtitle && (
            <div className="text-[10px] sm:text-xs text-slate-400 mt-1">
              {subtitle}
            </div>
          )}
        </div>
        <h3 className="text-2xl sm:text-4xl font-bold text-slate-800 tracking-tight text-right leading-none">
          {displayValue}
        </h3>
      </div>
    </div>
  );
};

// ─── Section Wrapper ────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, iconBg, children, badge }) => (
  <Card className="rounded-3xl border-white/40 bg-white/60 backdrop-blur-2xl shadow-lg overflow-hidden">
    <CardHeader className="pb-4 border-b border-slate-100/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-lg backdrop-blur-sm", iconBg)}>
            <Icon className="w-4 h-4" />
          </div>
          <CardTitle className="text-lg font-bold text-slate-800">
            {title}
          </CardTitle>
        </div>
        {badge !== undefined && (
          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
            {badge}
          </span>
        )}
      </div>
    </CardHeader>
    <CardContent className="p-0">{children}</CardContent>
  </Card>
);

// ─── Empty State ────────────────────────────────────────────────────────────
const EmptyState = ({ message, icon: Icon = CheckCircle }) => (
  <div className="px-6 py-12 text-center">
    <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
      <div className="p-3 bg-slate-50 rounded-full">
        <Icon className="w-6 h-6 text-slate-300" />
      </div>
      <p className="font-medium">{message}</p>
    </div>
  </div>
);

// ─── Table Wrapper ──────────────────────────────────────────────────────────
const TableHeader = ({ columns }) => (
  <thead>
    <tr className="bg-slate-50/50 border-b border-slate-200">
      {columns.map((col, i) => (
        <th
          key={i}
          className={cn(
            "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider",
            col.center && "text-center",
          )}
        >
          {col.label}
        </th>
      ))}
    </tr>
  </thead>
);

// ─── Main Dashboard ─────────────────────────────────────────────────────────
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [error, setError] = useState(null);
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState("all");

  useEffect(() => {
    const fetchDrives = async () => {
      try {
        const response = await api.get("/recruitment-drives?limit=1000");
        setDrives(response.data?.data || []);
      } catch (err) {
        console.error("Error fetching drives:", err);
      }
    };
    fetchDrives();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!stats) {
          setLoading(true);
        } else {
          setPipelineLoading(true);
        }

        const url =
          selectedDriveId && selectedDriveId !== "all"
            ? `/dashboard/stats?driveId=${selectedDriveId}`
            : "/dashboard/stats";
        const response = await api.get(url);

        if (stats) {
          // If we already have stats, only update the stageWiseCounts to prevent re-rendering other components
          setStats((prev) => ({
            ...prev,
            stageWiseCounts: response.data.data.stageWiseCounts,
          }));
        } else {
          setStats(response.data.data);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        if (!stats) setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
        setPipelineLoading(false);
      }
    };
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDriveId]);

  if (loading && !stats) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-red-500">
          <XCircle className="w-8 h-8" />
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const maxStageCount = Math.max(
    ...(stats?.stageWiseCounts || []).map((s) => s.count),
    1,
  );

  return (
    <>
      {/* ── Stats Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <StatsCard
          title="Total Institutes"
          value={stats?.totalInstitutes ?? 0}
          icon={GraduationCap}
          gradient="from-violet-500 to-purple-600"
        />
        <StatsCard
          title="Total Cadets"
          value={stats?.totalCandidates ?? 0}
          icon={Users}
          gradient="from-blue-500 to-indigo-600"
          subtitle={
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-md font-semibold">
                Male: {(stats?.maleCount ?? 0).toLocaleString()}
              </span>
              <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded-md font-semibold">
                Female: {(stats?.femaleCount ?? 0).toLocaleString()}
              </span>
            </div>
          }
        />
        <StatsCard
          title="Pending Documents"
          value={stats?.pendingDocuments?.length ?? 0}
          icon={FileText}
          gradient="from-amber-500 to-orange-600"
          subtitle="Awaiting review"
        />
      </div>

      {/* ── Stage-wise Candidate Pipeline ───────────────────────────── */}
      <Section
        title="Stage-wise Candidate Pipeline"
        icon={BarChart3}
        iconBg="bg-indigo-50/80 text-indigo-600"
        badge={`${stats?.stageWiseCounts?.find((s) => s.stage === "Cadets")?.count ?? 0} Total`}
      >
        <div className="p-6 relative">
          {pipelineLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-b-3xl">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
            </div>
          )}
          {/* Recruitment Drive Filter */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Filter by Recruitment Drive
            </span>
            <Select value={selectedDriveId} onValueChange={setSelectedDriveId}>
              <SelectTrigger
                aria-label="Filter by Recruitment Drive"
                className="h-11 w-full rounded-xl border-slate-200 bg-white/90 px-3.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:w-[22rem]"
              >
                <SelectValue placeholder="Select Recruitment Drive" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={6}
                className="max-h-80 w-[calc(100vw-2rem)] rounded-xl border-slate-200 shadow-xl sm:w-[min(42rem,calc(100vw-2rem))]"
              >
                <SelectItem value="all" className="py-2.5 font-semibold">
                  All Recruitment Drives
                </SelectItem>
                {drives.map((drive) => {
                  const label = `${drive.drive_name}${drive.institute_name ? ` (${drive.institute_name})` : ""}`;
                  return (
                    <SelectItem key={drive.id} value={drive.id} className="max-w-full py-2.5 pr-3" title={label}>
                      <span className="block max-w-[calc(100vw-5rem)] truncate sm:max-w-[37rem]">{label}</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {!stats?.stageWiseCounts?.length ? (
            <EmptyState message="No candidate data available" />
          ) : (
            <div className="space-y-3">
              {stats.stageWiseCounts.map((stage) => {
                const info = getStageInfo(stage.stage);
                const percentage = (
                  (stage.count / maxStageCount) *
                  100
                ).toFixed(0);
                return (
                  <div key={stage.stage} className="group">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                      <div className="w-full sm:w-40 shrink-0 flex items-center gap-2 mb-1 sm:mb-0">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full bg-gradient-to-r",
                            info.color,
                          )}
                        />
                        <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate capitalize">
                          {info.label}
                        </span>
                      </div>
                      <PipelineProgressBar
                        count={stage.count}
                        percentage={Number(percentage)}
                        info={info}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Section>

      <div className="mt-8" />

      {/* ── Pending Documents ────────────────────────────────────────── */}
      <Section
        title="Pending Documents"
        icon={ClipboardList}
        iconBg="bg-amber-50/80 text-amber-600"
        badge={stats?.pendingDocuments?.length ?? 0}
      >
        {!stats?.pendingDocuments?.length ? (
          <EmptyState message="No pending documents" icon={CheckCircle} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <TableHeader
                columns={[
                  { label: "Candidate" },
                  { label: "Institute" },
                  { label: "Document Type" },
                  { label: "Document Name" },
                  { label: "Status", center: true },
                  { label: "Submitted" },
                ]}
              />
              <tbody className="divide-y divide-slate-100">
                {stats.pendingDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                      {doc.cadet_name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {doc.institute_name || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg">
                        {doc.document_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {doc.document_name}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {doc.created_at
                        ? formatDateForDisplay(doc.created_at)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <div className="mt-8" />

      {/* ── CTV Ready Candidates ─────────────────────────────────────── */}
      {/* <Section
        title="Candidates Ready for CTV"
        icon={Anchor}
        iconBg="bg-emerald-50/80 text-emerald-600"
        badge={stats?.ctvReadyCandidates?.length ?? 0}
      >
        {!stats?.ctvReadyCandidates?.length ? (
          <EmptyState message="No candidates ready for CTV" icon={Ship} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <TableHeader
                columns={[
                  { label: "Cadet ID" },
                  { label: "Name" },
                  { label: "Course" },
                  { label: "Institute" },
                  { label: "Contact" },
                  { label: "Status", center: true },
                ]}
              />
              <tbody className="divide-y divide-slate-100">
                {stats.ctvReadyCandidates.map((candidate) => (
                  <tr
                    key={candidate.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-blue-600 font-semibold">
                      {candidate.cadet_unique_id || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                      {candidate.name_as_in_indos_cert || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {candidate.course || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {candidate.institute_name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {candidate.contact_number || "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg inline-flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Selected
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section> */}

      <div className="mt-8" />

      {/* ── Onboarding Pending List ──────────────────────────────────── */}
      {/* <Section
        title="Onboarding Pending"
        icon={UserCheck}
        iconBg="bg-teal-50/80 text-teal-600"
        badge={stats?.onboardingPending?.length ?? 0}
      >
        {!stats?.onboardingPending?.length ? (
          <EmptyState message="No onboarding pending" icon={CheckCircle} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <TableHeader
                columns={[
                  { label: "Cadet ID" },
                  { label: "Name" },
                  { label: "Course" },
                  { label: "Batch" },
                  { label: "Institute" },
                  { label: "Status", center: true },
                ]}
              />
              <tbody className="divide-y divide-slate-100">
                {stats.onboardingPending.map((candidate) => {
                  const info = getStageInfo(candidate.status);
                  return (
                    <tr
                      key={candidate.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-mono text-blue-600 font-semibold">
                        {candidate.cadet_unique_id || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                        {candidate.name_as_in_indos_cert || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {candidate.course || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {candidate.batch || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {candidate.institute_name || "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={cn(
                            "px-2.5 py-1 text-xs font-bold rounded-lg",
                            info.bg,
                            info.text,
                          )}
                        >
                          {info.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section> */}

      <div className="mt-8" />

      {/* ── Alerts & Expiry Notifications ─────────────────────────────── */}
      <Section
        title="Alerts & Expiry Notifications"
        icon={Bell}
        iconBg="bg-red-50/80 text-red-600"
        badge={stats?.expiryAlerts?.length ?? 0}
      >
        {!stats?.expiryAlerts?.length ? (
          <EmptyState message="No active alerts" icon={CheckCircle} />
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.expiryAlerts.map((alert) => {
              const isExpired = alert.expiry_status === "expired";
              return (
                <div
                  key={alert.id}
                  className={cn(
                    "px-6 py-4 flex items-center justify-between hover:bg-slate-50/30 transition-colors",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "p-2 rounded-xl",
                        isExpired
                          ? "bg-red-100 text-red-600"
                          : "bg-amber-100 text-amber-600",
                      )}
                    >
                      {isExpired ? (
                        <XCircle className="w-5 h-5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {alert.institute_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Username: {alert.temp_username || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={cn(
                        "px-3 py-1.5 text-xs font-bold rounded-xl inline-flex items-center gap-1",
                        isExpired
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700",
                      )}
                    >
                      {isExpired ? (
                        <>
                          <XCircle className="w-3 h-3" /> Expired
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" /> Expiring Soon
                        </>
                      )}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      {alert.temp_expiry
                        ? formatDateForDisplay(alert.temp_expiry)
                        : "—"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </>
  );
};

export default Dashboard;
