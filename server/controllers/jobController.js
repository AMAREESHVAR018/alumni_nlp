const jobService = require("../services/jobService");
const { sendSuccess, sendPaginated, sendError, sendValidationError } = require("../utilities/responseHandler");
const { validateJobApplication, escapeRegex } = require("../utilities/validators");
const { EMPLOYMENT_TYPES, PAGINATION, APPLICATION_STATUS } = require("../constants");
const { asyncHandler } = require("../middleware/errorHandler");

exports.createJob = asyncHandler(async (req, res) => {
  const { title, company, description, employment_type, deadline } = req.body;
  if (!title || !company || !description || !employment_type || !deadline) {
    return sendValidationError(res, "Title, company, description, employment type, and deadline are required");
  }
  if (!Object.values(EMPLOYMENT_TYPES).includes(employment_type)) {
    return sendValidationError(res, `Invalid employment type. Must be one of: ${Object.values(EMPLOYMENT_TYPES).join(", ")}`);
  }
  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) {
    return sendValidationError(res, "Invalid deadline date format");
  }
  if (deadlineDate < new Date()) {
    return sendValidationError(res, "Deadline must be in the future");
  }

  const job = await jobService.createJob(req.user.id, req.body);
  sendSuccess(res, { job }, "Job posted successfully", 201);
});

exports.getAllJobs = asyncHandler(async (req, res) => {
  const { title, company, domain, employment_type, skills, location, experience_level, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = req.query;

  let filters = { is_active: true };
  if (title) filters.title = { $regex: escapeRegex(title), $options: "i" };
  if (company) filters.company = { $regex: escapeRegex(company), $options: "i" };
  if (domain) filters.domain = { $regex: escapeRegex(domain), $options: "i" };
  if (employment_type) {
    if (!Object.values(EMPLOYMENT_TYPES).includes(employment_type)) {
      return sendValidationError(res, `Invalid employment type: ${employment_type}`);
    }
    filters.employment_type = employment_type;
  }
  if (experience_level) filters.experience_level = experience_level;
  if (location) filters.location = { $regex: escapeRegex(location), $options: "i" };
  if (skills) filters.skills_required = { $in: Array.isArray(skills) ? skills : [skills] };

  const result = await jobService.getAllJobs(filters, page, limit);
  sendPaginated(res, result.jobs, result.total, result.page, result.validLimit, "Jobs retrieved successfully");
});

exports.getJob = asyncHandler(async (req, res) => {
  try {
    const job = await jobService.getJob(req.params.id);
    sendSuccess(res, job);
  } catch (error) {
    if (error instanceof jobService.JobError) {
      return sendError(res, error.message, error.status, error.code);
    }
    throw error;
  }
});

exports.getMyJobs = asyncHandler(async (req, res) => {
  const { page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = req.query;
  const result = await jobService.getMyJobs(req.user.id, page, limit);
  sendPaginated(res, result.jobs, result.total, result.page, result.validLimit);
});

exports.updateJob = asyncHandler(async (req, res) => {
  try {
    const updatedJob = await jobService.updateJob(req.params.id, req.user.id, req.user.role, req.body);
    sendSuccess(res, updatedJob, "Job updated successfully");
  } catch (error) {
    if (error instanceof jobService.JobError) {
      return sendError(res, error.message, error.status, error.code);
    }
    throw error;
  }
});

exports.closeJob = asyncHandler(async (req, res) => {
  try {
    await jobService.closeJob(req.params.id, req.user.id, req.user.role);
    sendSuccess(res, { job_id: req.params.id }, "Job closed successfully");
  } catch (error) {
    if (error instanceof jobService.JobError) {
      return sendError(res, error.message, error.status, error.code);
    }
    throw error;
  }
});

exports.applyJob = asyncHandler(async (req, res) => {
  const { resume_link, cover_letter } = req.body;
  const validation = validateJobApplication({ resume_link, cover_letter });
  if (!validation.valid) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const application = await jobService.applyJob(req.params.job_id, req.user.id, req.body);
    sendSuccess(res, { application }, "Application submitted successfully", 201);
  } catch (error) {
    if (error instanceof jobService.JobError) {
      return sendError(res, error.message, error.status, error.code);
    }
    throw error;
  }
});

exports.getJobApplications = asyncHandler(async (req, res) => {
  const { status, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = req.query;
  let filters = { job_id: req.params.job_id };
  
  if (status) {
    if (!Object.values(APPLICATION_STATUS).includes(status)) {
      return sendValidationError(res, `Invalid application status: ${status}`);
    }
    filters.status = status;
  }

  try {
    const result = await jobService.getJobApplications(req.params.job_id, req.user.id, req.user.role, filters, page, limit);
    sendPaginated(res, result.applications, result.total, result.page, result.validLimit);
  } catch (error) {
    if (error instanceof jobService.JobError) {
      return sendError(res, error.message, error.status, error.code);
    }
    throw error;
  }
});

exports.getMyApplications = asyncHandler(async (req, res) => {
  const { status, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = req.query;
  let filters = { student_id: req.user.id };
  
  if (status) {
    if (!Object.values(APPLICATION_STATUS).includes(status)) {
      return sendValidationError(res, `Invalid application status: ${status}`);
    }
    filters.status = status;
  }

  const result = await jobService.getMyApplications(req.user.id, filters, page, limit);
  sendPaginated(res, result.applications, result.total, result.page, result.validLimit);
});

exports.updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, feedback } = req.body;
  if (!status) return sendValidationError(res, "Status is required");
  if (!Object.values(APPLICATION_STATUS).includes(status)) {
    return sendValidationError(res, `Invalid status. Must be one of: ${Object.values(APPLICATION_STATUS).join(", ")}`);
  }

  try {
    const application = await jobService.updateApplicationStatus(req.params.app_id, req.user.id, req.user.role, status, feedback);
    sendSuccess(res, { application }, "Application status updated successfully");
  } catch (error) {
    if (error instanceof jobService.JobError) {
      return sendError(res, error.message, error.status, error.code);
    }
    throw error;
  }
});
