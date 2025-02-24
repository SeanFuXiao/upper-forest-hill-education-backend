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
  getAssignmentById,
  provideAssignmentFeedback,
  getStudentAssignments,
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
  authorize(["teacher", "student"]),
  getAssignmentsByCourse
);

router.post(
  "/:assignmentId/submit",
  authenticate,
  authorize(["student"]),
  submitAssignment
);

router.patch(
  "/:assignmentId/submissions/:submissionId",
  authenticate,
  authorize(["teacher"]),
  gradeAssignment
);

router.patch("/:id", authenticate, authorize(["teacher"]), updateAssignment);

router.delete("/:id", authenticate, authorize(["teacher"]), deleteAssignment);

router.get("/:assignmentId", authenticate, getAssignmentById);

router.patch(
  "/:assignmentId/feedback",
  authenticate,
  authorize(["teacher"]),
  provideAssignmentFeedback
);

router.get(
  "/:assignmentId/submissions",
  authenticate,
  authorize(["student", "teacher", "admin"]),
  getAssignmentSubmissions
);

router.get(
  "/my-courses",
  authenticate,
  authorize(["student"]),
  getStudentAssignments
);

module.exports = router;
