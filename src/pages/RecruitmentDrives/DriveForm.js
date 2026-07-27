import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { Loader2, ArrowLeft, Save, Rocket } from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../lib/utils/apiConfig";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import PageHeader from "../../components/common/PageHeader";
import { errorTextClass } from "../../lib/utils/formStyles";

const DriveForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [institutesLoading, setInstitutesLoading] = useState(false);
  const [institutes, setInstitutes] = useState([]);
  const previousCourseTypeRef = useRef("");
  const isEdit = !!id;
  const returnTab = location.state?.returnTab;
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, index) =>
    String(currentYear - 2 + index),
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      drive_name: "",
      institute_id: "",
      course_type: "",
      year: String(currentYear),
      intake_capacity: 0,
      eligibility_criteria: "",
      status: "Draft",
    },
  });
  const selectedCourseType = useWatch({ control, name: "course_type" });

  // Fetch institutes for dropdown based on course type
  useEffect(() => {
    const courseType = selectedCourseType || "";

    if (!courseType) {
      setInstitutes([]);
      setInstitutesLoading(false);
      if (previousCourseTypeRef.current) {
        setValue("institute_id", "");
      }
      previousCourseTypeRef.current = courseType;
      return;
    }

    if (
      previousCourseTypeRef.current &&
      previousCourseTypeRef.current !== courseType
    ) {
      setValue("institute_id", "");
    }
    previousCourseTypeRef.current = courseType;

    let isActive = true;

    const fetchInstitutes = async () => {
      try {
        setInstitutesLoading(true);
        const response = await api.get("/institutes", {
          params: { limit: 1000, course_type: courseType },
        });
        if (isActive) {
          setInstitutes(response.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching institutes:", error);
        toast.error("Failed to fetch institutes");
        if (isActive) {
          setInstitutes([]);
        }
      } finally {
        if (isActive) {
          setInstitutesLoading(false);
        }
      }
    };

    fetchInstitutes();

    return () => {
      isActive = false;
    };
  }, [selectedCourseType, setValue]);

  // Fetch drive data if editing
  useEffect(() => {
    if (isEdit) {
      const fetchDrive = async () => {
        try {
          setFetching(true);
          const response = await api.get(`/recruitment-drives/${id}`);
          const drive = response.data.data;
          reset({
            drive_name: drive.drive_name,
            institute_id: drive.institute_id,
            course_type: drive.course_type,
            year: drive.year ? String(drive.year) : String(currentYear),
            intake_capacity: drive.intake_capacity,
            eligibility_criteria: drive.eligibility_criteria,
            status: drive.status,
          });
        } catch (error) {
          console.error("Error fetching drive:", error);
          toast.error("Failed to fetch drive details");
          navigate("/drives");
        } finally {
          setFetching(false);
        }
      };

      fetchDrive();
    }
  }, [currentYear, id, isEdit, reset, navigate]);

  const handleBack = () => {
    if (isEdit) {
      navigate(`/drives/${id}${returnTab ? `?tab=${returnTab}` : ""}`);
    } else {
      navigate("/drives");
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const payload = {
        ...data,
        year: parseInt(data.year, 10),
        intake_capacity: parseInt(data.intake_capacity) || 0,
      };

      if (isEdit) {
        await api.put(`/recruitment-drives/${id}`, payload);
        toast.success("Recruitment drive updated successfully");
        navigate(`/drives/${id}${returnTab ? `?tab=${returnTab}` : ""}`);
      } else {
        const response = await api.post("/recruitment-drives", payload);
        toast.success("Recruitment drive created successfully");
        const createdDriveId = response.data?.id;
        if (createdDriveId) {
          navigate(`/drives/${createdDriveId}`);
          return;
        }
        navigate("/drives");
      }
    } catch (error) {
      console.error("Error saving drive:", error);
      toast.error(
        error.response?.data?.message || "Failed to save recruitment drive",
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isEdit ? "Edit Recruitment Drive" : "Create New Recruitment Drive"
        }
        subtitle={
          isEdit
            ? "Update the details of the recruitment drive"
            : "Enter the details for the new recruitment drive"
        }
        icon={Rocket}
        backButton={
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Drives
          </Button>
        }
      />

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Drive Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Drive Name <span className="text-red-500">*</span>
              </label>
              <Input
                {...register("drive_name", {
                  required: "Drive name is required",
                })}
                placeholder="Enter drive name"
                invalid={!!errors.drive_name}
              />
              {errors.drive_name && (
                <p className={errorTextClass}>
                  {errors.drive_name.message}
                </p>
              )}
            </div>

            {/* Course Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Type <span className="text-red-500">*</span>
              </label>
              <Controller
                name="course_type"
                control={control}
                rules={{ required: "Course type is required" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      invalid={!!errors.course_type}
                    >
                      <SelectValue placeholder="Select course type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Deck">Deck</SelectItem>
                      <SelectItem value="Engine">Engine</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.course_type && (
                <p className={errorTextClass}>
                  {errors.course_type.message}
                </p>
              )}
            </div>

            {/* Institute */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institute <span className="text-red-500">*</span>
              </label>
              <Controller
                name="institute_id"
                control={control}
                rules={{ required: "Institute is required" }}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedCourseType || institutesLoading}
                  >
                    <SelectTrigger
                      invalid={!!errors.institute_id}
                    >
                      <SelectValue
                        placeholder={
                          !selectedCourseType
                            ? "Select course type first"
                            : institutesLoading
                              ? "Loading institutes..."
                              : "Select institute"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {institutes.length > 0 ? (
                        institutes.map((institute) => (
                          <SelectItem key={institute.id} value={institute.id}>
                            {institute.institute_name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-gray-500">
                          No institutes found
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.institute_id && (
                <p className={errorTextClass}>
                  {errors.institute_id.message}
                </p>
              )}
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year <span className="text-red-500">*</span>
              </label>
              <Controller
                name="year"
                control={control}
                rules={{ required: "Year is required" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      invalid={!!errors.year}
                    >
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.year && (
                <p className={errorTextClass}>
                  {errors.year.message}
                </p>
              )}
            </div>

            {/* Intake Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intake Capacity
              </label>
              <Input
                type="number"
                {...register("intake_capacity", {
                  min: { value: 0, message: "Capacity must be positive" },
                })}
                placeholder="0"
                invalid={!!errors.intake_capacity}
              />
              {errors.intake_capacity && (
                <p className={errorTextClass}>
                  {errors.intake_capacity.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Eligibility Criteria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Eligibility Criteria
            </label>
            <textarea
              {...register("eligibility_criteria")}
              placeholder="Enter eligibility criteria..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || loading}>
              {isSubmitting || loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEdit ? "Update Drive" : "Create Drive"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriveForm;
