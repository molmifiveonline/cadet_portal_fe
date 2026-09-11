import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const emptyRecipient = () => ({ email: "" });

const CcRecipientsEditor = ({ enabled, onEnabledChange, recipients, onChange, disabled = false }) => {
  const setEnabled = (checked) => {
    onEnabledChange(checked);
    if (checked && recipients.length === 0) onChange([emptyRecipient()]);
  };

  const updateRecipient = (index, field, value) => {
    onChange(
      recipients.map((recipient, recipientIndex) =>
        recipientIndex === index ? { ...recipient, [field]: value } : recipient,
      ),
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          disabled={disabled}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
        />
        <span>
          <span className="block text-sm font-semibold text-slate-800">Add CC recipients</span>
          <span className="mt-0.5 block text-xs text-slate-500">
            Send a copy to additional people for this email only.
          </span>
        </span>
      </label>

      {enabled ? (
        <div className="mt-4 max-h-[40vh] space-y-3 overflow-y-auto border-t border-slate-200 pt-4 pr-1">
          {recipients.map((recipient, index) => (
            <div key={index} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_auto]">
              <Input
                type="email"
                required
                value={recipient.email}
                onChange={(event) => updateRecipient(index, "email", event.target.value)}
                placeholder={`CC email address ${index + 1}`}
                aria-label={`CC email address ${index + 1}`}
                disabled={disabled}
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => onChange(recipients.filter((_, recipientIndex) => recipientIndex !== index))}
                disabled={disabled || recipients.length === 1}
                className="text-red-500 hover:bg-red-50 hover:text-red-600"
                title="Remove CC recipient"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => onChange([...recipients, emptyRecipient()])}
            disabled={disabled}
            className="gap-2 border-dashed"
          >
            <Plus className="h-4 w-4" />
            Add another CC email
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default CcRecipientsEditor;
