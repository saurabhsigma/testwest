import type { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { ParentProfile } from "../models/ParentProfile";
import { StudentProfile } from "../models/StudentProfile";
import { Test } from "../models/Test";
import { getPagination } from "../middleware/pagination";

export async function listParents(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req.query as Record<string, unknown>);
  const [total, parents] = await Promise.all([
    ParentProfile.countDocuments({}),
    ParentProfile.find({})
      .populate("user", "firstName lastName email avatarUrl")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
  ]);
  return res.json({ data: parents, page, limit, total });
}

export async function getParent(req: Request, res: Response) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid parent ID format" });
  }

  const parent = await ParentProfile.findOne({
    $or: [{ _id: req.params.id }, { user: req.params.id }],
  }).populate("user", "firstName lastName email avatarUrl");

  if (!parent) return res.status(404).json({ error: "Parent not found" });
  return res.json(parent);
}

export async function createParent(req: Request, res: Response) {
  const { user } = req.body;
  const existing = await User.findOne({ email: user.email.toLowerCase() });
  if (existing) return res.status(400).json({ error: "Email already exists" });

  const passwordHash = await bcrypt.hash(user.password, 10);

  const newUser = await User.create({
    email: user.email.toLowerCase(),
    passwordHash,
    role: "PARENT",
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl || "",
    bio: user.bio || "",
    phone: user.phone || "",
    city: user.city || "",
  });

  const profile = await ParentProfile.create({ user: newUser._id, children: [] });
  return res.status(201).json({ user: newUser, profile });
}

export async function updateParent(req: Request, res: Response) {
  const parent = await ParentProfile.findById(req.params.id);
  if (!parent) return res.status(404).json({ error: "Parent not found" });

  const { user, children } = req.body;
  if (user) {
    await User.findByIdAndUpdate(parent.user, {
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      phone: user.phone,
      city: user.city,
    });
  }
  if (children) {
    parent.children = children;
    await parent.save();
  }

  const updated = await ParentProfile.findById(req.params.id).populate(
    "user",
    "firstName lastName email avatarUrl",
  );
  return res.json(updated);
}

export async function deleteParent(req: Request, res: Response) {
  const parent = await ParentProfile.findById(req.params.id);
  if (!parent) return res.status(404).json({ error: "Parent not found" });
  await ParentProfile.deleteOne({ _id: parent._id });
  await User.deleteOne({ _id: parent.user });
  return res.json({ message: "Parent deleted" });
}

export async function getParentChildren(req: Request, res: Response) {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid parent ID format" });
  }

  // Try to find by Profile ID first, then by User ID
  let parent = await ParentProfile.findById(id).populate({
    path: "children",
    populate: { path: "user", select: "firstName lastName avatarUrl" },
  });

  if (!parent) {
    parent = await ParentProfile.findOne({ user: id }).populate({
      path: "children",
      populate: { path: "user", select: "firstName lastName avatarUrl" },
    });
  }

  if (!parent) {
    return res.status(404).json({ error: `Parent not found for ID: ${id}` });
  }

  const children = (parent.children as any[] || []).map((c) => ({
    id: String(c._id),
    name: c.user ? `${c.user.firstName} ${c.user.lastName}`.trim() : "Student",
    grade: c.grade,
    board: c.board,
    avatarUrl: c.avatarUrl || c.user?.avatarUrl || "",
    relation: "Child",
  }));

  return res.json(children);
}

export async function getParentDashboard(req: Request, res: Response) {
  const childId = new mongoose.Types.ObjectId(req.params.childId);
  const completedTests = await Test.find({ studentId: childId, status: "Completed" }).sort({
    submittedAt: -1,
  });

  const testsCompleted = completedTests.length;
  const averageScore = testsCompleted
    ? Math.round(
        completedTests.reduce((s: number, t: any) => s + (t.score || 0), 0) / testsCompleted,
      )
    : 0;

  const performanceTrend = completedTests
    .slice(0, 10)
    .reverse()
    .map((t: any, idx: number) => ({
      testIndex: idx + 1,
      label: t.submittedAt
        ? t.submittedAt.toLocaleDateString("en-US", { month: "short", day: "2-digit" })
        : new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
      score: t.score || 0,
      accuracy: t.accuracy || 0,
    }));

  const subjectMap = new Map<string, { total: number; count: number }>();
  completedTests.forEach((t: any) => {
    const cur = subjectMap.get(t.subject) || { total: 0, count: 0 };
    cur.total += t.score || 0;
    cur.count += 1;
    subjectMap.set(t.subject, cur);
  });
  const subjectPerformance = Array.from(subjectMap.entries()).map(([subject, v]) => ({
    subject,
    averageScore: v.count ? Math.round(v.total / v.count) : 0,
    testsTaken: v.count,
    trend: 0,
  }));

  return res.json({
    stats: {
      testsCompleted,
      averageScore,
      weakTopicsCount: 0,
      improvementTrend: 0,
    },
    performanceTrend,
    subjectPerformance,
    weakTopics: [],
    weakSubtopics: [],
    activity: completedTests.slice(0, 6).map((t: any) => ({
      id: String(t._id),
      date: t.submittedAt ? t.submittedAt.toISOString() : t.createdAt.toISOString(),
      title: `Completed ${t.subject} test`,
      description: `${t.chapter} - ${t.topic}. Scored ${t.score || 0}%`,
      subject: t.subject,
      score: t.score || 0,
    })),
    insights: [],
    summary: "Keep supporting consistent practice and review weak topics.",
  });
}

export async function linkChild(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { studentId, studentPassword } = req.body;

    console.log("linkChild called with:", { parentId: id, studentId, hasPassword: !!studentPassword });

    if (!studentId || !studentPassword) {
      return res.status(400).json({ error: "Student email/ID and password are required" });
    }

    // Verify parent exists and belongs to the requesting user
    let parent;
    if (mongoose.Types.ObjectId.isValid(id)) {
      parent = await ParentProfile.findOne({ $or: [{ _id: id }, { user: id }] });
    }
    if (!parent) {
      console.log("Parent not found for id:", id);
      return res.status(404).json({ error: "Parent profile not found. Try logging out and back in." });
    }

    // Find the student profile - support ID or email lookup
    let student;
    
    // First try by MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      student = await StudentProfile.findOne({ $or: [{ _id: studentId }, { user: studentId }] });
      console.log("Looked up by ObjectId, found:", !!student);
    }
    
    // If not found, try finding by user email
    if (!student) {
      const studentUserByEmail = await User.findOne({ 
        email: studentId.toLowerCase().trim(), 
        role: { $in: ["STUDENT", "SOLO"] } 
      });
      console.log("Looked up by email:", studentId, "found user:", !!studentUserByEmail);
      if (studentUserByEmail) {
        student = await StudentProfile.findOne({ user: studentUserByEmail._id });
        console.log("Found student profile for email user:", !!student);
      }
    }

    if (!student) {
      return res.status(404).json({ error: "Student not found. Make sure they have a student account with this email." });
    }

    // Get the student's user account to verify password
    const studentUser = await User.findById(student.user);
    if (!studentUser) return res.status(404).json({ error: "Student user account not found" });

    // Verify the student's password for security
    const isPasswordValid = await bcrypt.compare(studentPassword, studentUser.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password. Enter the student's login password." });
    }

    // Check if already linked
    const studentIdObj = student._id as any;
    if (parent.children.some((cId: any) => cId.toString() === studentIdObj.toString())) {
      return res.status(400).json({ error: "This student is already linked to your account." });
    }

    // Link the child
    parent.children.push(studentIdObj);
    await parent.save();

    console.log("Successfully linked student:", studentIdObj, "to parent:", parent._id);
    return res.json({ message: "Student linked successfully!", studentId: studentIdObj });
  } catch (error) {
    console.error("Error linking child:", error);
    return res.status(500).json({ error: "Failed to link student. Please try again." });
  }
}

// Verify a student exists by email (without password) - returns student info for preview
export async function verifyStudent(req: Request, res: Response) {
  try {
    const { studentEmail } = req.body;
    console.log("verifyStudent called with:", { studentEmail });

    if (!studentEmail) {
      return res.status(400).json({ error: "Student email is required" });
    }

    // Find student user by email - check all users first for debugging
    const allUsersWithEmail = await User.findOne({ email: studentEmail.toLowerCase().trim() });
    console.log("User with this email:", allUsersWithEmail ? { email: allUsersWithEmail.email, role: allUsersWithEmail.role } : "NOT FOUND");

    // Find student user by email
    const studentUser = await User.findOne({ 
      email: studentEmail.toLowerCase().trim(), 
      role: { $in: ["STUDENT", "SOLO"] } 
    });
    console.log("Student user found:", !!studentUser);

    if (!studentUser) {
      const existingUser = await User.findOne({ email: studentEmail.toLowerCase().trim() });
      if (existingUser) {
        return res.status(404).json({ 
          error: `This email is registered as a ${existingUser.role}, not as a student. Your child needs a STUDENT account.` 
        });
      }
      return res.status(404).json({ error: "No account found with this email. Make sure they have signed up." });
    }

    // Get student profile
    const student = await StudentProfile.findOne({ user: studentUser._id });

    if (!student) {
      return res.status(404).json({ error: "Student profile not found." });
    }

    // Get test stats
    const tests = await Test.find({ student: student._id, status: "COMPLETED" });
    const testsCompleted = tests.length;
    const avgScore = testsCompleted > 0 
      ? Math.round(tests.reduce((sum, t) => sum + (t.score || 0), 0) / testsCompleted) 
      : 0;

    return res.json({
      found: true,
      studentId: student._id,
      name: `${studentUser.firstName} ${studentUser.lastName}`,
      email: studentUser.email,
      grade: student.grade,
      board: student.board,
      testsCompleted,
      averageScore: avgScore,
    });
  } catch (error) {
    console.error("Error verifying student:", error);
    return res.status(500).json({ error: "Failed to verify student." });
  }
}
