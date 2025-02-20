const express = require("express");
const {
  createCourse,
  assignTeacher,
  addStudentToCourse,
  removeStudentFromCourse,
  removeTeacherFromCourse,
  getAllCourses,
  deleteCourse,
  getCourseStudents,
} = require("../controllers/courseController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", authenticate, authorize(["admin"]), createCourse);

router.patch(
  "/:courseId/assign-teacher",
  authenticate,
  authorize(["admin"]),
  assignTeacher
);

router.patch(
  "/:courseId/add-student",
  authenticate,
  authorize(["admin"]),
  addStudentToCourse
);

router.delete(
  "/:courseId/remove-student",
  authenticate,
  authorize(["admin"]),
  removeStudentFromCourse
);

router.patch(
  "/:courseId/remove-teacher",
  authenticate,
  authorize(["admin"]),
  removeTeacherFromCourse
);

router.delete("/:courseId", authenticate, authorize(["admin"]), deleteCourse);

router.get("/", authenticate, getAllCourses);

router.get(
  "/:courseId/students",
  authenticate,
  authorize(["admin", "teacher"]),
  getCourseStudents
);

module.exports = router;
