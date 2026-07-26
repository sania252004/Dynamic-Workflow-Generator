import { useState } from "react";
import axios from "axios";
import WorkflowList from "./components/WorkflowList";

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);

  // Modal State for Adding Steps
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepType, setNewStepType] = useState("Action");
  const [newStepDependsOn, setNewStepDependsOn] = useState("none");

  const [steps, setSteps] = useState([]);

  const areDependenciesMet = (step, currentSteps) => {
    if (!step.dependsOn || step.dependsOn.toLowerCase() === "none") return true;

    const deps = step.dependsOn.split(",").map((d) => d.trim().toLowerCase());
    return deps.every((depTitle) => {
      const parent = currentSteps.find(
        (s) => s.title.toLowerCase().trim() === depTitle,
      );
      return parent ? parent.status === "COMPLETED" : true;
    });
  };

  const handleGenerateWorkflow = async (e, customPrompt) => {
    if (e) e.preventDefault();
    const activePrompt = customPrompt || prompt;
    if (!activePrompt.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/generate-workflow", {
        prompt: activePrompt,
      });
      const rawWorkflow = res.data.workflow || [];

      const formatted = rawWorkflow.map((step, idx) => ({
        ...step,
        sequence: idx + 1,
        stepNumber: idx + 1,
        step_number: idx + 1,
        status: idx === 0 ? "IN_PROGRESS" : "PENDING",
        executionData: { files: [], inputs: {} },
      }));

      setSteps(formatted);
      setHasStarted(true);
    } catch (err) {
      console.error("Error generating workflow:", err);
    } finally {
      setLoading(false);
    }
  };

  // Add Dynamic Step Manually with automatic "End" step reordering and badge fixing
  const handleAddCustomStep = (e) => {
    e.preventDefault();
    if (!newStepTitle.trim()) return;

    const newStep = {
      id: Date.now(),
      sequence: steps.length + 1,
      stepNumber: steps.length + 1,
      step_number: steps.length + 1,
      title: newStepTitle,
      type: newStepType,
      dependsOn: newStepDependsOn || "none",
      status: "PENDING",
      executionData: { files: [], inputs: {} },
    };

    setSteps((prevSteps) => {
      const combined = [...prevSteps, newStep];

      // Helper to compute dependency depth
      const getDepth = (step, allSteps, visited = new Set()) => {
        if (!step.dependsOn || step.dependsOn.toLowerCase() === "none")
          return 0;
        if (visited.has(step.id)) return 0; // Prevent cycle loops
        visited.add(step.id);

        const depTitles = step.dependsOn
          .split(",")
          .map((d) => d.trim().toLowerCase());

        let maxParentDepth = 0;
        allSteps.forEach((candidate) => {
          if (depTitles.includes(candidate.title.toLowerCase().trim())) {
            const parentDepth = getDepth(candidate, allSteps, new Set(visited));
            if (parentDepth + 1 > maxParentDepth) {
              maxParentDepth = parentDepth + 1;
            }
          }
        });

        return maxParentDepth;
      };

      // Sort by depth: steps with fewer prerequisites come first, 'End' type always last
      const sortedSteps = [...combined].sort((a, b) => {
        if (a.type === "End") return 1;
        if (b.type === "End") return -1;

        const depthA = getDepth(a, combined);
        const depthB = getDepth(b, combined);
        if (depthA !== depthB) return depthA - depthB;

        const depsCountA =
          a.dependsOn && a.dependsOn.toLowerCase() !== "none"
            ? a.dependsOn.split(",").length
            : 0;
        const depsCountB =
          b.dependsOn && b.dependsOn.toLowerCase() !== "none"
            ? b.dependsOn.split(",").length
            : 0;

        return depsCountA - depsCountB;
      });

      // Re-index all step number properties
      const reindexedSteps = sortedSteps.map((s, idx) => ({
        ...s,
        sequence: idx + 1,
        stepNumber: idx + 1,
        step_number: idx + 1,
      }));

      // Evaluate status based on dependencies
      return reindexedSteps.map((s) => {
        if (s.status === "COMPLETED") return s;

        const depsMet = areDependenciesMet(s, reindexedSteps);
        return {
          ...s,
          status: depsMet ? "IN_PROGRESS" : "PENDING",
        };
      });
    });

    setNewStepTitle("");
    setNewStepType("Action");
    setNewStepDependsOn("none");
    setShowAddStepModal(false);
  };
  const handleCompleteStep = (stepId, updatedExecutionData) => {
    setSteps((prevSteps) => {
      const updated = prevSteps.map((s) => {
        if (s.id === stepId) {
          return {
            ...s,
            status: "COMPLETED",
            executionData: updatedExecutionData,
          };
        }
        return s;
      });

      const nextSteps = updated.map((s) => {
        if (s.status === "PENDING" && areDependenciesMet(s, updated)) {
          return { ...s, status: "IN_PROGRESS" };
        }
        return s;
      });

      const allCompleted =
        nextSteps.length > 0 &&
        nextSteps.every((s) => s.status === "COMPLETED");
      if (allCompleted) {
        setGeneratedCredentials({
          email: "employee.onboarded@company.com",
          tempPassword: "TempPass@" + Math.floor(1000 + Math.random() * 9000),
        });
        setShowCongratsModal(true);
      }

      return nextSteps;
    });
  };

  const handleEditStep = (stepId, updatedStep) => {
    setSteps((prev) => prev.map((s) => (s.id === stepId ? updatedStep : s)));
  };

  const handleDeleteStep = (stepId) => {
    setSteps((prev) => {
      const filtered = prev.filter((s) => s.id !== stepId);
      // Re-index remaining sequence numbers across all props
      return filtered.map((s, idx) => ({
        ...s,
        sequence: idx + 1,
        stepNumber: idx + 1,
        step_number: idx + 1,
      }));
    });
  };

  // 1. Landing View
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-2xl space-y-6 w-full">
          <div className="inline-block px-4 py-1.5 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-semibold tracking-wide uppercase">
            Enterprise Workflow Engine
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Design & Execute Custom Workflows
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Enter your prompt below to generate a tailored step-by-step pipeline
            complete with prerequisite locks, document verification, and HR
            sign-offs.
          </p>

          <form
            onSubmit={handleGenerateWorkflow}
            className="pt-2 flex flex-col md:flex-row gap-3"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Collect documents, allocate laptop, schedule induction, complete mandatory training..."
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-500"
            />

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-semibold text-sm rounded-xl shadow-lg transition"
            >
              {loading ? "Generating..." : "Generate Workflow"}
            </button>
          </form>

          {/* Quick Sample Prompts */}
          <div className="pt-4 text-left">
            <p className="text-xs text-slate-500 font-medium mb-2">
              Or select a sample prompt:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const sample =
                    "Collect Documents, Allocate Laptop, Schedule Induction, Complete Mandatory Training, Onboarding Complete";
                  setPrompt(sample);
                  handleGenerateWorkflow(null, sample);
                }}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
              >
                + Standard Employee Onboarding
              </button>
              <button
                type="button"
                onClick={() => {
                  const sample =
                    "Vendor NDA Upload, Security Audit, Account Provisioning, Final Procurement Approval";
                  setPrompt(sample);
                  handleGenerateWorkflow(null, sample);
                }}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
              >
                + Vendor Compliance Flow
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Execution View
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Workflow Execution Portal
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Active Prompt:{" "}
              <span className="italic font-medium text-slate-700">
                "{prompt}"
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddStepModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-sm transition"
            >
              + Add Custom Step
            </button>
            <button
              onClick={() => {
                setHasStarted(false);
                setSteps([]);
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 underline ml-2"
            >
              ← Start Over
            </button>
          </div>
        </header>

        <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
          <form onSubmit={handleGenerateWorkflow} className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Refine or change your workflow prompt..."
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white font-medium text-xs rounded-xl hover:bg-indigo-700 transition disabled:bg-slate-400"
            >
              {loading ? "Re-generating..." : "Re-generate"}
            </button>
          </form>
        </section>

        <main>
          <WorkflowList
            steps={steps}
            onEdit={handleEditStep}
            onDelete={handleDeleteStep}
            onCompleteStep={handleCompleteStep}
          />
        </main>
      </div>

      {/* Add Custom Step Modal */}
      {showAddStepModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Add Custom Step to Workflow
              </h3>
              <button
                onClick={() => setShowAddStepModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Step Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Conduct IT Security Briefing"
                  value={newStepTitle}
                  onChange={(e) => setNewStepTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Step Type
                  </label>
                  <select
                    value={newStepType}
                    onChange={(e) => setNewStepType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-800"
                  >
                    <option value="Input">Input / Upload</option>
                    <option value="Action">Action / Task</option>
                    <option value="Approval">HR / Admin Approval</option>
                    <option value="Notification">Notification</option>
                    <option value="Decision">Decision Gate</option>
                    <option value="End">End Sign-off</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Prerequisite Dependency
                  </label>
                  <select
                    value={newStepDependsOn}
                    onChange={(e) => setNewStepDependsOn(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
                  >
                    <option value="none">None (Independent)</option>
                    {steps.map((s) => (
                      <option key={s.id} value={s.title}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t">
              <button
                type="button"
                onClick={() => setShowAddStepModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomStep}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm"
              >
                Insert Step
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Congratulations Modal */}
      {showCongratsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto font-bold">
              🎉
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Workflow Completed!
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                All steps and compliance requirements have been completed
                successfully.
              </p>
            </div>

            {generatedCredentials && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-3">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Official Credentials Provisioned
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block font-medium">
                    Official Email:
                  </label>
                  <div className="text-xs font-mono text-indigo-600 font-bold">
                    {generatedCredentials.email}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block font-medium">
                    Temporary Password:
                  </label>
                  <div className="text-xs font-mono text-slate-800 font-bold">
                    {generatedCredentials.tempPassword}
                  </div>
                </div>
                <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 font-medium">
                  🔒 Notice: You can update this temporary password after
                  logging into the official portal.
                </p>
              </div>
            )}

            <button
              onClick={() => setShowCongratsModal(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition"
            >
              Close Portal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
