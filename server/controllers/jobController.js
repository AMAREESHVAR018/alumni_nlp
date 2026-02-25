const JobPost = require("../models/JobPost");
const Application = require("../models/Application");
const User = require("../models/User");
const {
  sendSuccess,
  sendPaginated,
  sendError,
  sendValidationError,
} = require("../utilities/responseHandler");
const { validateJobPost, validateJobApplication } = require("../utilities/validators");
const {
  USER_ROLES,
  EMPLOYMENT_TYPES,
  PAGINATION,
  ERROR_CODES,
  APPLICATION_STATUS,
} = require("../constants");
const { asyncHandler } = require("../middleware/errorHandler");

// Create job posting (alumni only)
exports.createJob = asyncHandler(async (req, res) => {
  const {
    title,
    company,
    description,
    skills_required,
    experience_level,
    location,
    employment_type,
    salary_range,
    deadline,
    domain,
    category,
    benefits,
    about_company,
  } = req.body;

  // Validate required fields
  if (!title || !company || !description || !employment_type || !deadline) {
    return sendValidationError(
      res,
      "Title, company, description, employment type, and deadline are required"
    );
  }

  // Validate employment type
  if (!Object.values(EMPLOYMENT_TYPES).includes(employment_type)) {
    return sendValidationError(
      res,
      `Invalid employment type. Must be one of: ${Object.values(EMPLOYMENT_TYPES).join(", ")}`
    );
  }

  // Validate deadline format
  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) {
    return sendValidationError(res, "Invalid deadline date format");
  }

  if (deadlineDate < new Date()) {
    return sendValidationError(res, "Deadline must be in the future");
  }

  const job = await JobPost.create({
    alumni_id: req.user.id,
    title: title.trim(),
    company: company.trim(),
    description: description.trim(),
    skills_required: skills_required || [],
    experience_level: experience_level || "entry",
    location: location ? location.trim() : undefined,
    employment_type,
    salary_range,
    deadline: deadlineDate,
    domain: domain ? domain.trim() : undefined,
    category: category ? category.trim() : employment_type,
    benefits: benefits || [],
    about_company: about_company ? about_company.trim() : undefined,
    is_active: true,
  });

  await job.populate("alumni_id", "name email company jobTitle");

  sendSuccess(res, { job }, "Job posted successfully", 201);
});

// Get all jobs with filters
exports.getAllJobs = asyncHandler(async (req, res) => {
  const {
    company,
    domain,
    employment_type,
    skills,
    location,
    experience_level,
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
  } = req.query;

  const validLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

  let filters = { is_active: true };

  if (company) {
    filters.company = { $regex: company, $options: "i" };
  }

  if (domain) {
    filters.domain = { $regex: domain, $options: "i" };
  }

  if (employment_type) {
    if (!Object.values(EMPLOYMENT_TYPES).includes(employment_type)) {
      return sendValidationError(res, `Invalid employment type: ${employment_type}`);
    }
    filters.employment_type = employment_type;
  }

  if (experience_level) {
    filters.experience_level = experience_level;
  }

  if (location) {
    filters.location = { $regex: location, $options: "i" };
  }

  if (skills) {
    const skillArray = Array.isArray(skills) ? skills : [skills];
    filters.skills_required = { $in: skillArray };
  }

  const total = await JobPost.countDocuments(filters);
  const jobs = await JobPost.find(filters)
    .populate("alumni_id", "name email company jobTitle linkedinUrl")
    .sort({ createdAt: -1 })
    .limit(validLimit)
    .skip((page - 1) * validLimit);

  sendPaginated(res, jobs, total, page, validLimit, "Jobs retrieved successfully");
});

// Get job by ID
exports.getJob = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const job = await JobPost.findByIdAndUpdate(
    id,
    { $inc: { views_count: 1 } },
    { new: true }
  ).populate("alumni_id", "name email company jobTitle linkedinUrl bio");

  if (!job) {
    return sendError(res, "Job not found", 404, ERROR_CODES.JOB_NOT_FOUND);
  }

  sendSuccess(res, job);
});

// Get my job postings (alumni)
exports.getMyJobs = asyncHandler(async (req, res) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
  } = req.query;

  const validLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

  const total = await JobPost.countDocuments({ alumni_id: req.user.id });
  const jobs = await JobPost.find({ alumni_id: req.user.id })
    .sort({ createdAt: -1 })
    .limit(validLimit)
    .skip((page - 1) * validLimit);

  sendPaginated(res, jobs, total, page, validLimit);
});

// Update job posting
exports.updateJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const job = await JobPost.findById(id);
  if (!job) {
    return sendError(res, "Job not found", 404, ERROR_CODES.JOB_NOT_FOUND);
  }

  // Check authorization
  if (job.alumni_id.toString() !== req.user.id && req.user.role !== USER_ROLES.ADMIN) {
    return sendError(
      res,
      "Not authorized to update this job",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  // Prevent critical field changes
  delete updates.alumni_id;
  delete updates.createdAt;

  // Sanitize string updates
  Object.keys(updates).forEach((key) => {
    if (typeof updates[key] === "string") {
      updates[key] = updates[key].trim();
    }
  });

  const updatedJob = await JobPost.findByIdAndUpdate(id, updates, { new: true });

  sendSuccess(res, updatedJob, "Job updated successfully");
});

// Close job posting
exports.closeJob = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const job = await JobPost.findById(id);
  if (!job) {
    return sendError(res, "Job not found", 404, ERROR_CODES.JOB_NOT_FOUND);
  }

  // Check authorization
  if (job.alumni_id.toString() !== req.user.id && req.user.role !== USER_ROLES.ADMIN) {
    return sendError(
      res,
      "Not authorized to close this job",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  await JobPost.findByIdAndUpdate(id, { is_active: false });

  sendSuccess(res, { job_id: id }, "Job closed successfully");
});

// Apply for job
exports.applyJob = asyncHandler(async (req, res) => {
  const { job_id } = req.params;
  const { resume_link, cover_letter } = req.body;

  // Validate application input
  const validation = validateJobApplication({ resume_link, cover_letter });
  if (!validation.valid) {
    return sendValidationError(res, validation.errors);
  }

  const job = await JobPost.findById(job_id);
  if (!job) {
    return sendError(res, "Job not found", 404, ERROR_CODES.JOB_NOT_FOUND);
  }

  if (!job.is_active) {
    return sendError(res, "This job posting is closed", 410, ERROR_CODES.JOB_CLOSED);
  }

  // Check if already applied
  const existingApplication = await Application.findOne({
    student_id: req.user.id,
    job_id,
  });

  if (existingApplication) {
    return sendError(res, "Already applied to this job", 409, ERROR_CODES.DUPLICATE_APPLICATION);
  }

  const application = await Application.create({
    student_id: req.user.id,
    job_id,
    resume_link: resume_link.trim(),
    cover_letter: cover_letter ? cover_letter.trim() : undefined,
    status: APPLICATION_STATUS.PENDING,
  });

  // Update applications count
  await JobPost.findByIdAndUpdate(job_id, { $inc: { applications_count: 1 } });

  const populatedApp = await application
    .populate("job_id")
    .populate("student_id", "name email university currentYear");

  sendSuccess(
    res,
    { application: populatedApp },
    "Application submitted successfully",
    201
  );
});

// Get applications for a job (alumni)
exports.getJobApplications = asyncHandler(async (req, res) => {
  const { job_id } = req.params;
  const {
    status,
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
  } = req.query;

  const job = await JobPost.findById(job_id);
  if (!job) {
    return sendError(res, "Job not found", 404, ERROR_CODES.JOB_NOT_FOUND);
  }

  // Check authorization
  if (job.alumni_id.toString() !== req.user.id && req.user.role !== USER_ROLES.ADMIN) {
    return sendError(
      res,
      "Not authorized to view these applications",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  const validLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

  let filters = { job_id };
  if (status) {
    if (!Object.values(APPLICATION_STATUS).includes(status)) {
      return sendValidationError(res, `Invalid application status: ${status}`);
    }
    filters.status = status;
  }

  const total = await Application.countDocuments(filters);
  const applications = await Application.find(filters)
    .populate("student_id", "name email university currentYear")
    .sort({ applied_at: -1 })
    .limit(validLimit)
    .skip((page - 1) * validLimit);

  sendPaginated(res, applications, total, page, validLimit);
});

// Get my applications (student)
exports.getMyApplications = asyncHandler(async (req, res) => {
  const {
    status,
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
  } = req.query;

  const validLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

  let filters = { student_id: req.user.id };
  if (status) {
    if (!Object.values(APPLICATION_STATUS).includes(status)) {
      return sendValidationError(res, `Invalid application status: ${status}`);
    }
    filters.status = status;
  }

  const total = await Application.countDocuments(filters);
  const applications = await Application.find(filters)
    .populate("job_id")
    .populate("student_id")
    .sort({ applied_at: -1 })
    .limit(validLimit)
    .skip((page - 1) * validLimit);

  sendPaginated(res, applications, total, page, validLimit);
});

// Update application status (alumni)
exports.updateApplicationStatus = asyncHandler(async (req, res) => {
  const { app_id } = req.params;
  const { status, feedback } = req.body;

  if (!status) {
    return sendValidationError(res, "Status is required");
  }

  if (!Object.values(APPLICATION_STATUS).includes(status)) {
    return sendValidationError(
      res,
      `Invalid status. Must be one of: ${Object.values(APPLICATION_STATUS).join(", ")}`
    );
  }

  const application = await Application.findById(app_id);
  if (!application) {
    return sendError(res, "Application not found", 404, ERROR_CODES.APPLICATION_NOT_FOUND);
  }

  const job = await JobPost.findById(application.job_id);
  if (!job) {
    return sendError(res, "Associated job not found", 404, ERROR_CODES.JOB_NOT_FOUND);
  }

  // Check authorization
  if (job.alumni_id.toString() !== req.user.id && req.user.role !== USER_ROLES.ADMIN) {
    return sendError(
      res,
      "Not authorized to update this application",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  const updatedApp = await Application.findByIdAndUpdate(
    app_id,
    {
      status,
      feedback: feedback ? feedback.trim() : undefined,
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
    },
    { new: true }
  )
    .populate("student_id")
    .populate("job_id");

  sendSuccess(
    res,
    { application: updatedApp },
    "Application status updated successfully"
  );
});
