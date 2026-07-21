// WorkflowCard.jsx
// Renders one workflow step as a card.
// Can be shown in two modes: "view" mode (read-only) and "edit" mode (inputs).

import { useState } from "react";

// Each step type gets its own color so the workflow is easy to scan visually.
const TYPE_STYLES = {
  Input: "bg-sky-100 text-sky-700 border-sky-200",
  Approval: "bg-amber-100 text-amber-700 border-amber-200",
  Notification: "bg-violet-100 text-violet-700 border-violet-200",
  Decision: "bg-rose-100 text-rose-700 border-rose-200",
  Action: "bg-flow-100 text-flow-700 border-flow-100",
  End: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const STEP_TYPES = ["Input", "Approval", "Notification", "Decision", "Action", "End"];

export default function WorkflowCard({ step, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);

  // Local draft state used only while the card is in edit mode.
  // We keep dependencies as a comma-separated string in the input,
  // then split it back into an array when saving.
  const [draftName, setDraftName] = useState(step.stepName);
  const [draftType, setDraftType] = useState(step.stepType);
  const [draftDeps, setDraftDeps] = useState(step.dependencies.join(", "));

  const typeStyle = TYPE_STYLES[step.stepType] || "bg-slate-100 text-slate-700 border-slate-200";

  function handleSave() {
    const cleanedDeps = draftDeps
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    onEdit(step.id, {
      ...step,
      stepName: draftName,
      stepType: draftType,
      dependencies: cleanedDeps,
    });

    setIsEditing(false);
  }

  function handleCancel() {
    // Reset drafts back to the original step values and exit edit mode
    setDraftName(step.stepName);
    setDraftType(step.stepType);
    setDraftDeps(step.dependencies.join(", "));
    setIsEditing(false);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 w-full max-w-xl">
      {isEditing ? (
        // ---- EDIT MODE ----
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500">Step Name</label>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-flow-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Step Type</label>
            <select
              value={draftType}
              onChange={(e) => setDraftType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-flow-500"
            >
              {STEP_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">
              Dependencies (comma separated step names)
            </label>
            <input
              value={draftDeps}
              onChange={(e) => setDraftDeps(e.target.value)}
              placeholder="e.g. Collect Documents, Manager Approval"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-flow-500"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              className="text-sm font-medium bg-flow-500 hover:bg-flow-600 text-white px-4 py-2 rounded-lg"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // ---- VIEW MODE ----
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            {/* Sequence number shown as a data-style chip */}
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-ink-900 text-white
                            flex items-center justify-center font-mono text-sm">
              {step.sequence}
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">{step.stepName}</h3>

              <span
                className={`inline-block mt-1 text-xs font-medium px-2.5 py-1 rounded-full border ${typeStyle}`}
              >
                {step.stepType}
              </span>

              <p className="mt-2 text-xs text-slate-500">
                Depends on:{" "}
                {step.dependencies.length > 0 ? (
                  <span className="font-mono text-slate-600">{step.dependencies.join(", ")}</span>
                ) : (
                  <span className="italic">none</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-medium text-flow-600 hover:text-flow-700"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(step.id)}
              className="text-xs font-medium text-rose-500 hover:text-rose-600"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
