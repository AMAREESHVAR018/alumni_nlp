const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
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

// Job postings - public
router.get("/", getAllJobs);
router.get("/:id", getJob);

// Job postings - alumni only
router.post("/", authenticate, createJob);
router.get("/my-jobs/list", authenticate, getMyJobs);
router.put("/:id", authenticate, updateJob);
router.post("/:id/close", authenticate, closeJob);

// Applications - students
router.post("/:job_id/apply", authenticate, applyJob);
router.get("/applications/my-applications", authenticate, getMyApplications);

// Applications - alumni
router.get("/:job_id/applications", authenticate, getJobApplications);
router.put("/applications/:app_id/status", authenticate, updateApplicationStatus);

module.exports = router;
