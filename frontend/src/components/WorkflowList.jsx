import WorkflowCard from "./WorkflowCard";

export default function WorkflowList({ steps, onEdit, onDelete, onCompleteStep }) {
  const arePrerequisitesMet = (step) => {
    if (!step.dependsOn || step.dependsOn.toLowerCase() === "none") return true;

    const dependencies = step.dependsOn.split(",").map((d) => d.trim().toLowerCase());

    return dependencies.every((depTitle) => {
      const parentStep = steps.find(
        (s) => s.title.toLowerCase().trim() === depTitle
      );
      return parentStep ? parentStep.status === "COMPLETED" : true;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800">Pipeline Execution Steps ({steps.length})</h2>
      </div>

      {steps.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl text-center text-slate-500 border border-slate-200 text-xs">
          No workflow generated yet. Enter a prompt above or click "+ Add Custom Step" to create steps manually!
        </div>
      ) : (
        steps.map((step, idx) => {
          const isLocked = !arePrerequisitesMet(step);
          return (
            <WorkflowCard
              key={step.id || idx}
              step={{ ...step, sequence: idx + 1 }}
              isLocked={isLocked}
              onEdit={onEdit}
              onDelete={onDelete}
              onCompleteStep={onCompleteStep}
            />
          );
        })
      )}
    </div>
  );
}