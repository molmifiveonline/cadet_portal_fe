import React, { useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import CcRecipientsEditor from "../../components/common/CcRecipientsEditor";
import { toast } from "sonner";
import api from "../../lib/utils/apiConfig";

const SendEmailModal = ({
  isOpen,
  onClose,
  selectedInstitutes = [],
  instituteName,
  onSuccess,
  defaultBatchYear,
  defaultCourseType,
}) => {
  const [loading, setLoading] = useState(false);
  const [includeCc, setIncludeCc] = useState(false);
  const [ccRecipients, setCcRecipients] = useState([]);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (selectedInstitutes.length === 0) {
      toast.error("No institute selected");
      return;
    }

    if (!defaultCourseType) {
      toast.error("Course type is required");
      return;
    }

    setLoading(true);
    try {
      await api.post("/institutes/send-email", {
        instituteIds: selectedInstitutes,
        batch_year: defaultBatchYear,
        course_type: defaultCourseType,
        cc: includeCc ? ccRecipients : undefined,
      });

      toast.success("Email sent successfully");
      onSuccess?.();
      setIncludeCc(false);
      setCcRecipients([]);
      onClose();
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to send email",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setIncludeCc(false);
      setCcRecipients([]);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={handleClose}
    >
      <div
        className="animate-in fade-in zoom-in flex max-h-[95vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Send Email to Institute
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
            type="button"
            disabled={loading}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Institute Name
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {instituteName || "Selected institute"}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Course Type
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {defaultCourseType || "-"}
              </p>
            </div>

            <CcRecipientsEditor
              enabled={includeCc}
              onEnabledChange={setIncludeCc}
              recipients={ccRecipients}
              onChange={setCcRecipients}
              disabled={loading}
            />
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#3a5f9e] text-white hover:bg-[#325186]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Email"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendEmailModal;
