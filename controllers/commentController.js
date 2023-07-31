const ErrorProvider = require("../classes/ErrorProvider");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const User = require("../models/User");

// * Making a comment
exports.makeComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!id)
      return next(
        new ErrorProvider(403, "fail", "Please specify a post to make comment.")
      );

    const post = await Post.findById(id);

    if (!post)
      return next(
        new ErrorProvider(404, "fail", "Not found any posts to comment.")
      );

    await Comment.create({
      comment,
      commentedBy: req.user._id,
      commentedPost: post._id,
    });

    const user = await User.findById(post.postedBy);

    user.notifications.push({
      notifiedBy: req.user._id,
      notifiedTo: user._id,
      notification: "commented your photo.",
    });

    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      status: "success",
      message: "Commented!",
    });
  } catch (e) {
    next(e);
  }
};

// * Deleting a comment
exports.deleteComment = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (!post)
      return next(
        new ErrorProvider(404, "fail", "Not found any posts to delete.")
      );

    if (!postId)
      return next(
        new ErrorProvider(
          403,
          "fail",
          "Please specify a post to delete comment."
        )
      );

    await Comment.findOneAndDelete({
      commentedBy: req.user._id,
      commentedPost: post._id,
    });

    res.status(204).json({
      status: "success",
      message: "Comment has been deleted successfully.",
      data: null,
    });
  } catch (e) {
    next(e);
  }
};
