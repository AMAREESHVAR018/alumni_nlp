const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { USER_ROLES, JWT_CONFIG, ERROR_CODES, PAGINATION } = require("../constants");

// Separate secret for refresh tokens — falls back to JWT_SECRET + suffix if not set
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + "_refresh");

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId, type: "refresh" },
    REFRESH_SECRET,
    { expiresIn: JWT_CONFIG.REFRESH_EXPIRY }
  );
};

class AuthError extends Error {
  constructor(message, status = 500, code = "AUTH_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const registerUser = async (data) => {
  const {
    name, email, password, role, company, jobTitle, graduationYear,
    domain, skills, yearsOfExperience, currentYear, university,
    targetRoles, interests,
  } = data;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AuthError("User already exists", 409, ERROR_CODES.USER_EXISTS);
  }

  const hash = await bcrypt.hash(password, 10);

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

  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: JWT_CONFIG.EXPIRY }
  );

  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000).toISOString();
  const refreshToken = generateRefreshToken(user._id);

  return { token, expiresAt, refreshToken, user };
};

const loginUser = async (email, password) => {
  // +password needed because the field has select:false in the schema
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) {
    throw new AuthError("Invalid email or password", 401, ERROR_CODES.INVALID_CREDENTIALS);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AuthError("Invalid email or password", 401, ERROR_CODES.INVALID_CREDENTIALS);
  }

  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: JWT_CONFIG.EXPIRY }
  );

  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000).toISOString();
  const refreshToken = generateRefreshToken(user._id);

  return { token, expiresAt, refreshToken, user };
};

const getProfile = async (id) => {
  const user = await User.findById(id).select("-password");
  if (!user) {
    throw new AuthError("User not found", 404, ERROR_CODES.USER_NOT_FOUND);
  }
  return user;
};

const updateProfile = async (id, updates) => {
  delete updates.password;
  delete updates.email;
  delete updates.role;

  Object.keys(updates).forEach((key) => {
    if (typeof updates[key] === "string") {
      updates[key] = updates[key].trim();
    }
  });

  const user = await User.findByIdAndUpdate(id, updates, { new: true }).select("-password");
  if (!user) {
    throw new AuthError("User not found", 404, ERROR_CODES.USER_NOT_FOUND);
  }
  return user;
};

const searchAlumni = async (filters, page, limit) => {
  const validLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
  const total = await User.countDocuments(filters);
  const alumni = await User.find(filters)
    .select("-password")
    .limit(validLimit * 1)
    .skip((page - 1) * validLimit)
    .sort({ createdAt: -1 })
    .lean();

  return { alumni, total, page, validLimit };
};

const getAlumni = async (id) => {
  const alumni = await User.findById(id).select("-password");
  if (!alumni || alumni.role !== USER_ROLES.ALUMNI) {
    throw new AuthError("Alumni not found", 404, ERROR_CODES.USER_NOT_FOUND);
  }
  return alumni;
};

const refreshAccessToken = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, REFRESH_SECRET);
  } catch (err) {
    const code = err.name === "TokenExpiredError" ? ERROR_CODES.TOKEN_EXPIRED : ERROR_CODES.INVALID_TOKEN;
    const msg  = err.name === "TokenExpiredError" ? "Refresh token has expired" : "Invalid refresh token";
    throw new AuthError(msg, 401, code);
  }

  if (decoded.type !== "refresh") {
    throw new AuthError("Invalid refresh token", 401, ERROR_CODES.INVALID_TOKEN);
  }

  const user = await User.findById(decoded.id).select("-password");
  if (!user) {
    throw new AuthError("User not found", 404, ERROR_CODES.USER_NOT_FOUND);
  }

  const newAccessToken = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: JWT_CONFIG.EXPIRY }
  );

  const decodedNew = jwt.decode(newAccessToken);
  const expiresAt = new Date(decodedNew.exp * 1000).toISOString();

  return { token: newAccessToken, expiresAt };
};

module.exports = {
  AuthError,
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  searchAlumni,
  getAlumni,
  refreshAccessToken,
};
