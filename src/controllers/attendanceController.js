const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * POST /api/attendance/course/:courseId
 * Teacher
 */

exports.markAttendance = async (req, res) => {
  try {
    const { studentId, date, status } = req.body;
    const { courseId } = req.params;
    const teacherId = req.user.id;

    console.log("Incoming request:", {
      studentId,
      date,
      status,
      courseId,
      teacherId,
    });

    if (!studentId || !date || !status) {
      console.log("❌ Missing required fields");
      return res.json({ error: "All fields are required" });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      console.log("Course not found:", courseId);
      return res.json({ error: "Course not found" });
    }

    if (course.teacherId !== teacherId) {
      console.log("Unauthorized: Teacher mismatch", {
        courseTeacher: course.teacherId,
        requestTeacher: teacherId,
      });
      return res.json({
        error: "Unauthorized: You are not the teacher of this course",
      });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: studentId,
        courseId: courseId,
      },
    });

    if (!enrollment) {
      console.log("Student not enrolled in course:", {
        studentId,
        courseId,
      });
      return res.json({ error: "Student is not enrolled in this course" });
    }

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId,
        courseId,
        date: new Date(date),
      },
    });

    if (existingAttendance) {
      console.log("Attendance already recorded:", existingAttendance);
      return res.json({
        error: "Attendance for this student on this date already exists",
      });
    }

    const attendanceRecord = await prisma.attendance.create({
      data: {
        studentId,
        courseId,
        date: new Date(date),
        status,
        markedBy: teacherId,
      },
    });

    console.log("Attendance recorded successfully:", attendanceRecord);
    res.json(attendanceRecord);
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.json({ error: "Failed to mark attendance" });
  }
};

/**
 * GET /api/courses/:courseId/attendance
 * Teacher (for their courses) & Admin (all courses)
 */

exports.getCourseAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;
    const user = req.user;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.json({ error: "Course not found" });
    }

    if (user.role === "teacher" && course.teacherId !== user.id) {
      return res.json({
        error: "Unauthorized to view this course's attendance",
      });
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: { courseId },
      include: { student: { select: { id: true, name: true } } },
    });
    res.json(attendanceRecords);
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    res.json({ error: "Failed to fetch attendance records" });
  }
};

/**
 *GET /api/attendance/my-attendance
 *Student
 */

exports.getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;

    const attendanceRecords = await prisma.attendance.findMany({
      where: { studentId },
      include: { course: { select: { id: true, name: true } } },
    });

    res.json(attendanceRecords);
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    res.json({ error: "Failed to fetch attendance records" });
  }
};

/**
 * PATCH /api/courses/:courseId/attendance/:attendanceId
 * Teacher & Admin
 */

exports.updateAttendance = async (req, res) => {
  try {
    const { courseId, attendanceId } = req.params;
    const { status } = req.body;
    const user = req.user;

    if (!["Present", "Absent"].includes(status)) {
      return res.json({ error: "Invalid attendance status" });
    }

    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { course: true },
    });

    if (!attendance) {
      return res.json({ error: "Attendance record not found" });
    }

    if (user.role === "teacher" && attendance.course.teacherId !== user.id) {
      return res.json({
        error: "Unauthorized to update this attendance record",
      });
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: { status },
    });

    res.json({
      message: "Attendance updated successfully",
      attendance: updatedAttendance,
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.json({ error: "Failed to update attendance" });
  }
};

/**
 * GET /api/attendance
 */

exports.getAttendanceRecords = async (req, res) => {
  try {
    let records;

    if (req.user.role === "admin") {
      records = await prisma.attendance.findMany({
        include: {
          student: { select: { id: true, name: true } },
          course: { select: { id: true, name: true } },
        },
      });
    } else if (req.user.role === "teacher") {
      records = await prisma.attendance.findMany({
        where: {
          course: { teacherId: req.user.id },
        },
        include: {
          student: { select: { id: true, name: true } },
          course: { select: { id: true, name: true } },
        },
      });
    } else if (req.user.role === "student") {
      records = await prisma.attendance.findMany({
        where: {
          studentId: req.user.id,
        },
        include: {
          course: { select: { id: true, name: true } },
        },
      });
    } else {
      return res.json({ error: "Unauthorized role" });
    }

    if (!records.length) {
      return res.json({ error: "No attendance records found" });
    }

    res.json(records);
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    res.json({ error: "Failed to fetch attendance records" });
  }
};
