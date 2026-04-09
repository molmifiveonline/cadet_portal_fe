import React, { useState } from "react";
import { X, Loader2, Upload, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import api from "../../lib/utils/apiConfig";
import { useEffect } from "react";

const SendEmailModal = ({
  isOpen,
  onClose,
  selectedInstitutes,
  onSuccess,
  defaultBatchYear,
  lockBatchYear = false,
  defaultCourseType,
  lockCourseType = false,
}) => {
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear + 1 - i); // [currentYear+1, ... currentYear-3]
  const resolvedDefaultBatchYear = defaultBatchYear
    ? defaultBatchYear.toString()
    : currentYear.toString();
  const resolvedDefaultCourseType = defaultCourseType || "";

  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    file: null,
    batch_year: resolvedDefaultBatchYear,
    course_type: resolvedDefaultCourseType,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        batch_year: resolvedDefaultBatchYear,
        course_type: resolvedDefaultCourseType,
      }));
    }
  }, [isOpen, resolvedDefaultBatchYear, resolvedDefaultCourseType]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (
        !file.name.endsWith(".xlsx") &&
        !file.name.endsWith(".xls") &&
        !file.name.endsWith(".csv")
      ) {
        toast.error("Please upload a valid Excel or CSV file");
        return;
      }
      setFormData((prev) => ({ ...prev, file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.subject ||
      !formData.description ||
      !formData.file ||
      !formData.course_type
    ) {
      toast.error("Please fill in all fields and upload a file");
      return;
    }

    if (selectedInstitutes.length === 0) {
      toast.error("No institutes selected");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append("instituteIds", JSON.stringify(selectedInstitutes));
      data.append("subject", formData.subject);
      data.append("description", formData.description);
      data.append("batch_year", formData.batch_year);
      data.append("course_type", formData.course_type);
      data.append("file", formData.file);

      await api.post("/institutes/send-email", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Emails sent successfully");
      setFormData({
        subject: "",
        description: "",
        batch_year: resolvedDefaultBatchYear,
        course_type: resolvedDefaultCourseType,
        file: null,
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error sending emails:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to send emails",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="animate-in fade-in zoom-in duration-200 flex w-full max-w-2xl max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-xl bg-white p-6 shadow-xl sm:max-h-[calc(100vh-3rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Send Email to Institutes
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Sending to {selectedInstitutes.length} selected institute
              {selectedInstitutes.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Batch Year <span className="text-red-500">*</span>
                </label>
                {lockBatchYear ? (
                  <Input name="batch_year" value={formData.batch_year} disabled />
                ) : (
                  <Select
                    name="batch_year"
                    value={formData.batch_year}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, batch_year: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Course Type <span className="text-red-500">*</span>
                </label>
                {lockCourseType ? (
                  <Input name="course_type" value={formData.course_type} disabled />
                ) : (
                  <Select
                    name="course_type"
                    value={formData.course_type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, course_type: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Course Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Deck">Deck</SelectItem>
                      <SelectItem value="Engine">Engine</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Subject <span className="text-red-500">*</span>
              </label>
              <Input
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Email Subject"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter email body..."
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Attach File (Excel) <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors text-center cursor-pointer relative">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  {formData.file ? (
                    <>
                      <FileText className="w-8 h-8 text-green-500" />
                      <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                        {formData.file.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        Click to change
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        Click to upload or drag and drop
                      </span>
                      <span className="text-xs text-gray-400">
                        XLSX, XLS, CSV up to 10MB
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex shrink-0 justify-end gap-3 border-t border-gray-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#3a5f9e] hover:bg-[#325186] text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
