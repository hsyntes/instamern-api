const express = require("express");
const multer = require("multer");

const {
  getUsers,
  getUserById,
  getUserByUsername,
  follow,
  unfollow,
  updateMe,
  uploadPhoto,
  removePhoto,
  deactivateMe,
  deleteMe,
  searchUsers,
} = require("../controllers/userController");

const {
  signup,
  login,
  verifyToken,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  changeEmail,
  changePassword,
} = require("../controllers/authController");

const router = express.Router();
const storage = multer({ storage: multer.memoryStorage() });

router.get("/", getUsers);
router.get("/id/:id", getUserById);
router.get("/username/:username", getUserByUsername);
router.get("/search/:username", searchUsers);
router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);

// * Protect after this
router.use(verifyToken);

router.get("/authorization/current-user", getCurrentUser);
router.post("/follow/:username", follow);
router.post("/unfollow/:username", unfollow);
router.post("/upload", storage.single("photo"), uploadPhoto);
router.post("/remove", removePhoto);
router.post("/logout", logout);
router.patch("/update", updateMe);
router.patch("/change-email", changeEmail);
router.patch("/change-password", changePassword);
router.delete("/deactivate", deactivateMe);
router.delete("/delete", deleteMe);

module.exports = router;
