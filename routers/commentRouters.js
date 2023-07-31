const express = require("express");

const {
  makeComment,
  deleteComment,
} = require("../controllers/commentController");

const router = express.Router({ mergeParams: true });

router.route("/").post(makeComment).delete(deleteComment);

module.exports = router;
