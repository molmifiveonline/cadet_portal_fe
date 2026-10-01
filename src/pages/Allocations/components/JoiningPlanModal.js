import React, { useState } from "react";
import api from "../../../lib/utils/apiConfig";
import { toast } from "sonner";
import { Modal, Field, FieldError } from "./AllocationPrimitives";
import { today, inputClass } from "../allocationUtils";
import { Button } from "../../../components/ui/button";
import { Mail } from "lucide-react";

const JoiningPlanModal = ({
  candidate,
  vessels,
  onClose,
  onCreated,
  canCommunicate = false,
}) => {
  const secondary = candidate.vesselRole === "Secondary";
  const vesselId = secondary
    ? candidate.secondary_vessel_id
    : candidate.vessel_id;
  const vessel = vessels.find((item) => item.id === vesselId) || {};
  const vesselType = secondary
    ? candidate.secondary_vessel_type_name
    : candidate.vessel_type_name;
  const [form, setForm] = useState({
    joining_date:
      vessel.joining_date ||
      (secondary ? candidate.secondary_joining_date : candidate.joining_date) ||
      "",
    location: vessel.location || "",
    voyage_ref: vessel.voyage_ref || "",
    reporting_port: vessel.reporting_port || "",
    contact_person_name: vessel.contact_person_name || "",
    contact_person_email: vessel.contact_person_email || "",
    contact_person_phone: vessel.contact_person_phone || "",
    required_documents: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };
  const validate = () => {
    const next = {};
    if (!form.joining_date)
      next.joining_date = "Select the candidate joining date.";
    if (!form.reporting_port.trim())
      next.reporting_port = "Enter the reporting port or location.";
    if (!form.contact_person_name.trim())
      next.contact_person_name =
        "Enter the contact person for the joining intimation.";
    if (
      form.contact_person_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_person_email)
    )
      next.contact_person_email = "Enter a valid contact email address.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const create = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      const payload = {
        ...form,
        vessel_role: candidate.vesselRole,
        required_documents: form.required_documents
          .split(/[\n,]/)
          .map((item) => item.trim())
          .filter(Boolean),
      };
      const response = await api.post(
        `/allocations/candidate-allocations/${candidate.id}/joining-plan`,
        payload,
      );
      toast.success(
        `${candidate.vesselRole} Joining Plan ${candidate.refreshJoiningPlan ? "updated" : "created"}`,
      );
      onCreated({
        ...response.data.data,
        name_as_in_indos_cert: candidate.name_as_in_indos_cert,
        cadet_unique_id: candidate.cadet_unique_id,
        email_id: candidate.email_id,
        department: candidate.department,
        current_rank: candidate.current_rank,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create Joining Plan",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`${candidate.refreshJoiningPlan ? "Update" : "Create"} ${candidate.vesselRole} Joining Plan`}
      onClose={onClose}
      width="max-w-4xl"
    >
      <div className="space-y-5">
        <div className="grid gap-3 rounded-xl border border-[#3a5f9e]/20 bg-[#3a5f9e]/5 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Candidate</p>
            <p className="font-semibold">{candidate.name_as_in_indos_cert}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Vessel Name</p>
            <p className="font-semibold">
              {vessel.name ||
                (secondary
                  ? candidate.secondary_vessel_name
                  : candidate.vessel_name)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Vessel Type</p>
            <p className="font-semibold">
              {vesselType || vessel.vessel_type || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">
              Total Seats (for reference)
            </p>
            <p className="font-semibold">{vessel.total_seats ?? "—"}</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Joining Date *">
            <input
              type="date"
              min={today}
              className={`${inputClass} w-full`}
              value={form.joining_date}
              onChange={(event) => setField("joining_date", event.target.value)}
            />
            {errors.joining_date && (
              <FieldError>{errors.joining_date}</FieldError>
            )}
          </Field>
          <Field label="Location">
            <input
              className={`${inputClass} w-full`}
              value={form.location}
              onChange={(event) => setField("location", event.target.value)}
              placeholder="Current vessel location"
            />
          </Field>
          <Field label="Voyage Reference">
            <input
              className={`${inputClass} w-full`}
              value={form.voyage_ref}
              onChange={(event) => setField("voyage_ref", event.target.value)}
              placeholder="Voyage reference"
            />
          </Field>
          <Field label="Reporting Port *">
            <input
              className={`${inputClass} w-full`}
              value={form.reporting_port}
              onChange={(event) =>
                setField("reporting_port", event.target.value)
              }
              placeholder="Candidate reporting port"
            />
            {errors.reporting_port && (
              <FieldError>{errors.reporting_port}</FieldError>
            )}
          </Field>
          <Field label="Contact Person *">
            <input
              className={`${inputClass} w-full`}
              value={form.contact_person_name}
              onChange={(event) =>
                setField("contact_person_name", event.target.value)
              }
              placeholder="Contact person name"
            />
            {errors.contact_person_name && (
              <FieldError>{errors.contact_person_name}</FieldError>
            )}
          </Field>
          <Field label="Contact Phone">
            <input
              className={`${inputClass} w-full`}
              value={form.contact_person_phone}
              onChange={(event) =>
                setField("contact_person_phone", event.target.value)
              }
              placeholder="Phone / WhatsApp"
            />
          </Field>
          <Field label="Contact Email">
            <input
              type="email"
              className={`${inputClass} w-full`}
              value={form.contact_person_email}
              onChange={(event) =>
                setField("contact_person_email", event.target.value)
              }
              placeholder="Contact email"
            />
            {errors.contact_person_email && (
              <FieldError>{errors.contact_person_email}</FieldError>
            )}
          </Field>
          <Field label="Required Documents (optional)">
            <textarea
              className="min-h-20 w-full rounded-md border p-2 text-sm"
              value={form.required_documents}
              onChange={(event) =>
                setField("required_documents", event.target.value)
              }
              placeholder="One document per line"
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={create}>
            <Mail size={16} className="mr-2" />
            {saving
              ? "Saving…"
              : `${candidate.refreshJoiningPlan ? "Update" : "Create"}${canCommunicate ? " & Record Communication" : " Plan"}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default JoiningPlanModal;
