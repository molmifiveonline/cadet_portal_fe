import { CheckCircle, XCircle, RotateCcw, Clock } from "lucide-react";

const STAGE_CONFIG = {
  imported: {
    label: "Imported",
    color: "from-slate-400 to-slate-500",
    bg: "bg-slate-50",
    text: "text-slate-700",
  },
  cv_pending: {
    label: "CV Pending",
    color: "from-amber-400 to-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  cv_submitted: {
    label: "CV Submitted",
    color: "from-yellow-400 to-yellow-500",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
  },
  initial_screening: {
    label: "Initial Screening",
    color: "from-orange-400 to-orange-500",
    bg: "bg-orange-50",
    text: "text-orange-700",
  },
  test_scheduled: {
    label: "Test Scheduled",
    color: "from-cyan-400 to-cyan-500",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
  },
  test_completed: {
    label: "Test Completed",
    color: "from-sky-400 to-sky-500",
    bg: "bg-sky-50",
    text: "text-sky-700",
  },
  interview_scheduled: {
    label: "Interview Scheduled",
    color: "from-blue-400 to-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  interview_completed: {
    label: "Interview Completed",
    color: "from-indigo-400 to-indigo-500",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
  },
  final_evaluation: {
    label: "Final Evaluation",
    color: "from-violet-400 to-violet-500",
    bg: "bg-violet-50",
    text: "text-violet-700",
  },
  medical_scheduled: {
    label: "Medical Scheduled",
    color: "from-pink-400 to-pink-500",
    bg: "bg-pink-50",
    text: "text-pink-700",
  },
  medical_completed: {
    label: "Medical Completed",
    color: "from-green-400 to-green-500",
    bg: "bg-green-50",
    text: "text-green-700",
  },
  selected: {
    label: "Selected",
    color: "from-emerald-400 to-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  standby: {
    label: "Standby",
    color: "from-teal-400 to-teal-500",
    bg: "bg-teal-50",
    text: "text-teal-700",
  },
  rejected: {
    label: "Rejected",
    color: "from-red-400 to-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
  },
  joined: {
    label: "Joined",
    color: "from-green-500 to-green-600",
    bg: "bg-green-50",
    text: "text-green-700",
  },
  interview_failed: {
    label: "Interview Failed",
    color: "from-red-500 to-red-600",
    bg: "bg-red-50",
    text: "text-red-700",
  },
  Assessment: {
    label: "Assessment",
    color: "from-blue-400 to-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
};

const DOCUMENT_TYPES = [
  "CV",
  "Passport",
  "Medical Certificate",
  "Bank Details",
  "Academic Marksheet",
  "Aadhaar Card",
  "PAN Card",
  "INDOS Certificate",
  "CDC (Continuous Discharge Certificate)",
  "Agreement / Contract",
  "Other",
];

const STATUS_BADGES = {
  accepted: {
    className: "bg-green-100 text-green-800",
    icon: CheckCircle,
    label: "Accepted",
  },
  rejected: {
    className: "bg-red-100 text-red-800",
    icon: XCircle,
    label: "Rejected",
  },
  reupload_requested: {
    className: "bg-amber-100 text-amber-800",
    icon: RotateCcw,
    label: "Re-upload",
  },
  pending: {
    className: "bg-slate-100 text-slate-700",
    icon: Clock,
    label: "Pending",
  },
};

export { STAGE_CONFIG, DOCUMENT_TYPES, STATUS_BADGES };