const ErrorProvider = require("../classes/ErrorProvider");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const sharp = require("sharp");
const AWS = require("../aws-config");
const User = require("../models/User");
const mongoose = require("mongoose");

// * Getting all posts
exports.getPosts = async (req, res, next) => {
  try {
    const { limit } = req.body;

    const posts = await Post.aggregate([
      {
        $limit: limit || 15,
      },
      {
        $sort: { postedAt: -1 },
      },
      {
        $project: {
          // likes: 0,
          comments: 0,
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      results: posts.length,
      data: {
        posts,
      },
    });
  } catch (e) {
    next(e);
  }
};

// * Getting specific post by post id
exports.getPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) return next(new ErrorProvider("Please specify a post to view."));

    // const post = await Post.aggregate([
    //   {
    //     $match: { _id: new mongoose.Types.ObjectId(id) },
    //   },
    // ]);

    const post = await Post.findById(id);

    if (!post)
      return next(new ErrorProvider(404, "fail", "The post no longer active."));

    res.status(200).json({
      status: "success",
      data: {
        post,
      },
    });
  } catch (e) {
    next(e);
  }
};

// * Upload post
exports.uploadPost = async (req, res, next) => {
  try {
    if (!req.file)
      return next(
        new ErrorProvider(403, "fail", "No post photo found to upload.")
      );

    // * Resizing the post photo
    const photo = await sharp(req.file.buffer)
      .resize({
        width: 1080,
        height: 1350,
        fit: "contain",
      })
      .toFormat("jpg")
      .jpeg({ quality: 70 })
      .toBuffer();

    // * AWS parameters
    const params = {
      Bucket: process.env.AWS_BUCKET,
      // ACL: process.env.AWS_ACL,
      Key: `posts/${req.user.username}/${new Date(
        Date.now()
      ).toISOString()}.jpg`,
      Body: photo,
    };

    // * Uploading the post photo to the AWS Cloud
    const s3 = new AWS.S3();
    try {
      s3.upload(params, async (err, data) => {
        if (err)
          return next(
            new ErrorProvider(422, "fail", "Post couldn't uploaded.")
          );

        const url = data.Location;

        const post = await Post.create({
          caption: req.body.caption,
          photo: url,
          postedBy: req.user._id,
        });

        res.status(201).json({
          status: "success",
          message: "Your post has been uploaded successfully.",
          data: {
            post,
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

// * Like a post
exports.likePost = async (req, res, next) => {
  try {
    if (!req.params.id)
      return next(
        new ErrorProvider(403, "fail", "Please specify a post to like.")
      );

    const { id } = req.params;

    // * Starting the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    const post = await Post.findById(id).session(session);

    if (!post)
      return next(new ErrorProvider(404, "fail", "Not found posts to like."));

    if (post.likes.includes(req.user._id)) {
      await Post.findByIdAndUpdate(id, {
        $pull: { likes: req.user._id },
      });

      return res.status(200).json({
        status: "success",
        message: "Unliked.",
      });
    } else {
      await Post.findByIdAndUpdate(id, {
        $addToSet: { likes: req.user._id },
      });

      const user = await User.findById(post.postedBy);

      user.notifications.push({
        notifiedBy: req.user._id,
        notifiedTo: user._id,
        notification: "liked your photo.",
      });

      await user.save({ validateBeforeSave: false });

      return res.status(200).json({
        status: "success",
        message: "Liked!",
      });
    }
  } catch (e) {
    next(e);
  }
};

// * Updating post
exports.updatePost = async (req, res, next) => {
  try {
    if (req.body.photo)
      return next(
        new ErrorProvider(403, "fail", "You cannot change the post photo.")
      );

    if (req.body.postedBy)
      return next(
        new ErrorProvider(403, "fail", "You cannot change post owner.")
      );

    if (req.body.postedAt)
      return next(
        new ErrorProvider(403, "fail", "You cannot change post's date.")
      );

    const post = await Post.findById(req.params.postId);

    if (!post)
      return next(new ErrorProvider(404, "fail", "Not faound post to update."));

    if (!post.postedBy.equals(req.user._id))
      return next(
        new ErrorProvider(403, "fail", "You cannot update some else's post.")
      );

    if (!req.body.caption)
      return next(
        new ErrorProvider(403, "fail", "Please set a new caption for the post.")
      );

    const { caption } = req.body;

    post.caption = caption;
    await post.save();

    res.status(200).json({
      status: "success",
      message: "Your post has been updated successfully.",
      data: null,
    });
  } catch (e) {
    next(e);
  }
};

// * Deleting post
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post)
      return next(new ErrorProvider(404, "fail", "Not found post to delete."));

    if (!post.postedBy.equals(req.user._id))
      return next(
        new ErrorProvider(403, "fail", "You cannot delete someone else's post.")
      );

    // * AWS Paremeters
    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: `posts/${req.user.username}/${post.photo
        .split("/")
        .at(-1)
        .replaceAll("%", ":")
        .replaceAll("3A", "")}`,
    };

    // * Deleting post's photo from AWS Cloud
    const s3 = new AWS.S3();
    s3.deleteObject(params, async (err) => {
      if (err)
        return next(
          new ErrorProvider(422, "fail", "Couldn't delete your post.")
        );

      await Comment.deleteMany({ commentedPost: post._id });
      await Post.findByIdAndDelete(post._id);

      res.status(204).json({
        stauts: "success",
        message: "Your post has been deleted succesfully.",
        data: null,
      });
    });
  } catch (e) {
    next(e);
  }
};
