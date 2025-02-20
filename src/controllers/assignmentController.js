const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * /api/assignments/course/:courseId
 * Teacher
 */

const createAssignment = async (req, res) => {
  try {
    const { title, startDate, dueDate } = req.body;
    const { courseId } = req.params;
    const teacherId = req.user.id;

    if (!title || !startDate || !dueDate) {
      return res.json({ error: "All fields are required" });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!course) return res.json({ error: "Course not found" });

    if (course.teacherId !== teacherId) {
      return res.json({
        error: "Unauthorized: You are not the teacher of this course",
      });
    }

    const newAssignment = await prisma.assignment.create({
      data: {
        title,
        startDate: new Date(startDate),
        dueDate: new Date(dueDate),
        courseId,
        createdBy: teacherId,
      },
    });

    res.json(newAssignment);
  } catch (error) {
    console.error("Error creating assignment:", error);
    res.json({ error: "Failed to create assignment" });
  }
};

/**
 * POST /api/assignments/:assignmentId/submit
 * Student
 */

const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return res.json({ error: "Assignment not found" });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: studentId, courseId: assignment.courseId },
    });

    if (!enrollment) {
      return res.json({
        error: "Unauthorized: You are not enrolled in this course",
      });
    }

    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId,
        submittedAt: new Date(),
      },
    });

    res.json(submission);
  } catch (error) {
    console.error("Error submitting assignment:", error);
    res.json({ error: "Failed to submit assignment" });
  }
};

/**
 * PATCH /api/assignments/:id
 * Teacher
 */

const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, dueDate } = req.body;

    const assignment = await prisma.assignment.findUnique({ where: { id } });

    if (!assignment) {
      return res.json({ error: "Assignment not found" });
    }

    if (assignment.createdBy !== req.user.id) {
      return res.json({ error: "Unauthorized to edit this assignment" });
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: {
        title: title || assignment.title,
        dueDate: dueDate ? new Date(dueDate) : assignment.dueDate,
      },
    });

    res.json(updatedAssignment);
  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({ error: "Failed to update assignment" });
  }
};

/**
 * DELETE /api/assignments/:id
 * Teacher
 */

const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await prisma.assignment.findUnique({ where: { id } });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    if (assignment.createdBy !== req.user.id) {
      return res.json({ error: "Unauthorized to delete this assignment" });
    }

    await prisma.assignment.delete({ where: { id } });

    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    res.json({ error: "Failed to delete assignment" });
  }
};

/**
 * GET /api/assignments/course/:courseId
 * Teacher
 */

const getAssignmentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const assignments = await prisma.assignment.findMany({
      where: { courseId },
      include: {
        submissions: {
          include: {
            student: { select: { id: true, name: true } },
          },
        },
      },
    });

    res.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.json({ error: "Failed to fetch assignments" });
  }
};

/**
 * GET /api/assignments/:assignmentId/submissions
 * Student (Only their own), Teacher (Only their course students), Admin (All)
 */

const getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    });

    if (!assignment) {
      return res.json({ error: "Assignment not found" });
    }

    let submissions;

    if (userRole === "admin") {
      submissions = await prisma.assignmentSubmission.findMany({
        where: { assignmentId },
        include: { student: { select: { id: true, name: true } } },
      });
    } else if (userRole === "teacher") {
      if (assignment.course.teacherId !== userId) {
        return res.json({
          error: "Unauthorized: You are not the teacher of this course",
        });
      }

      submissions = await prisma.assignmentSubmission.findMany({
        where: { assignmentId },
        include: { student: { select: { id: true, name: true } } },
      });
    } else if (userRole === "student") {
      submissions = await prisma.assignmentSubmission.findMany({
        where: { assignmentId, studentId: userId },
        include: { student: { select: { id: true, name: true } } },
      });
    } else {
      return res.json({ error: "Unauthorized access" });
    }

    res.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.json({ error: "Failed to fetch submissions" });
  }
};

/**
 * PATCH /api/assignments/:assignmentId/submissions/:submissionId
 * Teacher
 */

const gradeAssignment = async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;
    const { grade, feedback } = req.body;
    const teacherId = req.user.id;

    if (grade === undefined || grade === null) {
      return res.json({ error: "Grade is required" });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return res.json({ error: "Assignment not found" });
    }

    const course = await prisma.course.findUnique({
      where: { id: assignment.courseId },
    });

    if (!course || course.teacherId !== teacherId) {
      return res.json({
        error: "Unauthorized: You are not the teacher of this course",
      });
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const gradedSubmission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        grade,
        feedback: feedback || null,
      },
    });

    res.json(gradedSubmission);
  } catch (error) {
    console.error("Error grading assignment:", error);
    res.json({ error: "Failed to grade assignment" });
  }
};

const getAllSubmissions = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.json({ error: "Unauthorized: Admin only" });
    }

    const submissions = await prisma.assignmentSubmission.findMany({
      include: {
        assignment: { select: { id: true, title: true, courseId: true } },
        student: { select: { id: true, name: true } },
      },
    });

    if (!submissions.length) {
      return res.json({ error: "No submissions found" });
    }

    res.json(submissions);
  } catch (error) {
    console.error("Error fetching all submissions:", error);
    res.json({ error: "Failed to fetch submissions" });
  }
};

module.exports = {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentsByCourse,
  getAssignmentSubmissions,
  gradeAssignment,
  submitAssignment,
  getAllSubmissions,
};
