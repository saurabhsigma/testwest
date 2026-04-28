import type { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { StudentProfile } from "../models/StudentProfile";
import { Test } from "../models/Test";
import { getPagination } from "../middleware/pagination";

function toTestAttempt(test: any) {
  const totalQuestions = test.questions.length || test.questionCount || 0;
  const durationMinutes = test.durationSeconds ? Math.round(test.durationSeconds / 60) : null;
  return {
    id: String(test._id),
    title: test.title || "",
    subject: test.subject,
    chapter: test.chapter,
    topic: test.topic,
    date: test.submittedAt ? test.submittedAt.toISOString() : test.createdAt.toISOString(),
    dueDate: test.dueDate ? test.dueDate.toISOString() : null,
    score: test.score ?? 0,
    accuracy: test.accuracy ?? 0,
    durationMinutes: durationMinutes || 0,
    questionCount: totalQuestions,
    status: test.status,
    difficulty: test.difficulty,
    isAssigned: !!test.assignmentId,
    assignmentId: test.assignmentId ? String(test.assignmentId) : null,
  };
}

function calcAccuracyScore(correct: number, total: number) {
  if (!total) return 0;
  return Math.round((correct / total) * 100);
}

export async function listStudents(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req.query as Record<string, unknown>);
  const filter: Record<string, unknown> = {};
  if (req.query.grade) filter.grade = Number(req.query.grade);
  if (req.query.board) filter.board = req.query.board;
  if (req.query.schoolId) filter.schoolId = req.query.schoolId;
  if (req.query.classId) filter.classId = req.query.classId;

  const [total, profiles] = await Promise.all([
    StudentProfile.countDocuments(filter),
    StudentProfile.find(filter)
      .populate("user", "firstName lastName email avatarUrl bio phone city")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
  ]);

  return res.json({
    data: profiles,
    page,
    limit,
    total,
  });
}

export async function getStudent(req: Request, res: Response) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid student ID format" });
  }
  const profile = await StudentProfile.findById(req.params.id).populate(
    "user",
    "firstName lastName email avatarUrl bio phone city",
  );
  if (!profile) return res.status(404).json({ error: "Student not found" });
  return res.json(profile);
}

export async function createStudent(req: Request, res: Response) {
  const { user, profile } = req.body;
  const existing = await User.findOne({ email: user.email.toLowerCase() });
  if (existing) return res.status(400).json({ error: "Email already exists" });

  const passwordHash = await bcrypt.hash(user.password, 10);

  const newUser = await User.create({
    email: user.email.toLowerCase(),
    passwordHash,
    role: "STUDENT",
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl || "",
    bio: user.bio || "",
    phone: user.phone || "",
    city: user.city || "",
  });

  const newProfile = await StudentProfile.create({
    user: newUser._id,
    grade: profile.grade,
    board: profile.board,
    avatarUrl: profile.avatarUrl || "",
    schoolId: profile.schoolId || null,
    classId: profile.classId || null,
    section: profile.section || "",
    rollNo: profile.rollNo || "",
  });

  return res.status(201).json({ user: newUser, profile: newProfile });
}

export async function updateStudent(req: Request, res: Response) {
  const profile = await StudentProfile.findById(req.params.id);
  if (!profile) return res.status(404).json({ error: "Student not found" });

  const { user, profile: profileUpdates } = req.body;

  if (user) {
    await User.findByIdAndUpdate(profile.user, {
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      phone: user.phone,
      city: user.city,
    });
  }

  Object.assign(profile, profileUpdates || {});
  await profile.save();

  const updated = await StudentProfile.findById(req.params.id).populate(
    "user",
    "firstName lastName email avatarUrl bio phone city",
  );

  return res.json(updated);
}

export async function deleteStudent(req: Request, res: Response) {
  const profile = await StudentProfile.findById(req.params.id);
  if (!profile) return res.status(404).json({ error: "Student not found" });
  await StudentProfile.deleteOne({ _id: profile._id });
  await User.deleteOne({ _id: profile.user });
  return res.json({ message: "Student deleted" });
}

export async function listStudentTests(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req.query as Record<string, unknown>);
  const filter: Record<string, unknown> = { studentId: req.params.id };
  if (req.query.status) filter.status = req.query.status;

  const [total, tests] = await Promise.all([
    Test.countDocuments(filter),
    Test.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  return res.json({
    data: tests.map(toTestAttempt),
    page,
    limit,
    total,
  });
}

export async function getStudentDashboard(req: Request, res: Response) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid student ID format" });
  }
  const studentId = new mongoose.Types.ObjectId(req.params.id);

  // Get all tests including pending/assigned ones
  const allTests = await Test.find({ studentId }).sort({ createdAt: -1 });

  const completedTests = allTests.filter((t: any) => t.status === "Completed");
  const pendingTests = allTests.filter((t: any) => t.status === "Pending" || t.status === "In progress");

  const testsTaken = completedTests.length;
  const averageScore = testsTaken
    ? Math.round(
        completedTests.reduce((sum: number, t: any) => sum + (t.score || 0), 0) / testsTaken,
      )
    : 0;
  const accuracy = testsTaken
    ? Math.round(
        completedTests.reduce((sum: number, t: any) => sum + (t.accuracy || 0), 0) / testsTaken,
      )
    : 0;

  let totalQuestionSeconds = 0;
  let totalQuestionCount = 0;
  completedTests.forEach((t: any) => {
    t.questions.forEach((q: any) => {
      totalQuestionSeconds += q.timeSpentSeconds || 0;
      totalQuestionCount += 1;
    });
  });
  const avgTimePerQuestionSec = totalQuestionCount
    ? Math.round(totalQuestionSeconds / totalQuestionCount)
    : 0;

  // Recent tests includes both completed and recent pending/in-progress
  const recentTests = allTests.slice(0, 10).map(toTestAttempt);

  // Assigned tests that are pending
  const assignedTests = pendingTests
    .filter((t: any) => t.assignmentId)
    .slice(0, 5)
    .map(toTestAttempt);

  const scoreTrend = completedTests
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

  const topicStats = new Map<string, any>();
  const subtopicStats = new Map<string, any>();

  completedTests.forEach((t: any) => {
    t.questions.forEach((q: any) => {
      if (q.givenAnswer === null || q.givenAnswer === undefined) return;
      const isCorrect = JSON.stringify(q.givenAnswer) === JSON.stringify(q.answer);
      const topicKey = `${t.subject}|${t.chapter}|${t.topic}`;
      const topicStat = topicStats.get(topicKey) || {
        subject: t.subject,
        chapter: t.chapter,
        topic: t.topic,
        correct: 0,
        total: 0,
      };
      topicStat.total += 1;
      if (isCorrect) topicStat.correct += 1;
      topicStats.set(topicKey, topicStat);

      if (t.subtopic) {
        const subKey = `${t.subject}|${t.chapter}|${t.topic}|${t.subtopic}`;
        const subStat = subtopicStats.get(subKey) || {
          subject: t.subject,
          chapter: t.chapter,
          topic: t.topic,
          subtopic: t.subtopic,
          correct: 0,
          total: 0,
        };
        subStat.total += 1;
        if (isCorrect) subStat.correct += 1;
        subtopicStats.set(subKey, subStat);
      }
    });
  });

  const weakTopics = Array.from(topicStats.values())
    .map((t: any) => ({
      id: `${t.subject}-${t.chapter}-${t.topic}`,
      subject: t.subject,
      chapter: t.chapter,
      topic: t.topic,
      accuracy: calcAccuracyScore(t.correct, t.total),
      attempts: t.total,
    }))
    .sort((a: any, b: any) => a.accuracy - b.accuracy)
    .slice(0, 6);

  const strongTopics = Array.from(topicStats.values())
    .map((t: any) => ({
      id: `${t.subject}-${t.chapter}-${t.topic}`,
      subject: t.subject,
      chapter: t.chapter,
      topic: t.topic,
      accuracy: calcAccuracyScore(t.correct, t.total),
      attempts: t.total,
    }))
    .sort((a: any, b: any) => b.accuracy - a.accuracy)
    .slice(0, 6);

  const weakSubtopics = Array.from(subtopicStats.values())
    .map((t: any) => ({
      id: `${t.subject}-${t.chapter}-${t.topic}-${t.subtopic}`,
      subject: t.subject,
      chapter: t.chapter,
      topic: t.topic,
      subtopic: t.subtopic,
      accuracy: calcAccuracyScore(t.correct, t.total),
      attempts: t.total,
    }))
    .sort((a: any, b: any) => a.accuracy - b.accuracy)
    .slice(0, 6);

  const studentProfile = await StudentProfile.findById(req.params.id).populate(
    "user",
    "firstName lastName avatarUrl",
  );
  const populatedUser = studentProfile?.user as
    | { firstName?: string; lastName?: string; avatarUrl?: string }
    | undefined;

  return res.json({
    student: {
      id: String(studentProfile?._id || req.params.id),
      name: populatedUser
        ? `${populatedUser.firstName || ""} ${populatedUser.lastName || ""}`.trim()
        : "Student",
      grade: studentProfile?.grade || 0,
      board: studentProfile?.board || "",
      avatarUrl: studentProfile?.avatarUrl || populatedUser?.avatarUrl || "",
    },
    stats: {
      testsTaken,
      averageScore,
      accuracy,
      avgTimePerQuestionSec,
    },
    scoreTrend,
    subjectPerformance,
    weakTopics,
    strongTopics,
    weakSubtopics,
    recentTests,
    assignedTests,
    pendingTestsCount: pendingTests.length,
    focusInsights: [],
    motivation: {
      id: "m1",
      tone: "motivational",
      title: "Keep it up",
      description: "Consistent practice drives results.",
    },
  });
}
