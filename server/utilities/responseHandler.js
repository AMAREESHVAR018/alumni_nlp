/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} status - HTTP status code
 */
const sendSuccess = (res, data, message = "Success", status = 200) => {
  res.status(status).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} items - Data items
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {string} message - Success message
 */
const sendPaginated = (
  res,
  items,
  total,
  page = 1,
  limit = 10,
  message = "Success"
) => {
  const pages = Math.ceil(total / limit);
  res.status(200).json({
    success: true,
    message,
    data: items,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages,
      hasNextPage: page < pages,
      hasPrevPage: page > 1,
    },
  });
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {string} code - Error code
 */
const sendError = (res, message, status = 500, code = "ERROR") => {
  res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
  });
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array|string} errors - Validation errors
 */
const sendValidationError = (res, errors) => {
  const errorList = Array.isArray(errors) ? errors : [errors];
  res.status(400).json({
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: errorList,
    },
  });
};

module.exports = {
  sendSuccess,
  sendPaginated,
  sendError,
  sendValidationError,
};
