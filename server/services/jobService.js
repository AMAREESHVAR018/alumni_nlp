const JobPost = require("../models/JobPost");
const Application = require("../models/Application");
const { USER_ROLES, EMPLOYMENT_TYPES, PAGINATION, ERROR_CODES, APPLICATION_STATUS } = require("../constants");

class JobError extends Error {
  constructor(message, status = 500, code = "JOB_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const createJob = async (alumniId, data) => {
  const { title, company, description, skills_required, experience_level, location, employment_type, salary_range, deadline, domain, category, benefits, about_company } = data;
  
  const job = await JobPost.create({
    alumni_id: alumniId,
    title: title.trim(),
    company: company.trim(),
    description: description.trim(),
    skills_required: skills_required || [],
    experience_level: experience_level || "entry",
    location: location ? location.trim() : undefined,
    employment_type,
    salary_range,
    deadline: new Date(deadline),
    domain: domain ? domain.trim() : undefined,
    category: category ? category.trim() : employment_type,
    benefits: benefits || [],
    about_company: about_company ? about_company.trim() : undefined,
    is_active: true,
  });

  await job.populate("alumni_id", "name email company jobTitle");
  return job;
};

const getAllJobs = async (filters, page, limit) => {
  const validLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
  const total = await JobPost.countDocuments(filters);
  const jobs = await JobPost.find(filters)
    .populate("alumni_id", "name email company jobTitle linkedinUrl")
    .sort({ createdAt: -1 })
    .limit(validLimit)
    .skip((page - 1) * validLimit)
    .lean();
  return { jobs, total, page, validLimit };
};

const getJob = async (id) => {
  const job = await JobPost.findByIdAndUpdate(id, { $inc: { views_count: 1 } }, { new: true })
    .populate("alumni_id", "name email company jobTitle linkedinUrl bio");
  if (!job) {
    throw new JobError("Job not found", 404, ERROR_CODES.JOB_NOT_FOUND);
  }
  return job;
};

const getMyJobs = async (alumniId, page, limit) => {
  const validLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
  const total = await JobPost.countDocuments({ alumni_id: alumniId });
  const jobs = await JobPost.find({ alumni_id: alumniId })
    .sort({ createdAt: -1 })
    .limit(validLimit)
    .skip((page - 1) * validLimit)
    .lean();
  return { jobs, total, page, validLimit };
};

const updateJob = async (id, userId, userRole, updates) => {
  const job = await JobPost.findById(id);
  if (!job) throw new JobError("Job not found", 404, ERROR_CODES.JOB_NOT_FOUND);
  if (job.alumni_id.toString() !== userId && userRole !== USER_ROLES.ADMIN) {
    throw new JobError("Not authorized to update this job", 403, ERROR_CODES.FORBIDDEN);
  }

  delete updates.alumni_id;
  delete updates.createdAt;

  Object.keys(updates).forEach((key) => {
    if (typeof updates[key] === "string") updates[key] = updates[key].trim();
  });

  return await JobPost.findByIdAndUpdate(id, updates, { new: true });
};

const closeJob = async (id, userId, userRole) => {
  const job = await JobPost.findById(id);
  if (!job) throw new JobError("Job not found", 404, ERROR_CODES.JOB_NOT_FOUND);
  if (job.alumni_id.toString() !== userId && userRole !== USER_ROLES.ADMIN) {
    throw new JobError("Not authorized to close this job", 403, ERROR_CODES.FORBIDDEN);
  }
  await JobPost.findByIdAndUpdate(id, { is_active: false });
  return id;
};

const applyJob = async (jobId, studentId, data) => {
  const job = await JobPost.findById(jobId);
  if (!job) throw new JobError("Job not found", 404, ERROR_CODES.JOB_NOT_FOUND);
  if (!job.is_active) throw new JobError("This job posting is closed", 410, ERROR_CODES.JOB_CLOSED);

  const existingApplication = await Application.findOne({ student_id: studentId, job_id: jobId });
  if (existingApplication) throw new JobError("Already applied to this job", 409, ERROR_CODES.DUPLICATE_APPLICATION);

  const application = await Application.create({
    student_id: studentId,
    job_id: jobId,
    resume_link: data.resume_link.trim(),
    cover_letter: data.cover_letter ? data.cover_letter.trim() : undefined,
    status: APPLICATION_STATUS.PENDING,
  });

  await JobPost.findByIdAndUpdate(jobId, { $inc: { applications_count: 1 } });
  return await application.populate(["job_id", { path: "student_id", select: "name email university currentYear" }]);
};

const getJobApplications = async (jobId, userId, userRole, filters, page, limit) => {
  const job = await JobPost.findById(jobId);
  if (!job) throw new JobError("Job not found", 404, ERROR_CODES.JOB_NOT_FOUND);
  if (job.alumni_id.toString() !== userId && userRole !== USER_ROLES.ADMIN) {
    throw new JobError("Not authorized to view these applications", 403, ERROR_CODES.FORBIDDEN);
  }

  const validLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
  const total = await Application.countDocuments(filters);
  const applications = await Application.find(filters)
    .populate("student_id", "name email university currentYear")
    .sort({ applied_at: -1 })
    .limit(validLimit)
    .skip((page - 1) * validLimit)
    .lean();
  return { applications, total, page, validLimit };
};

const getMyApplications = async (studentId, filters, page, limit) => {
  const validLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
  const total = await Application.countDocuments(filters);
  const applications = await Application.find(filters)
    .populate("job_id")
    .populate("student_id")
    .sort({ applied_at: -1 })
    .limit(validLimit)
    .skip((page - 1) * validLimit)
    .lean();
  return { applications, total, page, validLimit };
};

const updateApplicationStatus = async (appId, userId, userRole, status, feedback) => {
  const application = await Application.findById(appId);
  if (!application) throw new JobError("Application not found", 404, ERROR_CODES.APPLICATION_NOT_FOUND);

  const job = await JobPost.findById(application.job_id);
  if (!job) throw new JobError("Associated job not found", 404, ERROR_CODES.JOB_NOT_FOUND);

  if (job.alumni_id.toString() !== userId && userRole !== USER_ROLES.ADMIN) {
    throw new JobError("Not authorized to update this application", 403, ERROR_CODES.FORBIDDEN);
  }

  const updatedApp = await Application.findByIdAndUpdate(
    appId,
    { status, feedback: feedback ? feedback.trim() : undefined, reviewed_by: userId, reviewed_at: new Date() },
    { new: true }
  ).populate("student_id").populate("job_id");

  return updatedApp;
};

module.exports = {
  JobError,
  createJob,
  getAllJobs,
  getJob,
  getMyJobs,
  updateJob,
  closeJob,
  applyJob,
  getJobApplications,
  getMyApplications,
  updateApplicationStatus,
};
