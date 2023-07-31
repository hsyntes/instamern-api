const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    caption: {
      type: String,
      maxlength: [256, "The caption text must be 256 characters the most."],
      trim: true,
    },

    photo: {
      type: String,
      required: [true, "A post must have one picture"],
    },

    // * Referencing
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],

    postedAt: {
      type: Date,
      default: new Date(Date.now()),
    },
  },
  {
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// * Virtual Populating
postSchema.virtual("comments", {
  ref: "Comment",
  foreignField: "commentedPost",
  localField: "_id",
});

// * Query Middleware
postSchema.pre("findOne", function (next) {
  this.populate({ path: "comments", select: "-_id" });

  next();
});

// * Aggregation Middleware
postSchema.pre("aggregate", function (next) {
  this.pipeline().unshift(
    {
      $lookup: {
        from: "comments",
        foreignField: "commentedPost",
        localField: "_id",
        as: "comments",
      },
    },
    {
      $addFields: {
        like: { $size: "$likes" },
        comment: { $size: "$comments" },
      },
    }
  );

  next();
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
