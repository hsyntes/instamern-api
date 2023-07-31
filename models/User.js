const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const generateResetToken = require("../utils/generateResetToken");

// * User Model
const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      minlength: [2, "Firstname cannot be shorter than 2 characters."],
      maxlength: [16, "Firstname cannot be longer than 16 characters."],
      required: [true, "Firstname is required."],
      trim: true,
    },

    lastname: {
      type: String,
      minlength: [2, "Lastname cannot be shorter than 2 characters."],
      maxlength: [16, "Lastname cannot be longer than 16 characters."],
      required: [true, "Lastname is required."],
      trim: true,
    },

    username: {
      type: String,
      minlength: [3, "@username cannot be shorter than 3 characters."],
      maxlength: [12, "@username cannot be longer than 12 characters."],
      required: [true, "@username is required."],
      trim: true,
      unique: true,
    },

    email: {
      type: String,
      required: [true, "Email address is required."],
      validate: [validator.isEmail, "Invalid email address."],
      trim: true,
      unique: true,
    },

    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [8, "Password cannot be shorter than 8 characters."],
      maxlength: [24, "Password cannot be longer than 24 characters."],
      select: false,
    },

    passwordConfirm: {
      type: String,
      required: [true, "Please confirm your password."],
      validate: {
        validator: function (value) {
          return value === this.password;
        },

        message: "Password doesn't match.",
      },
    },

    photo: String,

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        select: false,
      },
    ],

    followings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        select: false,
      },
    ],

    bio: {
      type: String,
      default: "",
    },

    active: {
      type: Boolean,
      default: true,
      select: false,
    },

    notifications: [
      {
        notifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          required: [true, "A notification must belong to a user."],
        },

        notifiedTo: {
          type: mongoose.Schema.Types.ObjectId,
          required: [true, "A notification must belong to a user."],
        },

        notification: {
          type: String,
          required: [true, "A notification must include a message."],
        },

        new: {
          type: Boolean,
          default: true,
        },
      },
    ],

    passwordResetToken: String,
    passwordResetTokenExpiresIn: Date,

    emailResetToken: String,
    emailResetTokenExpiresIn: Date,
  },
  {
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// * Virtual populating
userSchema.virtual("posts", {
  ref: "Post",
  foreignField: "postedBy",
  localField: "_id",
});

userSchema.virtual("stories", {
  ref: "Story",
  foreignField: "storiedBy",
  localField: "_id",
});

// * Document Middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

// * Query Middleware
userSchema.pre(/^find/, function (next) {
  this.populate("stories");

  next();
});

userSchema.pre("find", function (next) {
  this.find({ active: { $ne: false } });

  next();
});

userSchema.pre("findOne", function (next) {
  this.populate({ path: "posts" });
  // this.populate("stories");
  this.find().select("+followings +followers");

  next();
});

// * Aggregation Middleware
userSchema.pre("aggregate", function (next) {
  const pipeline = this.pipeline();

  const matchStage = {
    $match: {
      active: { $ne: false },
    },
  };

  const postsLookupStage = {
    $lookup: {
      from: "posts",
      foreignField: "postedBy",
      localField: "_id",
      as: "posts",
    },
  };

  const storiesLookup = {
    $lookup: {
      from: "stories",
      foreignField: "storiedBy",
      localField: "_id",
      as: "stories",
    },
  };

  pipeline.unshift(matchStage, postsLookupStage, storiesLookup);

  next();
});

// * Instance Methods
userSchema.methods.isPasswordCorrect = async (candidate, password) =>
  await bcrypt.compare(candidate, password);

userSchema.methods.generatePasswordResetToken = function () {
  const { token, resetToken, resetTokenExpiresIn } = generateResetToken();

  this.passwordResetToken = resetToken;
  this.passwordResetTokenExpiresIn = resetTokenExpiresIn;

  return token;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
