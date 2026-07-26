# 🚀 Dynamic Workflow Generator & Orchestration Engine

A full-stack, state-driven workflow management system designed to orchestrate multi-step enterprise business pipelines (e.g., employee onboarding, compliance tracking, IT provisioning). 

The platform features a dynamic frontend execution portal built in React and a Node.js/Express backend that handles file uploads, step status updates, and graph-based workflow dependencies.

---

## ✨ Key Features

- **Dynamic Dependency & Prerequisite Sorting:** Utilizes graph-based depth calculation and topological sorting algorithms to dynamically evaluate prerequisite chains and enforce correct step execution order (e.g., ensuring security briefings precede mandatory training).
- **Automated Lock/Unlock Gates:** Real-time state evaluation that automatically unlocks downstream steps once upstream dependencies are marked as completed.
- **Multi-Modal Step Execution Cards:** Custom UI components tailored for specific operational tasks:
  - 📄 **Input Steps:** Document and file uploads (LMS certificates, ID verification) handled via backend storage endpoints.
  - ⚙️ **Action Steps:** Asset allocations, IT credential provisioning.
  - 🛡️ **Approval & Audit Gates:** HR/Admin sign-offs with compliance verifications.
  - 🔔 **Notification & Decision Steps:** Automated alerts and conditional execution branches.
  - 📌 **Terminal End Pins:** Logic that ensures workflow termination nodes are strictly pinned to the bottom of the execution sequence.
- **Full CRUD & Dynamic Re-indexing:** Real-time step addition, editing, deletion, and automated sequence key re-indexing across all client layers.

---

## 🛠️ Tech Stack

**Frontend:**
- **Framework:** React.js (Vite)
- **Styling:** CSS Modules / Tailwind CSS
- **Icons:** Lucide React

**Backend:**
- **Runtime:** Node.js, Express.js
- **File Handling:** Multer (Local File Upload Storage)
- **API Architecture:** RESTful APIs

---

## 📁 Repository Structure

```text
Dynamic-Workflow-Generator/
├── backend/
│   ├── uploads/            # Managed folder for user-uploaded documents
│   ├── package.json
│   └── server.js           # Express API endpoints for workflow execution & file management
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── WorkflowCard.jsx   # Interactive step UI card & modal handlers
│   │   │   └── WorkflowList.jsx   # Rendered list of step execution pipelines
│   │   ├── App.jsx                # Core state orchestration, graph sorting & API integration
│   │   └── main.jsx
│   └── package.json
└── README.md
🚀 Getting Started
Prerequisites
Make sure you have Node.js (v16 or higher) installed.

Installation & Setup
Clone the Repository:

Bash
git clone [https://github.com/sania252004/Dynamic-Workflow-Generator.git](https://github.com/sania252004/Dynamic-Workflow-Generator.git)
cd Dynamic-Workflow-Generator
Backend Setup:

Bash
cd backend
npm install
npm start
The server will start running on http://localhost:5000 (or your configured port).

Frontend Setup:
Open a new terminal window:

Bash
cd frontend
npm install
npm run dev
Open http://localhost:5173 in your browser to view the portal.

📌 How It Works
Creating Custom Steps: Click "Add Custom Step" in the UI, define the title, select the step category (Input, Action, Approval, etc.), and specify prerequisite step dependencies.

Executing Steps: Upload required verification files or complete action prompts on active cards. The engine will process the action and auto-calculate down-stream unlock states.

Audit Gates: HR/Admin approval steps act as compliance checkpoints before terminal onboarding nodes can be finalized.
