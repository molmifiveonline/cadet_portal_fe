import React, { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import CcRecipientsEditor from "../../components/common/CcRecipientsEditor";

const buildInitialBlock = (subFields) => {
  const block = {};
  subFields.forEach((f) => {
    block[f.key] = f.defaultValue ?? (f.type === "multiselect" ? [] : "");
  });
  return block;
};

const buildInitialEntries = (cadets, fields) =>
  cadets.map((cadet) => {
    const entry = { cadet_id: cadet.id };
    fields.filter(f => !f.global).forEach((field) => {
      if (field.type === "repeater") {
        entry[field.key] = [buildInitialBlock(field.subFields)];
      } else {
        entry[field.key] = field.defaultValue ?? (field.type === "multiselect" ? [] : "");
      }
    });
    return entry;
  });

const buildInitialGlobalValues = (fields) => {
  const globalValues = {};
  fields.filter(f => f.global).forEach(field => {
    globalValues[field.key] = field.defaultValue ?? (field.type === 'file' ? null : (field.type === 'multiselect' ? [] : ""));
  });
  return globalValues;
};

export const MultiSelectDropdown = ({ options, value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const selectedValues = Array.isArray(value) ? value : [];
  
  return (
    <div className="relative">
      <div 
        onClick={() => setOpen(!open)}
        className="flex min-h-[38px] w-full cursor-pointer flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {selectedValues.length === 0 ? (
          <span className="text-slate-500">{placeholder || "Select..."}</span>
        ) : (
          <span className="truncate">{selectedValues.length} selected</span>
        )}
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} />
          <div className="absolute z-[60] mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
            <div
              className="flex cursor-pointer items-center px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => {
                 if (selectedValues.length === options.length && options.length > 0) {
                   onChange([]);
                 } else {
                   onChange(options.map(o => o.value));
                 }
              }}
            >
              <input type="checkbox" checked={selectedValues.length === options.length && options.length > 0} readOnly className="mr-2" />
              <span className="font-medium">Select All</span>
            </div>
            {options.map(option => (
              <div
                key={option.value}
                className="flex cursor-pointer items-center px-3 py-2 text-sm hover:bg-slate-50"
                onClick={() => {
                  if (selectedValues.includes(option.value)) {
                    onChange(selectedValues.filter(v => v !== option.value));
                  } else {
                    onChange([...selectedValues, option.value]);
                  }
                }}
              >
                <input type="checkbox" checked={selectedValues.includes(option.value)} readOnly className="mr-2" />
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

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
  const [globalValues, setGlobalValues] = useState({});
  const [includeCc, setIncludeCc] = useState(false);
  const [ccRecipients, setCcRecipients] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setEntries(buildInitialEntries(cadets, fields));
      setGlobalValues(buildInitialGlobalValues(fields));
      setIncludeCc(false);
      setCcRecipients([]);
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

  const updateGlobalValue = (key, value) => {
    setGlobalValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const missingField = entries.some((entry) =>
      fields.filter(f => !f.global).some(
        (field) => {
          if (field.type === "repeater") {
            return entry[field.key].some((block) =>
              field.subFields.some(
                (sub) =>
                  sub.required &&
                  (block[sub.key] === "" ||
                    block[sub.key] === null ||
                    block[sub.key] === undefined ||
                    (Array.isArray(block[sub.key]) && block[sub.key].length === 0)),
              ),
            );
          }
          return (
            field.required &&
            (entry[field.key] === "" ||
              entry[field.key] === null ||
              entry[field.key] === undefined ||
              (Array.isArray(entry[field.key]) && entry[field.key].length === 0))
          );
        }
      ),
    );

    const missingGlobal = fields.filter(f => f.global).some(
      field => field.required && (globalValues[field.key] === "" || globalValues[field.key] === null)
    );

    if (missingField || missingGlobal) {
      return;
    }

    // Prepare data for submission
    const formData = new FormData();
    
    // Add cadet-specific data as JSON
    const submissions = entries.map(entry => ({
      ...entry,
      ...Object.fromEntries(
        Object.entries(globalValues).filter(([_, v]) => typeof v !== 'object' || v === null)
      )
    }));
    
    formData.append('cadets', JSON.stringify(submissions));
    const cc = includeCc
      ? ccRecipients.map((recipient) => ({
          email: recipient.email.trim(),
        }))
      : [];
    if (cc.length > 0) formData.append('cc', JSON.stringify(cc));

    // Add global files
    Object.entries(globalValues).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      }
    });

    await onSubmit(formData, submissions, { cc: cc.length > 0 ? cc : undefined });
  };

  const renderField = (field, value, onChange, entryBlock = {}) => {
    if (field.type === "textarea") {
      return (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          placeholder={field.placeholder}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      );
    }

    if (field.type === "select") {
      const options = field.getOptions ? field.getOptions(entryBlock) : (field.options || []);
      return (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">{field.placeholder || "Select option"}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "file") {
      return (
        <Input
          type="file"
          onChange={(event) => onChange(event.target.files[0])}
          className="cursor-pointer"
        />
      );
    }

    if (field.type === "multiselect") {
      const options = field.getOptions ? field.getOptions(entryBlock) : (field.options || []);
      return (
        <MultiSelectDropdown
          options={options}
          value={value}
          onChange={onChange}
          placeholder={field.placeholder}
        />
      );
    }

    if (field.type === "repeater") {
      const blocks = value || [];
      return (
        <div className="col-span-full space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          {blocks.map((block, index) => (
            <div key={index} className="relative rounded-md border border-slate-100 bg-slate-50 p-3 pt-6">
              {blocks.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const newBlocks = [...blocks];
                    newBlocks.splice(index, 1);
                    onChange(newBlocks);
                  }}
                  className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {field.subFields.map((subField) => (
                  <div key={subField.key} className={subField.type === "textarea" ? "md:col-span-2" : ""}>
                    <label className="mb-2 block text-xs font-medium text-slate-700">
                      {subField.label}
                      {subField.required ? <span className="ml-1 text-red-500">*</span> : null}
                    </label>
                    {renderField(
                      subField,
                      block[subField.key],
                      (val) => {
                        const newBlocks = [...blocks];
                        newBlocks[index] = { ...newBlocks[index], [subField.key]: val };
                        onChange(newBlocks);
                      },
                      block
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onChange([...blocks, buildInitialBlock(field.subFields)]);
            }}
            className="w-full border-dashed"
          >
            + Add {field.addLabel || "More"}
          </Button>
        </div>
      );
    }

    return (
      <Input
        type={field.type || "text"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
      />
    );
  };

  const globalFields = fields.filter(f => f.global);
  const perCadetFields = fields.filter(f => !f.global);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
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
          <div className="space-y-6 overflow-y-auto px-6 py-5">
            <CcRecipientsEditor
              enabled={includeCc}
              onEnabledChange={setIncludeCc}
              recipients={ccRecipients}
              onChange={setCcRecipients}
              disabled={loading}
            />

            {globalFields.length > 0 && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-5 shadow-sm">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-blue-600">Global Settings (Applies to all selected)</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {globalFields.map((field) => (
                    <div key={`global-${field.key}`} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        {field.label}
                        {field.required ? <span className="ml-1 text-red-500">*</span> : null}
                      </label>
                      {renderField(field, globalValues[field.key], (val) => updateGlobalValue(field.key, val))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Individual Details</h3>
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
                      {perCadetFields.map((field) => (
                        <div
                          key={`${entry.cadet_id}-${field.key}`}
                          className={field.type === "textarea" || field.type === "repeater" ? "md:col-span-2" : ""}
                        >
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            {field.label}
                            {field.required ? (
                              <span className="ml-1 text-red-500">*</span>
                            ) : null}
                          </label>
                          {renderField(field, entry[field.key], (val) => updateEntry(entry.cadet_id, field.key, val), entry)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

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
