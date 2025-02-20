const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { hashPassword, comparePassword } = require("../utils/hashPassword");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.json({ error: "All fields are required" });
  }
  if (role === "admin") {
    return res.json({ error: "Cannot register as admin" });
  }

  const hashedPassword = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    });
    res.json(user);
  } catch (error) {
    res.json({ error: "Email already exists" });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingAdmin = await prisma.user.findFirst({
      where: { role: "admin" },
    });

    if (existingAdmin && !req.user) {
      return res.json({ error: "Unauthorized: Admin already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "admin",
      },
    });

    res.json({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.json({ error: "Internal server error" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.json({ error: "Invalid email or password" });

  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) return res.json({ error: "Invalid email or password" });

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "12h",
  });
  res.json({ token, user });
};

module.exports = { registerUser, createAdmin, loginUser };
