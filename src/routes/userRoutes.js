const express = require("express");
const {
  updateUserRole,
  getAllUsers,
  getUserById,
} = require("../controllers/userController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { deleteUser } = require("../controllers/userController");

const router = express.Router();

router.get("/", authenticate, authorize(["admin"]), getAllUsers);

router.get("/:id", authenticate, getUserById);

router.delete("/:id", authenticate, authorize(["admin"]), deleteUser);

router.patch("/:id/role", authenticate, authorize(["admin"]), updateUserRole);

module.exports = router;
