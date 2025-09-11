const express = require("express");
const { register, login, getUserData, logout, getAllUsers, updateUser, deleteUser } = require("../controllers/userController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { requireAdmin } = require("../middlewares/adminAuth");
const router = express.Router();


// Authentication Routes
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").post(isVerifiedUser, logout)

// User data (cho user hiện tại)
router.route("/").get(isVerifiedUser, getUserData);

// Admin routes (quản lý nhân viên)
router.route("/all").get(isVerifiedUser, requireAdmin, getAllUsers);
router.route("/:id").put(isVerifiedUser, requireAdmin, updateUser);
router.route("/:id").delete(isVerifiedUser, requireAdmin, deleteUser);

module.exports = router;