const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 *  GET /api/courses
 * Admin: All courses, Teacher: Only their courses, Student: Only their enrolled courses
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
      return res.json({ error: "Unauthorized role" });
    }

    console.log("Courses fetched:", courses);
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.json({ error: "Failed to fetch courses" });
  }
};

/**
 * POST /api/courses
 * Admin
 */

exports.createCourse = async (req, res) => {
  try {
    const { name, startDate, endDate, time, category, teacherId, zoom } =
      req.body;

    if (!name || !startDate || !endDate || !time || !category) {
      return res.json({
        error: "All fields except teacherId and zoom are required",
      });
    }

    let assignedTeacherId = null;
    if (teacherId) {
      const teacher = await prisma.user.findUnique({
        where: { id: teacherId },
      });
      if (!teacher || teacher.role !== "teacher") {
        return res.json({ error: "Invalid teacher ID" });
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

    res.json(newCourse);
  } catch (error) {
    console.error("Error creating course:", error);
    res.json({ error: "Failed to create course" });
  }
};
/**
 * DELETE /api/courses/:id
 * Admin
 */

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return res.json({ error: "Course not found" });
    }

    await prisma.course.delete({ where: { id } });

    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.json({ error: "Failed to delete course" });
  }
};

/**
 * PATCH /api/courses/:courseId/assign-teacher
 * Admin
 */

exports.assignTeacher = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { teacherId } = req.body;

    const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
    if (!teacher || teacher.role !== "teacher") {
      return res.json({ error: "Invalid teacher ID" });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.json({ error: "Course not found" });
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
    res.json({ error: "Failed to assign teacher" });
  }
};

/**
 * PATCH /api/courses/:courseId/add-student
 * Admin
 */

exports.addStudentToCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { studentId } = req.body;

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.role !== "student") {
      return res.json({ error: "Invalid student ID" });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.json({ error: "Course not found" });
    }

    const existingEnrollment = await prisma.enrollment.findFirst({
      where: { userId: studentId, courseId },
    });
    if (existingEnrollment) {
      return res.json({ error: "Student already enrolled" });
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
    res.json({ error: "Failed to add student" });
  }
};

/**
 * DELETE /api/courses/:courseId/remove-student
 * Admin
 */

exports.removeStudentFromCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      return res.json({ error: "Student ID is required" });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      return res.json({ error: "Course not found" });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: studentId,
        courseId: courseId,
      },
    });
    if (!enrollment) {
      return res.json({ error: "Student is not enrolled in this course" });
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
    res.json({ error: "Failed to remove student" });
  }
};

/**
 * PATCH /api/courses/:courseId/remove-teacher
 * Admin
 */

exports.removeTeacherFromCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { teacherId } = req.body;

    if (!teacherId) {
      return res.json({ error: "Teacher ID is required" });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      return res.json({ error: "Course not found" });
    }

    if (!course.teacherId) {
      return res.json({ error: "This course has no assigned teacher" });
    }

    if (course.teacherId !== teacherId) {
      return res.json({ error: "This teacher is not assigned to this course" });
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
    res.json({ error: "Failed to remove teacher" });
  }
};

/**
 * GET /api/courses/:courseId/students
 * Admin, Teacher
 */

exports.getCourseStudents = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        students: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!course) {
      return res.json({ error: "Course not found" });
    }

    const students = course.students.map((enrollment) => enrollment.user);
    res.json(students);
  } catch (error) {
    console.error("Error fetching course students:", error);
    res.json({ error: "Failed to fetch students for this course" });
  }
};
