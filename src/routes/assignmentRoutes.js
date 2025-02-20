const express = require("express");
const {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentsByCourse,
  getAssignmentSubmissions,
  gradeAssignment,
  submitAssignment,
  getAllSubmissions,
} = require("../controllers/assignmentController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/submissions",
  authenticate,
  authorize(["admin"]),
  getAllSubmissions
);

router.post(
  "/course/:courseId",
  authenticate,
  authorize(["teacher"]),
  createAssignment
);

router.get(
  "/course/:courseId",
  authenticate,
  authorize(["teacher"]),
  getAssignmentsByCourse
);

router.post(
  "/:assignmentId/submit",
  authenticate,
  authorize(["student"]),
  submitAssignment
);

router.get(
  "/course/:courseId",
  authenticate,
  authorize(["teacher"]),
  getAssignmentsByCourse
);

router.patch(
  "/:assignmentId/submissions/:submissionId",
  authenticate,
  authorize(["teacher"]),
  gradeAssignment
);

router.patch("/:id", authenticate, authorize(["teacher"]), updateAssignment);

router.delete("/:id", authenticate, authorize(["teacher"]), deleteAssignment);

router.get(
  "/course/:courseId",
  authenticate,
  authorize(["teacher"]),
  getAssignmentsByCourse
);

module.exports = router;
