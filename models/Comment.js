const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    comment: {
      type: String,
      required: [true, "Comment cannot be blank."],
    },

    commentedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    commentedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  },
  { versionKey: false }
);

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
