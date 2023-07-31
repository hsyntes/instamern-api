const express = require("express");
const { getStories, postStory } = require("../controllers/storyController");
const multer = require("multer");
const { verifyToken } = require("../controllers/authController");

const router = express.Router();
const storage = multer({ storage: multer.memoryStorage() });

router.get("/", getStories);

router.use(verifyToken);

router.post("/upload", storage.single("story"), postStory);

module.exports = router;
