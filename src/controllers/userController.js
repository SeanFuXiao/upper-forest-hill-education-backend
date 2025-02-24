const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * GET /api/users
 * GET /api/users
 */

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.json({ error: "Failed to retrieve users" });
  }
};

/**
 * GET /api/users/:id
 * GET /api/users/:id
 */

const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!user) {
      return res.json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.json({ error: "Failed to retrieve user" });
  }
};

/**
 * DELETE /api/users/:id
 * DELETE /api/users/:id
 */

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.json({ error: "User not found" });
    }

    if (user.role === "admin") {
      return res.json({ error: "Cannot delete an admin user" });
    }

    await prisma.user.delete({ where: { id } });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.json({ error: "Failed to delete user" });
  }
};

/**
 * PATCH /api/users/:id/role
 * PATCH /api/users/:id/role
 */

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ["student", "teacher", "admin"];
    if (!validRoles.includes(role)) {
      return res.json({ error: "Invalid role" });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.json({ error: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
    });

    res.json({ message: "User role updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.json({ error: "Failed to update user role" });
  }
};
const getUserProfile = async (req, res) => {
  console.log("Inside getUserProfile, user ID from request:", req.user.id);

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true },
    });

    console.log("User fetched from database:", user);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

// const getUserProfile = async (req, res) => {
//   console.log("Inside getUserProfile, user ID from request:", req.user.id);

//   try {
//     const user = await prisma.user.findUnique({
//       where: { id: req.user.id },
//       select: { id: true, name: true, email: true, role: true },
//     });

//     console.log("User fetched from database:", user);

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     res.json(user);
//   } catch (error) {
//     console.error("Error fetching user profile:", error);
//     res.status(500).json({ error: "Failed to fetch user profile" });
//   }
// };

const updateUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Old and new password are required" });
    }

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isValidPassword = await comparePassword(oldPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: "Old password is incorrect" });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.json({ error: "Failed to update password" });
  }
};

module.exports = { updateUserPassword };

module.exports = { getUserProfile };
module.exports = {
  getAllUsers,
  getUserById,
  deleteUser,
  updateUserRole,
  getUserProfile,
  updateUserPassword,
};
