const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { User } = require("../models");
const { sendResetEmail } = require("../utils/mailer");

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "username, email and password are required"
      });
    }

    const existingUser = await User.findOne({
      where: {
        email
      }
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already used"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password_hash: hashedPassword,
      created_at: new Date()
    });

    res.status(201).json({
      message: "User created",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error"
    });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email and password are required"
      });
    }

    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar || null
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error"
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar || null,
      created_at: user.created_at
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { username, email, password } = req.body;

    if (username && username !== user.username) {
      const taken = await User.findOne({ where: { username } });
      if (taken) return res.status(409).json({ message: "Username already taken" });
      user.username = username;
    }

    if (email && email !== user.email) {
      const taken = await User.findOne({ where: { email } });
      if (taken) return res.status(409).json({ message: "Email already used" });
      user.email = email;
    }

    if (password) {
      user.password_hash = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.json({
      message: "Profile updated",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar || null
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ where: { email } });
    // Always return 200 to avoid email enumeration
    if (!user) return res.json({ message: "If this email exists, a reset link has been sent." });

    const token = crypto.randomBytes(32).toString("hex");
    user.reset_token = token;
    user.reset_token_expires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}reset-password?token=${token}`;
    await sendResetEmail(email, resetLink);

    res.json({ message: "If this email exists, a reset link has been sent." });
  } catch (error) {
    console.error("forgotPassword error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: "Token and password required" });

    const user = await User.findOne({ where: { reset_token: token } });
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    if (new Date() > user.reset_token_expires) {
      return res.status(400).json({ message: "Token expired" });
    }

    user.password_hash = await bcrypt.hash(password, 10);
    user.reset_token = null;
    user.reset_token_expires = null;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    user.avatar = base64;
    await user.save();

    res.json({
      message: "Avatar updated",
      avatar: user.avatar
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};