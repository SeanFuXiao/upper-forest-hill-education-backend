const express = require("express");
const {
  registerUser,
  createAdmin,
  loginUser,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/create-admin", createAdmin);

router.post(
  "/create-admin-secure",
  authenticate,
  authorize(["admin"]),
  createAdmin
);

router.post("/register", registerUser);
router.post("/login", loginUser);


module.exports = router;
