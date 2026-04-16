import React, { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

const buildInitialEntries = (cadets, fields) =>
  cadets.map((cadet) => {
    const entry = { cadet_id: cadet.id };
    fields.forEach((field) => {
      entry[field.key] = field.defaultValue ?? "";
    });
    return entry;
  });

const StageInviteModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  cadets = [],
  fields = [],
  loading = false,
}) => {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setEntries(buildInitialEntries(cadets, fields));
    }
  }, [isOpen, cadets, fields]);

  const cadetMap = useMemo(
    () => new Map(cadets.map((cadet) => [cadet.id, cadet])),
    [cadets],
  );

  if (!isOpen) return null;

  const updateEntry = (cadetId, key, value) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.cadet_id === cadetId ? { ...entry, [key]: value } : entry,
      ),
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const missingField = entries.some((entry) =>
      fields.some(
        (field) =>
          field.required &&
          (entry[field.key] === "" || entry[field.key] === null || entry[field.key] === undefined),
      ),
    );

    if (missingField) {
      return;
    }

    await onSubmit(entries);
  };

  const renderField = (cadetId, field, value) => {
    if (field.type === "textarea") {
      return (
        <textarea
          value={value}
          onChange={(event) =>
            updateEntry(cadetId, field.key, event.target.value)
          }
          rows={3}
          placeholder={field.placeholder}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      );
    }

    if (field.type === "select") {
      return (
        <select
          value={value}
          onChange={(event) =>
            updateEntry(cadetId, field.key, event.target.value)
          }
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">{field.placeholder || "Select option"}</option>
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <Input
        type={field.type || "text"}
        value={value}
        onChange={(event) => updateEntry(cadetId, field.key, event.target.value)}
        placeholder={field.placeholder}
      />
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-4 overflow-y-auto px-6 py-5">
            {entries.map((entry) => {
              const cadet = cadetMap.get(entry.cadet_id);

              return (
                <div
                  key={entry.cadet_id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">
                      {cadet?.cadet_unique_id || "Cadet"}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {cadet?.name_as_in_indos_cert || "Unknown Cadet"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {cadet?.email_id || "No email available"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {fields.map((field) => (
                      <div
                        key={`${entry.cadet_id}-${field.key}`}
                        className={field.type === "textarea" ? "md:col-span-2" : ""}
                      >
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          {field.label}
                          {field.required ? (
                            <span className="ml-1 text-red-500">*</span>
                          ) : null}
                        </label>
                        {renderField(entry.cadet_id, field, entry[field.key])}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {entries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                Select at least one cadet to send an invite.
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || entries.length === 0}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invites"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StageInviteModal;
