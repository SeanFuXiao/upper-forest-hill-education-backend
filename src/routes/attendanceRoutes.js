const express = require("express");
const {
  markAttendance,
  getCourseAttendance,
  updateAttendance,
  getAttendanceRecords,
  getStudentAttendance,
} = require("../controllers/attendanceController");

const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/:courseId/attendance",
  authenticate,
  authorize(["teacher", "admin"]),
  markAttendance
);

router.get(
  "/:courseId/attendance",
  authenticate,
  authorize(["teacher", "admin"]),
  getCourseAttendance
);

router.get(
  "/my-attendance",
  authenticate,
  authorize(["student"]),
  getStudentAttendance
);

router.patch(
  "/:courseId/attendance/:attendanceId",
  authenticate,
  authorize(["teacher", "admin"]),
  updateAttendance
);
router.get("/", authenticate, getAttendanceRecords);
module.exports = router;
