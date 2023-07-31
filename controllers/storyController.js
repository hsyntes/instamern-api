const sharp = require("sharp");
const ErrorProvider = require("../classes/ErrorProvider");
const Story = require("../models/Story");
const AWS = require("../aws-config");

exports.getStories = async (req, res, next) => {
  //   const stories = await Story.find().limit(15);

  const stories = await Story.aggregate([
    {
      $group: {
        _id: "$storiedBy",
        stories: {
          $push: {
            photo: "$photo",
            storyId: "$_id",
          },
        },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    results: stories.length,
    data: {
      stories,
    },
  });
};

exports.postStory = async (req, res, next) => {
  try {
    if (!req.file)
      return next(
        new ErrorProvider(403, "fail", "Couldn't any story to share.")
      );

    // * Resizing story
    const photo = await sharp(req.file.buffer)
      .resize({
        width: 1080,
        height: 1920,
        fit: "contain",
      })
      .toFormat("jpg")
      .jpeg({ quality: 70 })
      .toBuffer();

    // * AWS Parameters
    const params = {
      Bucket: process.env.AWS_BUCKET,
      ACL: process.env.AWS_ACL,
      Key: `stories/${req.user.username}/${new Date(
        Date.now()
      ).toISOString()}.jpg`,
      Body: photo,
    };

    const s3 = new AWS.S3();
    try {
      s3.upload(params, async (err, data) => {
        if (err)
          return next(new ErrorProvider(422, "fail", "Couldn't storied."));

        const url = data.Location;

        const story = await Story.create({
          photo: url,
          storiedBy: req.user._id,
        });

        res.status(201).json({
          status: "success",
          message: "Story has been uploaded.",
          data: {
            story,
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
