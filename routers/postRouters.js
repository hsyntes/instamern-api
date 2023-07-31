const express = require("express");
const multer = require("multer");

const commentRouters = require("./commentRouters");

const {
  uploadPost,
  deletePost,
  getPosts,
  getPost,
  updatePost,
  likePost,
  unlikePost,
} = require("../controllers/postController");

const { verifyToken } = require("../controllers/authController");

const router = express.Router();
const storage = multer({ storage: multer.memoryStorage() });

router.get("/", getPosts);
router.get("/:id", getPost);

// * Protect after this
router.use(verifyToken);

router.post("/upload", storage.single("post"), uploadPost);
router.post("/like/:id", likePost);
router.post("/update/:id", updatePost);
router.delete("/delete/:id", deletePost);

// * Nested Routers
router.use("/comments/:id", commentRouters);

module.exports = router;
