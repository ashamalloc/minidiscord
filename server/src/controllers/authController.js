const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function createToken(user) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured.");
  return jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });
}
exports.signup = async (req, res) => {
  try {
    let { username, email, password } = req.body || {};
    username = typeof username === "string" ? username.trim() : "";
    email = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (username.length < 2 || username.length > 24) return res.status(400).json({ message: "Username must be 2–24 characters." });
    if (!emailPattern.test(email)) return res.status(400).json({ message: "Enter a valid email address." });
    if (typeof password !== "string" || password.length < 8 || password.length > 72) return res.status(400).json({ message: "Password must be 8–72 characters." });
    if (await User.findOne({ $or: [{ email }, { username }] })) return res.status(409).json({ message: "That email or username is already in use." });
    const user = await User.create({ username, email, password: await bcrypt.hash(password, 12) });
    return res.status(201).json({ message: "Account created.", token: createToken(user), user: { _id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "That email or username is already in use." });
    console.error("Signup error:", error.message);
    return res.status(500).json({ message: "Could not create account." });
  }
};
exports.login = async (req, res) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
    const user = await User.findOne({ email }).select("+password username email");
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: "Incorrect email or password." });
    return res.json({ message: "Login successful.", token: createToken(user), user: { _id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Could not log in." });
  }
};
exports.me = (req, res) => res.json({ user: { _id: req.user._id, username: req.user.username, email: req.user.email } });
