const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const {
  createJob,
  getAllJobs,
  getJob,
  getMyJobs,
  updateJob,
  closeJob,
  applyJob,
  getJobApplications,
  getMyApplications,
  updateApplicationStatus
} = require("../controllers/jobController");

// Specific static paths MUST come before param routes to avoid shadowing by /:id
router.get("/my-jobs/list", authenticate, authorize(["alumni", "admin"]), getMyJobs);
router.get("/applications/my-applications", authenticate, getMyApplications);

// Job postings - public
router.get("/", getAllJobs);
router.get("/:id", getJob);

// Job postings - alumni/admin only
router.post("/", authenticate, authorize(["alumni", "admin"]), createJob);
router.put("/:id", authenticate, authorize(["alumni", "admin"]), updateJob);
router.patch("/:id", authenticate, authorize(["alumni", "admin"]), updateJob);
router.post("/:id/close", authenticate, authorize(["alumni", "admin"]), closeJob);

// Applications - students
router.post("/:job_id/apply", authenticate, applyJob);

// Applications - alumni
router.get("/:job_id/applications", authenticate, authorize(["alumni", "admin"]), getJobApplications);
router.put("/applications/:app_id/status", authenticate, authorize(["alumni", "admin"]), updateApplicationStatus);

module.exports = router;
