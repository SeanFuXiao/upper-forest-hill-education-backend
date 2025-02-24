const express = require("express");
const {
  updateUserRole,
  getAllUsers,
  getUserById,
} = require("../controllers/userController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { deleteUser } = require("../controllers/userController");
const { getUserProfile } = require("../controllers/userController");
const { updateUserPassword } = require("../controllers/userController");

const router = express.Router();

router.get("/", authenticate, authorize(["admin"]), getAllUsers);

router.get("/:id", authenticate, getUserById);

router.delete("/:id", authenticate, authorize(["admin"]), deleteUser);

router.patch("/:id/role", authenticate, authorize(["admin"]), updateUserRole);

router.get(
  "/me",
  authenticate,
  (req, res, next) => {
    console.log("Inside /me route");
    next();
  },
  getUserProfile
);

router.patch("/:id/password", authenticate, updateUserPassword);

module.exports = router;
