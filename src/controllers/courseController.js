const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * @desc Get courses based on user role
 * @route GET /api/courses
 * @access Admin: All courses, Teacher: Only their courses, Student: Only their enrolled courses
 */
exports.getAllCourses = async (req, res) => {
  try {
    console.log(
      `Fetching courses for user ${req.user.id} with role ${req.user.role}`
    );

    let courses;

    if (req.user.role === "admin") {
      courses = await prisma.course.findMany({
        include: {
          teacher: { select: { id: true, name: true, email: true } },
          students: { select: { user: { select: { id: true, name: true } } } },
          assignments: true,
        },
      });
    } else if (req.user.role === "teacher") {
      courses = await prisma.course.findMany({
        where: { teacherId: req.user.id },
        include: {
          students: { select: { user: { select: { id: true, name: true } } } },
          assignments: true,
        },
      });
    } else if (req.user.role === "student") {
      courses = await prisma.course.findMany({
        where: { students: { some: { userId: req.user.id } } },
        include: {
          teacher: { select: { id: true, name: true } },
          assignments: true,
        },
      });
    } else {
      return res.status(403).json({ error: "Unauthorized role" });
    }

    console.log("Courses fetched:", courses);
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
};

/**
 * @desc Create a new course (Only Admin)
 * @route POST /api/courses
 * @access Admin
 */
exports.createCourse = async (req, res) => {
  try {
    const { name, startDate, endDate, time, category, teacherId, zoom } =
      req.body;

    if (!name || !startDate || !endDate || !time || !category) {
      return res
        .status(400)
        .json({ error: "All fields except teacherId and zoom are required" });
    }

    let assignedTeacherId = null;
    if (teacherId) {
      const teacher = await prisma.user.findUnique({
        where: { id: teacherId },
      });
      if (!teacher || teacher.role !== "teacher") {
        return res.status(400).json({ error: "Invalid teacher ID" });
      }
      assignedTeacherId = teacherId;
    }

    const newCourse = await prisma.course.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        time,
        category,
        teacherId: assignedTeacherId,
        zoom: zoom || null,
        createdBy: req.user.id,
      },
    });

    res.status(201).json(newCourse);
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ error: "Failed to create course" });
  }
};
/**
 * @desc Delete a course (Only Admin)
 * @route DELETE /api/courses/:id
 * @access Admin
 */
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    await prisma.course.delete({ where: { id } });

    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting course:", error);
    res.status(500).json({ error: "Failed to delete course" });
  }
};
/**
 * @desc Assign a teacher to a course
 * @route PATCH /api/courses/:courseId/assign-teacher
 * @access Admin
 */
exports.assignTeacher = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { teacherId } = req.body;

    const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
    if (!teacher || teacher.role !== "teacher") {
      return res.status(400).json({ error: "Invalid teacher ID" });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: { teacherId },
    });

    res.json({
      message: "Teacher assigned successfully",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("Error assigning teacher:", error);
    res.status(500).json({ error: "Failed to assign teacher" });
  }
};

/**
 * @desc Add a student to a course
 * @route PATCH /api/courses/:courseId/add-student
 * @access Admin
 */
exports.addStudentToCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { studentId } = req.body;

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.role !== "student") {
      return res.status(400).json({ error: "Invalid student ID" });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const existingEnrollment = await prisma.enrollment.findFirst({
      where: { userId: studentId, courseId },
    });
    if (existingEnrollment) {
      return res.status(400).json({ error: "Student already enrolled" });
    }

    const newEnrollment = await prisma.enrollment.create({
      data: { userId: studentId, courseId },
    });

    res.json({
      message: "Student added successfully",
      enrollment: newEnrollment,
    });
  } catch (error) {
    console.error("Error adding student:", error);
    res.status(500).json({ error: "Failed to add student" });
  }
};

/**
 * @desc Remove a student from a course (Only Admin)
 * @route DELETE /api/courses/:courseId/remove-student
 * @access Admin
 */
exports.removeStudentFromCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: studentId,
        courseId: courseId,
      },
    });
    if (!enrollment) {
      return res
        .status(404)
        .json({ error: "Student is not enrolled in this course" });
    }

    await prisma.enrollment.delete({
      where: { id: enrollment.id },
    });

    res.json({
      message: "Student removed successfully",
      courseId,
      studentId,
    });
  } catch (error) {
    console.error("Error removing student:", error);
    res.status(500).json({ error: "Failed to remove student" });
  }
};
/**
 * @desc Remove a teacher from a course (Only Admin)
 * @route PATCH /api/courses/:courseId/remove-teacher
 * @access Admin
 */
exports.removeTeacherFromCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { teacherId } = req.body;

    if (!teacherId) {
      return res.status(400).json({ error: "Teacher ID is required" });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (!course.teacherId) {
      return res
        .status(400)
        .json({ error: "This course has no assigned teacher" });
    }

    if (course.teacherId !== teacherId) {
      return res
        .status(400)
        .json({ error: "This teacher is not assigned to this course" });
    }

    await prisma.course.update({
      where: { id: courseId },
      data: { teacherId: null },
    });

    res.json({
      message: "Teacher removed successfully",
      courseId,
    });
  } catch (error) {
    console.error("Error removing teacher:", error);
    res.status(500).json({ error: "Failed to remove teacher" });
  }
};
