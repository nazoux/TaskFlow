const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { User } = require("../models");

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