// WorkflowList.jsx
// Renders every workflow step as a vertical stack of cards connected by arrows.
// Also has a small form at the bottom for adding a brand new step.

import { useState } from "react";
import WorkflowCard from "./WorkflowCard.jsx";

const STEP_TYPES = ["Input", "Approval", "Notification", "Decision", "Action", "End"];

export default function WorkflowList({ workflow, onEdit, onDelete, onAdd }) {
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Action");

  function handleAddClick() {
    if (newName.trim().length === 0) return; // ignore empty step names

    onAdd({
      stepName: newName.trim(),
      stepType: newType,
      dependencies: [],
    });

    setNewName(""); // clear the input after adding
  }

  // Show a friendly empty state when there is no workflow yet
  if (workflow.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-lg font-medium">No workflow generated</p>
        <p className="text-sm mt-1">Describe a process above and click "Generate Workflow".</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {workflow.map((step, index) => (
        <div key={step.id} className="flex flex-col items-center w-full">
          <WorkflowCard step={step} onEdit={onEdit} onDelete={onDelete} />

          {/* Draw a connecting arrow between this card and the next one */}
          {index < workflow.length - 1 && (
            <div className="text-slate-300 my-1" aria-hidden="true">
              <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
                <path d="M10 0V22" stroke="currentColor" strokeWidth="2" />
                <path d="M3 16L10 24L17 16" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          )}
        </div>
      ))}

      {/* Small inline form to add a new step at the end of the workflow */}
      <div className="mt-6 w-full max-w-xl bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4">
        <p className="text-xs font-medium text-slate-500 mb-2">Add a new step</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Step name"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-flow-500"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-flow-500"
          >
            {STEP_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddClick}
            className="text-sm font-medium bg-ink-900 hover:bg-ink-950 text-white px-4 py-2 rounded-lg"
          >
            Add Step
          </button>
        </div>
      </div>
    </div>
  );
}
