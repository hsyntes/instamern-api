const User = require("../models/User");
const ErrorProvider = require("../classes/ErrorProvider");
const sharp = require("sharp");
const AWS = require("../aws-config");
const filterBody = require("../utils/filterBody");
const Post = require("../models/Post");
const Comment = require("../models/Comment");

// * Getting random 5 users
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.aggregate([
      {
        $sample: {
          size: 5,
        },
      },
      {
        $project: {
          active: 0,
          posts: 0,
          followers: 0,
          followings: 0,
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (e) {
    next(e);
  }
};

// * Getting specific user by id
exports.getUserById = async (req, res, next) => {
  try {
    if (!req.params.id)
      return next(
        new ErrorProvider(
          403,
          "fail",
          "Please specify a user id to reach user."
        )
      );

    const { id } = req.params;

    const user = await User.findById(id).select("+active");

    if (!user) return next(new ErrorProvider(404, "fail", "User not found."));

    if (!user.active)
      return next(
        new ErrorProvider(404, "fail", "That user is no longer active.")
      );

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (e) {
    next(e);
  }
};

// * Getting specific user by username
exports.getUserByUsername = async (req, res, next) => {
  try {
    if (!req.params.username)
      return next(
        new ErrorProvider(
          403,
          "fail",
          "Please specify a username to reach user."
        )
      );

    const { username } = req.params;

    const user = await User.findOne({ username }).select("+active");

    if (!user) return next(new ErrorProvider(404, "fail", "User not found."));

    if (!user.active)
      return next(
        new ErrorProvider(404, "fail", "That user is no longer active.")
      );

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (e) {
    next(e);
  }
};

// * Following a user
exports.follow = async (req, res, next) => {
  try {
    if (!req.params.username)
      return next(
        new ErrorProvider(
          403,
          "fail",
          "Please specify a username that you want to follow."
        )
      );

    const { username } = req.params;

    if (username === req.user.username)
      return next(
        new ErrorProvider(403, "fail", "You cannot follow yourself.")
      );

    const user = await User.findOneAndUpdate(
      { username },
      {
        $addToSet: { followers: req.user._id },
      }
    );

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { followings: user._id },
    });

    user.notifications.push({
      notifiedBy: req.user._id,
      notifiedTo: user._id,
      notification: "followed you.",
    });

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      message: `Now, you are following ${user.username}`,
    });
  } catch (e) {
    next(e);
  }
};

// * Unfollowing a user
exports.unfollow = async (req, res, next) => {
  try {
    if (!req.params.username)
      return next(
        new ErrorProvider(
          403,
          "fail",
          "Please specify a username that you want to follow."
        )
      );

    const { username } = req.params;

    if (username === req.user.username)
      return next(
        new ErrorProvider(403, "fail", "You cannot follow yourself.")
      );

    const user = await User.findOneAndUpdate(
      { username },
      {
        $pull: { followers: req.user._id },
      }
    );

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { followings: user._id },
    });

    res.status(200).json({
      status: "success",
      message: `Now, you aren't following ${user.username}`,
    });
  } catch (e) {
    next(e);
  }
};

// * Uploading user's profile photos
exports.uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file)
      return next(new ErrorProvider(403, "fail", "No photo found to upload."));

    // * Resizing photo
    const photo = await sharp(req.file.buffer)
      .resize({
        width: 320,
        height: 320,
        fit: "cover",
      })
      .toFormat("png")
      .png({ quality: 75 })
      .toBuffer();

    // * AWS parameters
    const params = {
      Bucket: process.env.AWS_BUCKET,
      // ACL: process.env.AWS_ACL,
      Key: `users/${req.user.username}.png`,
      Body: photo,
    };

    // * Uploading to the AWS Cloud
    const s3 = new AWS.S3();

    try {
      await s3.headObject({ Bucket: params.Bucket, Key: params.Key }).promise();
      // If the object exists, delete it before uploading the new photo
      await s3
        .deleteObject({ Bucket: params.Bucket, Key: params.Key })
        .promise();
    } catch (e) {
      // If the object doesn't exist or there's an error during the delete operation, ignore it
      next(e);
    }

    try {
      s3.upload(params, async (err, data) => {
        if (err)
          // ! 422: Unprocessable Entity
          return next(
            new ErrorProvider(422, "fail", "Couldn't uploaded photo")
          );

        const url = data.Location;

        // * Updating MongoDB Document
        req.user.photo = url;
        await req.user.save({ validateBeforeSave: false });

        res.status(200).json({
          status: "success",
          message: "Profile photo has been updated successfully.",
          data: {
            url,
          },
        });
      });
    } catch (e) {
      next(e);
    }
  } catch (e) {
    next(e);
  }
};

// * Remove photo
exports.removePhoto = async (req, res, next) => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: `users/${req.user.username}.png`,
    };

    const s3 = new AWS.S3();

    // Check if the object exists before attempting to delete it
    try {
      await s3.headObject(params).promise();
    } catch (err) {
      if (err.code === "NotFound") {
        // If the object doesn't exist, return success response without deleting
        return res.status(200).json({
          status: "success",
          message: "No profile picture found. Nothing to delete.",
          data: null,
        });
      }
      // If there's an error other than NotFound, handle it and return an error response
      return next(
        new ErrorProvider(
          500,
          "fail",
          "Failed to check profile picture existence."
        )
      );
    }

    // Object exists, proceed with deletion
    try {
      await s3.deleteObject(params).promise();
    } catch (deleteErr) {
      return next(
        new ErrorProvider(500, "fail", "Error deleting your profile picture.")
      );
    }

    req.user.photo = undefined;
    await req.user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      message: "Your profile picture has been removed successfully.",
      data: null,
    });
  } catch (e) {
    next(e);
  }
};

// * Search users
exports.searchUsers = async (req, res, next) => {
  try {
    if (!req.params.username)
      return next(
        new ErrorProvider(
          403,
          "fail",
          "Please type a username to search users."
        )
      );

    const { username } = req.params;

    const users = await User.find({
      username: { $regex: username, $options: "i" },
    });

    if (!users)
      return next(new ErrorProvider(404, "fail", "Not found any users."));

    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (e) {
    next(e);
  }
};

// * Updating the current user
exports.updateMe = async (req, res, next) => {
  try {
    if (
      req.body.email ||
      req.body.password ||
      req.body.passwordConfirm ||
      req.body.photo ||
      req.body.active
    )
      return next(
        new ErrorProvider(403, "fail", "You cannot update these fields.")
      );

    const filteredBody = filterBody(req.body, req.user);

    await User.findByIdAndUpdate(req.user._id, filteredBody, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      message: "Your profile has been updated successfully.",
    });
  } catch (e) {
    next(e);
  }
};

// * Deactivating the current user
exports.deactivateMe = async (req, res, next) => {
  try {
    if (!req.user.active)
      return next(
        new ErrorProvider(403, "fail", "Your account is already inactive.")
      );

    if (!req.body.currentPassword)
      return next(
        new ErrorProvider(403, "fail", "Please confirm your password.")
      );

    if (
      !(await req.user.isPasswordCorrect(
        req.body.currentPassword,
        req.user.password
      ))
    )
      return next(new ErrorProvider(401, "fail", "Password doesn't match."));

    req.user.active = false;
    await req.user.save({ validateBeforeSave: false });

    res.clearCookie("jsonwebtoken");

    res.status(200).json({
      status: "success",
      message:
        "Your account has been deactivated successfully. To activate again, please login.",
    });
  } catch (e) {
    next(e);
  }
};

// * Deleting the current user
exports.deleteMe = async (req, res, next) => {
  try {
    if (!req.body.currentPassword)
      return next(
        new ErrorProvider(403, "fail", "Please confirm your password.")
      );

    if (
      !(await req.user.isPasswordCorrect(
        req.body.currentPassword,
        req.user.password
      ))
    )
      return next(new ErrorProvider(401, "fail", "Password doesn't match."));

    const s3 = new AWS.S3();

    const user = await User.findById(req.user._id);

    if (!user)
      return next(new ErrorProvider(403, "fail", "Not found user to delete."));

    // * Removing the user's photo from the AWS Cloud

    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: `users/${user.username}.png`,
    };

    s3.deleteObject(params, (err) => {
      if (err)
        return next(
          new ErrorProvider(422, "fail", "Error deleting your profile picture.")
        );
    });

    // * Removing the user's post
    await Post.deleteMany({ postedBy: user._id });

    // * Removing the posts' photos from the AWS Cloud

    const folderParams = {
      Bucket: process.env.AWS_BUCKET,
      Prefix: `posts/${user.username}`,
    };

    const objects = await s3.listObjectsV2(folderParams).promise();

    if (objects?.Contents.length !== 0) {
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET,
        Delete: {
          Objects: objects.Contents.map((object) => ({ Key: object.Key })),
        },
      };

      s3.deleteObjects(deleteParams, (err) => {
        if (err)
          return next(
            new ErrorProvider(403, "fail", "Couldn't delete user's posts.")
          );
      });
    }

    // * Removing posts' comments
    await Comment.deleteMany({ commentedBy: user._id });

    // * Removing user from other users' followers/following lists
    await User.updateMany(
      {
        $or: [
          { followers: { $elemMatch: { $eq: user._id } } },
          { followings: { $elemMatch: { $eq: user._id } } },
        ],
      },
      { $pull: { followers: user._id, followings: user._id } }
    );

    // * Finally deleting the user
    await User.findByIdAndDelete(user._id);

    res.clearCookie("jsonwebtoken");

    res.status(204).json({
      status: "success",
      message: "Your account has been deleted successfully.",
      data: null,
    });
  } catch (e) {
    next(e);
  }
};
