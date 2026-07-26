import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// 1. Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded files statically
app.use("/uploads", express.static(uploadDir));

// 2. Configure Multer for PDF file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: pdfFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// 3. PDF Upload Endpoint
app.post("/upload-pdf", upload.single("pdf"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded or invalid file format." });
  }

  const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({
    message: "PDF uploaded successfully!",
    fileName: req.file.originalname,
    fileUrl: fileUrl,
  });
});

// 4. Dynamic Workflow Generation Endpoint
app.post("/generate-workflow", (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Please provide a prompt." });
  }

  const lower = prompt.toLowerCase();
  let workflow = [];

  // Branch 1: Vendor / Third-Party / Contractor Onboarding
  if (
    lower.includes("vendor") ||
    lower.includes("contractor") ||
    lower.includes("third party") ||
    lower.includes("freelancer")
  ) {
    workflow = [
      {
        id: "1",
        sequence: 1,
        title: "Vendor NDA & Compliance Verification",
        type: "Input",
        dependsOn: "none",
      },
      {
        id: "2",
        sequence: 2,
        title: "Provision VDI & Security Workspace Access",
        type: "Action",
        dependsOn: "Vendor NDA & Compliance Verification",
      },
      {
        id: "3",
        sequence: 3,
        title: "Vendor Security Gate Pass & Badge Approval",
        type: "Approval",
        dependsOn: "Provision VDI & Security Workspace Access",
      },
      {
        id: "4",
        sequence: 4,
        title: "Send Vendor Portal Onboarding Notification",
        type: "Notification",
        dependsOn: "Vendor Security Gate Pass & Badge Approval",
      },
      {
        id: "5",
        sequence: 5,
        title: "Vendor Onboarding Complete",
        type: "End",
        dependsOn: "Send Vendor Portal Onboarding Notification",
      },
    ];
  }
  // Branch 2: Expense Reimbursement Pipeline
  else if (
    lower.includes("expense") ||
    lower.includes("receipt") ||
    lower.includes("reimburse") ||
    lower.includes("finance")
  ) {
    workflow = [
      {
        id: "1",
        sequence: 1,
        title: "Submit Expense Receipts & Proofs",
        type: "Input",
        dependsOn: "none",
      },
      {
        id: "2",
        sequence: 2,
        title: "Manager Verification & Approval",
        type: "Approval",
        dependsOn: "Submit Expense Receipts & Proofs",
      },
      {
        id: "3",
        sequence: 3,
        title: "Finance Audit & Budget Check",
        type: "Approval",
        dependsOn: "Manager Verification & Approval",
      },
      {
        id: "4",
        sequence: 4,
        title: "Disburse Reimbursement Funds",
        type: "Action",
        dependsOn: "Finance Audit & Budget Check",
      },
      {
        id: "5",
        sequence: 5,
        title: "Expense Processed & Complete",
        type: "End",
        dependsOn: "Disburse Reimbursement Funds",
      },
    ];
  }
  // Branch 3: IT & Security Incident Management
  else if (
    lower.includes("incident") ||
    lower.includes("security") ||
    lower.includes("triage") ||
    lower.includes("outage")
  ) {
    workflow = [
      {
        id: "1",
        sequence: 1,
        title: "Submit Incident Report & Log Logs",
        type: "Input",
        dependsOn: "none",
      },
      {
        id: "2",
        sequence: 2,
        title: "Triage Severity & Assess Risk",
        type: "Action",
        dependsOn: "Submit Incident Report & Log Logs",
      },
      {
        id: "3",
        sequence: 3,
        title: "Notify IT & SecOps Alert Escalation",
        type: "Notification",
        dependsOn: "Triage Severity & Assess Risk",
      },
      {
        id: "4",
        sequence: 4,
        title: "Isolate Affected Systems & Apply Patch",
        type: "Action",
        dependsOn: "Notify IT & SecOps Alert Escalation",
      },
      {
        id: "5",
        sequence: 5,
        title: "Incident Resolved & RCA Complete",
        type: "End",
        dependsOn: "Isolate Affected Systems & Apply Patch",
      },
    ];
  }
  // Branch 4: Standard Full-Time Employee (FTE) Onboarding Pipeline
  else {
    workflow = [
      {
        id: "1",
        sequence: 1,
        title: "Collect Employee Documents",
        type: "Input",
        dependsOn: "none",
      },
      {
        id: "2",
        sequence: 2,
        title: "Allocate Laptop & Corporate Assets",
        type: "Action",
        dependsOn: "Collect Employee Documents",
      },
      {
        id: "3",
        sequence: 3,
        title: "Schedule Induction Session",
        type: "Notification",
        dependsOn: "Collect Employee Documents",
      },
      {
        id: "4",
        sequence: 4,
        title: "Complete Mandatory Training",
        type: "Approval",
        dependsOn: "Schedule Induction Session, Allocate Laptop & Corporate Assets",
      },
      {
        id: "5",
        sequence: 5,
        title: "Onboarding Complete",
        type: "End",
        dependsOn: "Complete Mandatory Training",
      },
    ];
  }

  res.json({ workflow });
});

// 5. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});