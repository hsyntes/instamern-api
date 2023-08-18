const User = require("../models/User");
const Email = require("../classes/Email");
const ErrorProvider = require("../classes/ErrorProvider");
const jsonwebtoken = require("jsonwebtoken");
const validator = require("validator");
const crypto = require("crypto");

// * Generating and saving token
const sendToken = (res, statusCode, user, message) => {
  const token = jsonwebtoken.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.cookie("jsonwebtoken", token, {
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  user.password = undefined;
  user.active = undefined;

  res.status(statusCode).json({
    status: "success",
    message,
    token,
    data: {
      user,
    },
  });
};

// * Signup
exports.signup = async (req, res, next) => {
  try {
    const user = await User.create({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    try {
      await new Email(user, "https://instamern.netlify.app/").sendWelcome();
    } catch (e) {
      // Ugnore email verification error and proceed
      console.error(`Email verification error: ${e}`);
    }

    sendToken(
      res,
      201,
      user,
      "You've signed up successfully. Welcome to InstaMERN!"
    );
  } catch (e) {
    next(e);
  }
};

// * Login
exports.login = async (req, res, next) => {
  try {
    if (!req.body.username || !req.body.password)
      return next(
        new ErrorProvider(
          403,
          "fail",
          "Please type your username and password."
        )
      );

    const { username } = req.body;

    const user = await User.findOne({ username }).select("+password +active");

    if (!user)
      return next(
        new ErrorProvider(
          404,
          "fail",
          "User not found. You can signup with that user."
        )
      );

    if (!(await user.isPasswordCorrect(req.body.password, user.password)))
      return next(new ErrorProvider(401, "fail", "Password doesn't match."));

    if (!user.active) user.active = true;

    await user.save({ validateBeforeSave: false });

    sendToken(res, 200, user, `Welcome back ${user.username}!`);
  } catch (e) {
    next(e);
  }
};

// * Sending reset link to users' email
exports.forgotPassword = async (req, res, next) => {
  try {
    if (!req.body.email)
      return next(
        new ErrorProvider(
          403,
          "fail",
          "Please type your email address to reset your password."
        )
      );

    const { email } = req.body;

    if (!validator.isEmail(email))
      return next(
        new ErrorProvider(403, "fail", "Please type a valid email address.")
      );

    const user = await User.findOne({ email });

    if (!user)
      return next(
        new ErrorProvider(404, "fail", "User not found with that email.")
      );

    const token = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
      await new Email(
        user,
        // `${req.protocol}://${req.get("host")}/reset-password/${token}`
        `https://instamern.netlify.app/reset-password/${token}`
      ).sendResetPassword();

      res.status(200).json({
        status: "success",
        message: "The password reset link has been sent to your email address.",
      });
    } catch (e) {
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpiresIn = undefined;

      next(
        new ErrorProvider(
          500,
          "fail",
          "Password reset link couldn't sent to your email address. Try again later."
        )
      );
    }
  } catch (e) {
    next(e);
  }
};

// * Resetting password by the reset link
exports.resetPassword = async (req, res, next) => {
  try {
    if (!req.params.token)
      return next(
        new ErrorProvider(
          404,
          "fail",
          "Page not found or the reset link has expired."
        )
      );

    const user = await User.findOne({
      passwordResetToken: crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex"),

      passwordResetTokenExpiresIn: { $gt: Date.now() },
    });

    if (!user)
      return next(
        new ErrorProvider(
          404,
          "fail",
          "The password reset link has expired or has broken. Please try again later."
        )
      );

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiresIn = undefined;

    await user.save();

    res.clearCookie("jsonwebtoken");

    sendToken(res, 200, user, "Your password has been updated successfully.");
  } catch (e) {
    next(e);
  }
};

// * Verifying token
exports.verifyToken = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    )
      token = req.headers.authorization.split("Bearer")[1].trim();
    else
      return next(
        new ErrorProvider(401, "fail", "You're not logged in. Please login.")
      );

    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("+password +active");

    if (!user)
      return next(
        new ErrorProvider(401, "fail", "You're not logged in. Please login.")
      );

    // * Grant access
    req.user = user;

    next();
  } catch (e) {
    next(e);
  }
};

exports.getCurrentUser = async (req, res, next) => {
  try {
    res.status(200).json({
      status: "success",
      data: {
        user: req.user,
      },
    });
  } catch (e) {
    next(e);
  }
};

// * Logout the current user
exports.logout = (req, res, next) => {
  try {
    if (!req.user)
      return next(new ErrorProvider(404, "fail", "Yo're already logged out."));

    res.clearCookie("jsonwebtoken");

    res.status(200).json({
      status: "success",
      message: "You're logged out successfully.",
      data: null,
    });
  } catch (e) {
    next(e);
  }
};

// * Updating the current user's password
exports.changePassword = async (req, res, next) => {
  try {
    if (!req.body.currentPassword)
      return next(
        new ErrorProvider(403, "fail", "Please confirm your current password.")
      );

    if (!req.body.password || !req.body.passwordConfirm)
      return next(
        new ErrorProvider(403, "fail", "Please set your new password.")
      );

    if (
      !(await req.user.isPasswordCorrect(
        req.body.currentPassword,
        req.user.password
      ))
    )
      return next(
        new ErrorProvider(401, "fail", "Your current password doesn't match.")
      );

    if (await req.user.isPasswordCorrect(req.body.password, req.user.password))
      return next(
        new ErrorProvider(
          409,
          "fail",
          "Your new password cannot be the same as your previous password."
        )
      );

    req.user.password = req.body.password;
    req.user.passwordConfirm = req.body.passwordConfirm;

    await req.user.save();

    res.clearCookie("jsonwebtoken");

    sendToken(
      res,
      200,
      req.user,
      "Your password has been updated successfully."
    );
  } catch (e) {
    next(e);
  }
};

// * Change email address the current user
exports.changeEmail = async (req, res, next) => {
  try {
    if (!req.body.currentPassword)
      return next(
        new ErrorProvider(403, "fail", "Please confirm your current password.")
      );

    if (
      !(await req.user.isPasswordCorrect(
        req.body.currentPassword,
        req.user.password
      ))
    )
      return next(
        new ErrorProvider(401, "fail", "Your current password doesn't match.")
      );

    if (!req.body.email)
      return next(
        new ErrorProvider(403, "fail", "Please set your new email address.")
      );

    const { email } = req.body;

    if (!validator.isEmail(email))
      return next(
        new ErrorProvider(403, "fail", "Please type a valid email address.")
      );

    if (email === req.user.email)
      return next(
        new ErrorProvider(
          403,
          "fail",
          "That email address is already the same as the existing one."
        )
      );

    req.user.email = email;

    await req.user.save({ validateBeforeSave: false });

    res.clearCookie("jsonwebtoken");

    sendToken(
      res,
      200,
      req.user,
      "Your email address has been changed successfully."
    );
  } catch (e) {
    next(e);
  }
};
