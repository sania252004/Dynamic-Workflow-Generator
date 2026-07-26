import { useState, useEffect } from "react";
import axios from "axios";

export default function WorkflowCard({
  step,
  allSteps = [],
  isLocked = false,
  onEdit,
  onDelete,
  onCompleteStep,
}) {
  const {
    id,
    sequence = 1,
    title = "",
    type = "Action",
    dependsOn = "none",
    status = "PENDING",
    executionData = { files: [], inputs: {} },
  } = step || {};

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editType, setEditType] = useState(type);
  const [editDependsOn, setEditDependsOn] = useState(dependsOn);

  const [localData, setLocalData] = useState(executionData);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [hrVerified, setHrVerified] = useState(localData?.inputs?.hrVerified || false);
  const [hrOfficerName, setHrOfficerName] = useState(localData?.inputs?.hrOfficerName || "");
  const [showHrModal, setShowHrModal] = useState(false);

  useEffect(() => {
    setLocalData(executionData);
    setHrVerified(executionData?.inputs?.hrVerified || false);
    setHrOfficerName(executionData?.inputs?.hrOfficerName || "");
    setEditTitle(title);
    setEditType(type);
    setEditDependsOn(dependsOn);
  }, [step]);

  const titleLower = (title || "").toLowerCase();

  const isTrainingStep =
    titleLower.includes("training") || titleLower.includes("mandatory");

  const isDocStep =
    titleLower.includes("doc") ||
    titleLower.includes("upload") ||
    titleLower.includes("nda") ||
    titleLower.includes("receipt") ||
    type === "Input" ||
    isTrainingStep;

  const isLaptopStep =
    titleLower.includes("laptop") ||
    titleLower.includes("asset") ||
    titleLower.includes("hardware");

  const isScheduleStep =
    titleLower.includes("induction") ||
    titleLower.includes("schedule") ||
    titleLower.includes("meeting");

  const isCompleted = status === "COMPLETED";
  const isInProgress = status === "IN_PROGRESS";

  const typeBadgeColors = {
    Input: "bg-blue-100 text-blue-700 border-blue-200",
    Approval: "bg-purple-100 text-purple-700 border-purple-200",
    Notification: "bg-amber-100 text-amber-700 border-amber-200",
    Decision: "bg-cyan-100 text-cyan-700 border-cyan-200",
    Action: "bg-slate-100 text-slate-700 border-slate-200",
    End: "bg-rose-100 text-rose-700 border-rose-200",
  };

  async function handleFileUpload(e) {
    if (isLocked) return;
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setErrorMessage("Please select a valid PDF file.");
      return;
    }

    setErrorMessage("");
    const formData = new FormData();
    formData.append("pdf", file);

    setUploading(true);
    try {
      const res = await axios.post("http://localhost:5000/upload-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newFileObj = { name: res.data.fileName, url: res.data.fileUrl };

      setLocalData((prev) => ({
        ...prev,
        files: [...(prev?.files || []), newFileObj],
      }));
    } catch (err) {
      console.error("PDF upload failed:", err);
      setErrorMessage("Failed to upload PDF. Check server connection.");
    } finally {
      setUploading(false);
    }
  }

  function handleHrApprove() {
    if (!hrOfficerName.trim()) {
      setErrorMessage("⚠️ Sign-off Required: Enter Officer Name or ID Tag.");
      return;
    }

    setErrorMessage("");
    setHrVerified(true);
    setLocalData((prev) => ({
      ...prev,
      inputs: {
        ...(prev?.inputs || {}),
        hrVerified: true,
        hrOfficerName: hrOfficerName,
        hrVerifiedAt: new Date().toLocaleString(),
      },
    }));
    setShowHrModal(false);
  }

  function handleComplete() {
    setErrorMessage("");

    if (isLocked) {
      setErrorMessage(
        `⛔ Audit Failed: Prerequisites (${dependsOn}) must reach COMPLETED status first.`
      );
      return;
    }

    if (isDocStep && (!localData?.files || localData.files.length === 0)) {
      setErrorMessage(
        isTrainingStep
          ? "⚠️ Upload required: Please submit your Training Certificate PDF before proceeding."
          : "⚠️ Clarification required: Upload PDF document(s) before proceeding."
      );
      return;
    }

    if (isLaptopStep) {
      const { model, serial } = localData?.inputs || {};
      if (!model?.trim() || !serial?.trim()) {
        setErrorMessage("⚠️ Clarification required: Enter both Asset Model Name and Serial Tag.");
        return;
      }
    }

    if (isScheduleStep && !localData?.inputs?.date) {
      setErrorMessage("⚠️ Clarification required: Select a valid Date & Time slot.");
      return;
    }

    if (isTrainingStep) {
      if (!hrVerified) {
        setErrorMessage("⛔ Audit Lock: An authorized Admin/HR Manager must audit prerequisites and sign off.");
        return;
      }
      if (!localData?.inputs?.confirmed) {
        setErrorMessage("⚠️ Please check the confirmation checkbox after Admin approval.");
        return;
      }
    } else if (!isDocStep && !isLaptopStep && !isScheduleStep) {
      if (!localData?.inputs?.confirmed) {
        setErrorMessage("⚠️ Check the confirmation box to complete this step.");
        return;
      }
    }

    if (onCompleteStep) {
      onCompleteStep(id, localData);
    }
  }

  function handleSaveEdit() {
    if (onEdit) {
      onEdit(id, {
        ...step,
        title: editTitle,
        type: editType,
        dependsOn: editDependsOn,
      });
    }
    setIsEditing(false);
  }

  return (
    <div
      className={`p-5 rounded-2xl border transition shadow-sm ${
        isCompleted
          ? "bg-emerald-50/40 border-emerald-200"
          : isLocked
          ? "bg-slate-50 border-slate-200 opacity-60"
          : isInProgress
          ? "bg-white border-indigo-200 ring-1 ring-indigo-100"
          : "bg-slate-50/60 border-slate-200 opacity-75"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 w-full">
          {/* Main Sequence Circle Indicator */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
              isCompleted
                ? "bg-emerald-600 text-white"
                : isLocked
                ? "bg-slate-300 text-slate-500"
                : isInProgress
                ? "bg-indigo-600 text-white"
                : "bg-slate-300 text-slate-700"
            }`}
          >
            {isCompleted ? "✓" : isLocked ? "🔒" : sequence}
          </div>

          <div className="w-full">
            {isEditing ? (
              <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Step Name
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Step Type
                    </label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs outline-none bg-white"
                    >
                      <option value="Input">Input</option>
                      <option value="Approval">Approval</option>
                      <option value="Notification">Notification</option>
                      <option value="Decision">Decision</option>
                      <option value="Action">Action</option>
                      <option value="End">End</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Dependencies
                    </label>
                    <select
                      value={editDependsOn}
                      onChange={(e) => setEditDependsOn(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs outline-none bg-white"
                    >
                      <option value="none">none</option>
                      {allSteps
                        .filter((s) => s.id !== id)
                        .map((s) => (
                          <option key={s.id} value={s.title}>
                            {s.title}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
                  {title || "Untitled Step"}
                  {isTrainingStep && (
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold border border-purple-200">
                      Audit Sign-off Gate
                    </span>
                  )}
                </h3>

                {/* Cleaned Metadata Row (Removed Seq Badge) */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                      typeBadgeColors[type] || typeBadgeColors.Action
                    }`}
                  >
                    {type}
                  </span>

                  <span className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 font-medium">
                    Depends on: <span className="font-mono text-slate-700">{dependsOn || "none"}</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-slate-500 hover:text-indigo-600 font-medium"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete && onDelete(id)}
              className="text-xs text-rose-500 hover:text-rose-700 font-medium"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {!isLocked && !isEditing && (
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
          {/* Document Uploader */}
          {isDocStep && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                {isTrainingStep
                  ? "Upload Mandatory Training Completion Proof (PDF):"
                  : "Upload Verification Document (PDF format):"}
              </label>

              {/* Training Document Examples Panel */}
              {isTrainingStep && (
                <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 space-y-1">
                  <span className="font-bold block">Accepted Document Types:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-indigo-800">
                    <li>
                      <span className="font-medium">LMS Completion Certificate</span> (e.g., Cybersecurity, Data Privacy & GDPR)
                    </li>
                    <li>
                      <span className="font-medium">Compliance Exam Assessment Scorecard</span> showing passing grade
                    </li>
                    <li>
                      <span className="font-medium">Signed Code of Conduct / Ethics Acknowledgment PDF</span>
                    </li>
                  </ul>
                </div>
              )}

              {isInProgress && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileUpload}
                    disabled={uploading || isLocked}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {uploading && <span className="text-xs text-indigo-600 font-medium">Uploading...</span>}
                </div>
              )}

              {localData?.files?.length > 0 && (
                <div className="space-y-1 mt-2">
                  {localData.files.map((file, i) => (
                    <div
                      key={i}
                      className="text-xs text-slate-600 flex items-center justify-between font-mono bg-slate-50 p-2 rounded border border-slate-200"
                    >
                      <span>📄 {typeof file === "string" ? file : file.name}</span>
                      {file.url && (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline font-sans font-semibold text-[11px]"
                        >
                          View PDF
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isLaptopStep && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Asset Model Name <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  disabled={!isInProgress || isLocked}
                  placeholder="e.g. MacBook Pro / Dell XPS"
                  value={localData?.inputs?.model || ""}
                  onChange={(e) => {
                    setErrorMessage("");
                    setLocalData((prev) => ({
                      ...prev,
                      inputs: { ...(prev?.inputs || {}), model: e.target.value },
                    }));
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Asset Tag / Serial Number <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  disabled={!isInProgress || isLocked}
                  placeholder="e.g. SN-883921"
                  value={localData?.inputs?.serial || ""}
                  onChange={(e) => {
                    setErrorMessage("");
                    setLocalData((prev) => ({
                      ...prev,
                      inputs: { ...(prev?.inputs || {}), serial: e.target.value },
                    }));
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-slate-100"
                />
              </div>
            </div>
          )}

          {isScheduleStep && (
            <div className="text-xs space-y-1">
              <label className="block text-slate-600 font-medium">Select Date & Time:</label>
              <input
                type="datetime-local"
                disabled={!isInProgress || isLocked}
                onChange={(e) => {
                  setErrorMessage("");
                  setLocalData((prev) => ({
                    ...prev,
                    inputs: { ...(prev?.inputs || {}), date: e.target.value },
                  }));
                }}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-slate-100"
              />
            </div>
          )}

          {/* Audit Gate Section */}
          {isTrainingStep && (
            <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-purple-900">Governance Audit Gate</h4>
                  <p className="text-[11px] text-purple-700">
                    Admin sign-off required after auditing candidate's training documents.
                  </p>
                </div>

                {!hrVerified ? (
                  <button
                    type="button"
                    onClick={() => setShowHrModal(true)}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-medium rounded-lg text-xs shadow-sm"
                  >
                    Review & Audit →
                  </button>
                ) : (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-lg text-[11px] flex items-center gap-1">
                    ✓ Verified by {localData?.inputs?.hrOfficerName || "Admin"}
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-purple-200/60">
                <label
                  className={`flex items-center gap-2 font-medium ${
                    !hrVerified || isLocked
                      ? "cursor-not-allowed text-slate-400"
                      : "cursor-pointer text-slate-800"
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={!hrVerified || isLocked || !isInProgress}
                    checked={localData?.inputs?.confirmed || isCompleted}
                    onChange={(e) => {
                      if (!hrVerified || isLocked) return;
                      setErrorMessage("");
                      setLocalData((prev) => ({
                        ...prev,
                        inputs: { ...(prev?.inputs || {}), confirmed: e.target.checked },
                      }));
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <span>I confirm completion of mandatory training requirements</span>
                </label>
              </div>
            </div>
          )}

          {!isDocStep && !isLaptopStep && !isScheduleStep && !isTrainingStep && (
            <div className="text-xs">
              <label
                className={`flex items-center gap-2 font-medium ${
                  isLocked ? "cursor-not-allowed text-slate-400" : "cursor-pointer text-slate-700"
                }`}
              >
                <input
                  type="checkbox"
                  disabled={isLocked || !isInProgress}
                  checked={localData?.inputs?.confirmed || isCompleted}
                  onChange={(e) => {
                    if (isLocked) return;
                    setErrorMessage("");
                    setLocalData((prev) => ({
                      ...prev,
                      inputs: { ...(prev?.inputs || {}), confirmed: e.target.checked },
                    }));
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
                <span>Confirm task requirement completed</span>
              </label>
            </div>
          )}
        </div>
      )}

      {isLocked && !isCompleted && (
        <div className="mt-3 p-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg font-medium flex items-center gap-2">
          🔒 Locked: Finish prerequisite steps ({dependsOn}) to unlock this step.
        </div>
      )}

      {errorMessage && (
        <div className="mt-3 p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg font-medium">
          {errorMessage}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            isCompleted
              ? "bg-emerald-100 text-emerald-800"
              : isLocked
              ? "bg-slate-100 text-slate-400"
              : isInProgress
              ? "bg-amber-100 text-amber-800"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {isLocked ? "LOCKED" : status}
        </span>

        {isInProgress && (
          <button
            onClick={handleComplete}
            disabled={isLocked}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              isLocked
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            }`}
          >
            Confirm & Complete Step →
          </button>
        )}
      </div>

      {showHrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-100 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Officer Audit & Pre-requisite Review
              </h3>
              <button
                onClick={() => setShowHrModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="font-semibold text-slate-700 uppercase text-[10px]">
                System Pre-requisite Audit:
              </div>
              <div className="text-emerald-700 font-medium flex items-center gap-1.5">
                <span>✓ All prior dependent steps ({dependsOn}) are COMPLETED.</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-700 font-semibold">
                Officer Name / ID Tag <span className="text-rose-500">*</span>:
              </label>
              <input
                type="text"
                placeholder="e.g. Sarah Jenkins (HR-9921)"
                value={hrOfficerName}
                onChange={(e) => setHrOfficerName(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowHrModal(false)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleHrApprove}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-xl shadow-sm"
              >
                Authorize & Unlock Checkbox
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}