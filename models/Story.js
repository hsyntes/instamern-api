const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    photo: {
      type: String,
      required: [true, "A story must have one picture."],
    },

    storiedBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { versionKey: false }
);

const Story = mongoose.model("Story", storySchema);

module.exports = Story;
