const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * GET /api/users
 * Admin
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
 * Authenticated Users
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
 * Admin
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
 * Admin
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

module.exports = {
  getAllUsers,
  getUserById,
  deleteUser,
  updateUserRole,
};
