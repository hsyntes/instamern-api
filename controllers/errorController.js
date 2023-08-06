const ErrorProvider = require("../classes/ErrorProvider");
const { JsonWebTokenError, TokenExpiredError } = require("jsonwebtoken");

// ! 409: Duplicate
const uniqueError = (err) => {
  if (
    err.keyPattern.hasOwnProperty("username") ||
    err.keyPattern.hasOwnProperty("email")
  )
    return new ErrorProvider(409, "fail", "This user already exists.");

  if (
    err.keyPattern.hasOwnProperty("user") &&
    err.keyPattern.hasOwnProperty("post")
  )
    return new ErrorProvider(409, "fail", "You cannot like a post twice.");

  return new ErrorProvider(409, "fail", err.message);
};

// ! 403: Forbidden
const validationError = (err) => {
  const messages = err.message.split(",");

  const message = messages
    .map((message, index) => message.split(":").at(index === 0 ? 2 : 1))
    .join("")
    .trim();

  return new ErrorProvider(403, "fail", message);
};

// ! 401: Unauthorized
const jsonWebTokenError = (err) =>
  new ErrorProvider(401, "fail", "Authorization failed. Please login.");

// ! 401: Unauthorized
const tokenExpiredError = () =>
  new ErrorProvider(
    401,
    "fail",
    "Authentication has expired. Please login again."
  );

// * Error Handler
module.exports = async (err, req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    if (err.code === 11000) err = uniqueError(err);
    if (err.name === "ValidationError") err = validationError(err);
    if (err instanceof JsonWebTokenError) err = jsonWebTokenError();
    if (err instanceof TokenExpiredError) err = tokenExpiredError();
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });

  next();
};
