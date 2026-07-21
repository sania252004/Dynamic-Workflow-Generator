// App.jsx
// The main page. Holds all the state and passes it down to the smaller components.

import { useState } from "react";
import axios from "axios";
import WorkflowForm from "./components/WorkflowForm.jsx";
import WorkflowList from "./components/WorkflowList.jsx";

// Base URL of our Express backend
const API_URL = "http://localhost:5000";

export default function App() {
  const [prompt, setPrompt] = useState(""); // text typed by the user
  const [workflow, setWorkflow] = useState([]); // list of workflow step objects
  const [loading, setLoading] = useState(false); // true while waiting for the AI
  const [error, setError] = useState(""); // friendly error message, empty = no error

  // Called when the user clicks "Generate Workflow"
  async function handleGenerate() {
    if (prompt.trim().length === 0) {
      setError("Please describe a workflow before generating.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_URL}/generate-workflow`, { prompt });
      setWorkflow(response.data.workflow || []);
    } catch (err) {
      // err.response.data.error is the friendly message our backend sends
      const message = err.response?.data?.error || "Failed to generate workflow. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Called by WorkflowCard when a step is saved after editing
  function handleEditStep(id, updatedStep) {
    setWorkflow((prev) => prev.map((step) => (step.id === id ? updatedStep : step)));
  }

  // Called by WorkflowCard when the delete button is clicked
  function handleDeleteStep(id) {
    setWorkflow((prev) => prev.filter((step) => step.id !== id));
  }

  // Called by WorkflowList when a new step is added at the bottom
  function handleAddStep(newStepData) {
    setWorkflow((prev) => {
      // Figure out the next id and sequence number based on the current list
      const nextId = prev.length > 0 ? Math.max(...prev.map((s) => s.id)) + 1 : 1;
      const nextSequence = prev.length + 1;

      const newStep = {
        id: nextId,
        sequence: nextSequence,
        ...newStepData,
      };

      return [...prev, newStep];
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <h1 className="text-xl font-semibold text-ink-900">Dynamic Workflow Generator</h1>
          <p className="text-sm text-slate-500 mt-1">
            Describe a process in plain English. Get back a visual, editable workflow.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <WorkflowForm
          prompt={prompt}
          setPrompt={setPrompt}
          onGenerate={handleGenerate}
          loading={loading}
        />

        {/* Friendly error banner, only shown when there is an error */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <WorkflowList
          workflow={workflow}
          onEdit={handleEditStep}
          onDelete={handleDeleteStep}
          onAdd={handleAddStep}
        />
      </main>
    </div>
  );
}
