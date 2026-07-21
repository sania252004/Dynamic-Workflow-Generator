// WorkflowForm.jsx
// A simple form: a big textarea + a button that asks the parent (App)
// to generate a workflow from whatever text the user typed.

export default function WorkflowForm({ prompt, setPrompt, onGenerate, loading }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <label htmlFor="workflow-prompt" className="block text-sm font-medium text-slate-700 mb-2">
        Describe the process
      </label>

      <textarea
        id="workflow-prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your business workflow..."
        rows={6}
        className="w-full rounded-xl border border-slate-300 p-4 text-slate-800 placeholder-slate-400
                   focus:outline-none focus:ring-2 focus:ring-flow-500 focus:border-transparent resize-y"
      />

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Tip: mention who approves, notifies, or decides at each step for a richer workflow.
        </p>

        <button
          onClick={onGenerate}
          disabled={loading}
          className="flex items-center gap-2 bg-flow-500 hover:bg-flow-600 disabled:bg-slate-300
                     disabled:cursor-not-allowed text-white font-medium px-5 py-2.5 rounded-xl
                     transition-colors"
        >
          {loading && (
            // Small spinning circle shown only while loading
            <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          {loading ? "Generating..." : "Generate Workflow"}
        </button>
      </div>
    </div>
  );
}
