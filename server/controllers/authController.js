const authService = require("../services/authService");
const { sendSuccess, sendPaginated, sendError, sendValidationError } = require("../utilities/responseHandler");
const { validateEmail, validatePassword, escapeRegex } = require("../utilities/validators");
const { USER_ROLES, PAGINATION } = require("../constants");
const { asyncHandler } = require("../middleware/errorHandler");

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return sendValidationError(res, "Name, email, password, and role are required");
  }
  if (name.trim().length < 2) {
    return sendValidationError(res, "Name must be at least 2 characters");
  }
  if (!validateEmail(email)) {
    return sendValidationError(res, "Invalid email format");
  }
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return sendValidationError(res, passwordValidation.errors);
  }
  if (!Object.values(USER_ROLES).includes(role)) {
    return sendValidationError(res, `Invalid role. Must be one of: ${Object.values(USER_ROLES).join(", ")}`);
  }

  try {
    const { token, expiresAt, refreshToken, user } = await authService.registerUser(req.body);
    sendSuccess(res, { token, refreshToken, expiresAt, user: { id: user._id, name: user.name, email: user.email, role: user.role } }, "User registered successfully", 201);
  } catch (error) {
    if (error instanceof authService.AuthError) {
      return sendError(res, error.message, error.status, error.code);
    }
    throw error;
  }
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return sendValidationError(res, "Email and password are required");
  }

  try {
    const { token, expiresAt, refreshToken, user } = await authService.loginUser(email, password);
    sendSuccess(res, { token, refreshToken, expiresAt, user: { id: user._id, name: user.name, email: user.email, role: user.role } }, "Login successful");
  } catch (error) {
    if (error instanceof authService.AuthError) {
      return sendError(res, error.message, error.status, error.code);
    }
    throw error;
  }
});

exports.getProfile = asyncHandler(async (req, res) => {
  try {
    const user = await authService.getProfile(req.user.id);
    sendSuccess(res, user);
  } catch (error) {
    if (error instanceof authService.AuthError) {
      return sendError(res, error.message, error.status, error.code);
    }
    throw error;
  }
});

exports.updateProfile = asyncHandler(async (req, res) => {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    sendSuccess(res, user, "Profile updated successfully");
  } catch (error) {
    if (error instanceof authService.AuthError) {
      return sendError(res, error.message, error.status, error.code);
    }
    throw error;
  }
});

exports.searchAlumni = asyncHandler(async (req, res) => {
  const { q, domain, company, skills, graduationYear, min_experience, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = req.query;
  
  let filters = { role: USER_ROLES.ALUMNI };
  if (q) {
    const escaped = escapeRegex(q.trim());
    filters.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { bio: { $regex: escaped, $options: 'i' } },
      { skills: { $regex: escaped, $options: 'i' } },
      { company: { $regex: escaped, $options: 'i' } },
      { jobTitle: { $regex: escaped, $options: 'i' } },
    ];
  }
  if (domain) filters.domain = { $regex: escapeRegex(domain), $options: "i" };
  if (company && !q) filters.company = { $regex: escapeRegex(company), $options: "i" };
  if (skills) {
    const skillArray = Array.isArray(skills) ? skills : [skills];
    filters.skills = { $in: skillArray };
  }
  if (graduationYear) filters.graduationYear = Number(graduationYear);
  if (min_experience) filters.yearsOfExperience = { $gte: Number(min_experience) };

  const result = await authService.searchAlumni(filters, page, limit);
  sendPaginated(res, result.alumni, result.total, result.page, result.validLimit);
});

exports.getAlumni = asyncHandler(async (req, res) => {
  try {
    const alumni = await authService.getAlumni(req.params.id);
    sendSuccess(res, alumni);
  } catch (error) {
    if (error instanceof authService.AuthError) {
      return sendError(res, error.message, error.status, error.code);
    }
    throw error;
  }
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return sendValidationError(res, "Refresh token is required");
  }

  try {
    const { token, expiresAt } = await authService.refreshAccessToken(refreshToken);
    sendSuccess(res, { token, expiresAt }, "Token refreshed successfully");
  } catch (error) {
    if (error instanceof authService.AuthError) {
      return sendError(res, error.message, error.status, error.code);
    }
    throw error;
  }
});
