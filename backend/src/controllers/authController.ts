import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import env from "../config/env";
import { User } from "../models/User";
import { StudentProfile } from "../models/StudentProfile";
import { ParentProfile } from "../models/ParentProfile";
import { TeacherProfile } from "../models/TeacherProfile";

function signToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, env.jwtSecret, { expiresIn: "1d" });
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password, role, firstName, lastName, profile = {} } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      role,
      firstName,
      lastName,
      avatarUrl: profile.avatarUrl || "",
      bio: profile.bio || "",
      phone: profile.phone || "",
      city: profile.city || "",
    });

    if (role === "STUDENT" || role === "SOLO") {
      await StudentProfile.create({
        user: user._id,
        grade: profile.grade,
        board: profile.board,
        avatarUrl: profile.avatarUrl || "",
        schoolId: profile.schoolId || null,
        classId: profile.classId || null,
        section: profile.section || "",
        rollNo: profile.rollNo || "",
      });
    }

    if (role === "PARENT") {
      await ParentProfile.create({ user: user._id, children: [] });
    }

    if (role === "TEACHER") {
      await TeacherProfile.create({
        user: user._id,
        subjects: profile.subjects || [],
        classIds: profile.classIds || [],
        schoolId: profile.schoolId || null,
        experienceYears: profile.experienceYears || 0,
      });
    }

    const token = signToken(String(user._id), user.role);
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        phone: user.phone,
        city: user.city,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Registration failed. Please try again." });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(String(user._id), user.role);
    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        phone: user.phone,
        city: user.city,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed. Please try again." });
  }
}

export async function me(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let profile = null;
    if (req.user.role === "STUDENT" || req.user.role === "SOLO") {
      profile = await StudentProfile.findOne({ user: req.user._id });
    } else if (req.user.role === "PARENT") {
      profile = await ParentProfile.findOne({ user: req.user._id }).populate("children");
    } else if (req.user.role === "TEACHER") {
      profile = await TeacherProfile.findOne({ user: req.user._id }).populate({
        path: "classIds",
        select: "grade section schoolId",
      });
    }

    return res.json({
      ...req.user.toObject(),
      profile,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ error: "Failed to get user data" });
  }
}
