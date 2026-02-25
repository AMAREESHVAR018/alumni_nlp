const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  sendSuccess,
  sendPaginated,
  sendError,
  sendValidationError,
} = require("../utilities/responseHandler");
const {
  validateEmail,
  validatePassword,
} = require("../utilities/validators");
const { USER_ROLES, PAGINATION, JWT_CONFIG, ERROR_CODES } = require("../constants");
const { asyncHandler } = require("../middleware/errorHandler");

// Register new user
exports.register = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    company,
    jobTitle,
    graduationYear,
    domain,
    skills,
    yearsOfExperience,
    currentYear,
    university,
    targetRoles,
    interests,
  } = req.body;

  // Validate required fields
  if (!name || !email || !password || !role) {
    return sendValidationError(res, "Name, email, password, and role are required");
  }

  // Validate email format
  if (!validateEmail(email)) {
    return sendValidationError(res, "Invalid email format");
  }

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return sendValidationError(res, passwordValidation.errors);
  }

  if (!Object.values(USER_ROLES).includes(role)) {
    return sendValidationError(res, `Invalid role. Must be one of: ${Object.values(USER_ROLES).join(", ")}`);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendError(res, "User already exists", 409, ERROR_CODES.USER_EXISTS);
  }

  // Hash password
  const hash = await bcrypt.hash(password, 10);

  // Create user
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase(),
    password: hash,
    role,
    company: role === USER_ROLES.ALUMNI ? company?.trim() : undefined,
    jobTitle: role === USER_ROLES.ALUMNI ? jobTitle?.trim() : undefined,
    graduationYear: role === USER_ROLES.ALUMNI ? graduationYear : undefined,
    domain: domain?.trim(),
    skills: role === USER_ROLES.ALUMNI ? skills : undefined,
    yearsOfExperience: role === USER_ROLES.ALUMNI ? yearsOfExperience : undefined,
    currentYear: role === USER_ROLES.STUDENT ? currentYear : undefined,
    university: role === USER_ROLES.STUDENT ? university?.trim() : undefined,
    targetRoles: role === USER_ROLES.STUDENT ? targetRoles : undefined,
    interests: role === USER_ROLES.STUDENT ? interests : undefined,
  });

  // Generate token
  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: JWT_CONFIG.EXPIRY }
  );

  sendSuccess(
    res,
    {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
    "User registered successfully",
    201
  );
});

// Login user
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendValidationError(res, "Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return sendError(res, "Invalid email or password", 401, ERROR_CODES.INVALID_CREDENTIALS);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return sendError(res, "Invalid email or password", 401, ERROR_CODES.INVALID_CREDENTIALS);
  }

  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: JWT_CONFIG.EXPIRY }
  );

  sendSuccess(
    res,
    {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
    "Login successful"
  );
});

// Get user profile
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) {
    return sendError(res, "User not found", 404, ERROR_CODES.USER_NOT_FOUND);
  }
  sendSuccess(res, user);
});

// Update user profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const updates = req.body;

  // Prevent sensitive field changes
  delete updates.password;
  delete updates.email;
  delete updates.role;

  // Sanitize updates
  Object.keys(updates).forEach((key) => {
    if (typeof updates[key] === "string") {
      updates[key] = updates[key].trim();
    }
  });

  const user = await User.findByIdAndUpdate(id, updates, { new: true }).select(
    "-password"
  );

  if (!user) {
    return sendError(res, "User not found", 404, ERROR_CODES.USER_NOT_FOUND);
  }

  sendSuccess(res, user, "Profile updated successfully");
});

// Search alumni with filters
exports.searchAlumni = asyncHandler(async (req, res) => {
  const {
    domain,
    company,
    skills,
    graduationYear,
    min_experience,
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
  } = req.query;

  const validLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

  let filters = { role: USER_ROLES.ALUMNI };

  if (domain) {
    filters.domain = { $regex: domain, $options: "i" };
  }

  if (company) {
    filters.company = { $regex: company, $options: "i" };
  }

  if (skills) {
    const skillArray = Array.isArray(skills) ? skills : [skills];
    filters.skills = { $in: skillArray };
  }

  if (graduationYear) {
    filters.graduationYear = Number(graduationYear);
  }

  if (min_experience) {
    filters.yearsOfExperience = { $gte: Number(min_experience) };
  }

  const total = await User.countDocuments(filters);
  const alumni = await User.find(filters)
    .select("-password")
    .limit(validLimit * 1)
    .skip((page - 1) * validLimit)
    .sort({ createdAt: -1 });

  sendPaginated(res, alumni, total, page, validLimit);
});

// Get alumni by ID
exports.getAlumni = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const alumni = await User.findById(id).select("-password");

  if (!alumni || alumni.role !== USER_ROLES.ALUMNI) {
    return sendError(res, "Alumni not found", 404, ERROR_CODES.USER_NOT_FOUND);
  }

  sendSuccess(res, alumni);
});
