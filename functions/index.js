const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");

admin.initializeApp();
const db = admin.firestore();

const STUDENT_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@st\.knust\.edu\.gh$/;
const rateLimitMap = new Map();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

const createRateLimit = ({ max = 60, windowMs = 60_000 } = {}) => (req, res, next) => {
  const now = Date.now();
  const key = `${req.ip}:${req.path}`;
  const bucket = rateLimitMap.get(key) || [];
  const recent = bucket.filter((stamp) => now - stamp < windowMs);

  if (recent.length >= max) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }

  recent.push(now);
  rateLimitMap.set(key, recent);
  next();
};

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) {
      res.status(401).json({ error: "Missing bearer token" });
      return;
    }

    const decoded = await admin.auth().verifyIdToken(token, true);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn("Auth verification failed", { message: error?.message });
    res.status(401).json({ error: "Invalid auth token" });
  }
};

const requireAdmin = async (req, res, next) => {
  const claims = req.user || {};
  if (claims.admin === true || claims.superAdmin === true) {
    next();
    return;
  }

  const snap = await db.collection("users").doc(claims.uid).get();
  const role = String(snap.data()?.role || "").toLowerCase();
  if (role === "admin" || role === "superadmin" || role === "super_admin") {
    next();
    return;
  }

  res.status(403).json({ error: "Admin access required" });
};

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "edutec-api",
    timestamp: new Date().toISOString()
  });
});

app.post("/v1/auth/validate-student-email", createRateLimit({ max: 120 }), (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const valid = STUDENT_EMAIL_REGEX.test(email);
  res.status(200).json({ valid });
});

app.post(
  "/v1/maintenance/assign",
  createRateLimit({ max: 40 }),
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        reportPath,
        technicianUid,
        faultType,
        wing,
        lane,
        room,
        notes = ""
      } = req.body || {};

      if (!reportPath || !technicianUid || !faultType || !wing || !lane || !room) {
        res.status(400).json({ error: "Missing required assignment fields" });
        return;
      }

      const payload = {
        reportPath,
        technicianUid,
        faultType,
        wing,
        lane,
        room,
        notes: String(notes || "").slice(0, 500),
        status: "assigned",
        assignedBy: req.user.uid,
        assignedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const ref = await db.collection("maintenanceAssignments").add(payload);
      await db.doc(reportPath).set(
        {
          assignedTechnicianUid: technicianUid,
          assignmentStatus: "assigned",
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      res.status(201).json({ assignmentId: ref.id });
    } catch (error) {
      logger.error("Failed to assign maintenance", { message: error?.message });
      res.status(500).json({ error: "Failed to create maintenance assignment" });
    }
  }
);

app.patch(
  "/v1/reports/status",
  createRateLimit({ max: 60 }),
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const { reportPath, status } = req.body || {};
      const allowed = ["pending", "assigned", "in_progress", "resolved", "rejected"];

      if (!reportPath || !allowed.includes(status)) {
        res.status(400).json({ error: "Invalid status payload" });
        return;
      }

      await db.doc(reportPath).set(
        {
          status,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          statusUpdatedBy: req.user.uid
        },
        { merge: true }
      );

      res.status(200).json({ ok: true });
    } catch (error) {
      logger.error("Failed to update report status", { message: error?.message });
      res.status(500).json({ error: "Unable to update report status" });
    }
  }
);

exports.api = onRequest(
  {
    region: "africa-south1",
    maxInstances: 20,
    timeoutSeconds: 30
  },
  app
);

exports.notifyAdminOnReportCreate = onDocumentCreated(
  {
    document: "rooms/{roomId}/students/{studentUid}/reports/{reportId}",
    region: "africa-south1"
  },
  async (event) => {
    const report = event.data?.data() || {};
    logger.info("New fault report created", {
      room: report.room || event.params.roomId,
      faultTypes: report.faultTypes || [],
      createdBy: report.createdBy || event.params.studentUid
    });
  }
);
