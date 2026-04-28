import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Test } from "../models/Test";
import { Question } from "../models/Question";
import { StudentProfile } from "../models/StudentProfile";
import { TeacherProfile } from "../models/TeacherProfile";
import { getPagination } from "../middleware/pagination";
import { generateQuestions } from "../services/aiService";

function sanitizeTest(test: any) {
  const sanitized = test.toObject ? test.toObject() : JSON.parse(JSON.stringify(test));
  if (sanitized.status !== "Completed") {
    sanitized.questions = sanitized.questions.map((q: any) => {
      // Use destructuring to ensure we get all data except sensitive fields
      const { answer, explanation, ...rest } = q;
      return rest;
    });
  }
  return sanitized;
}

export async function createTest(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      studentId,
      board,
      grade,
      subject,
      chapter,
      topic,
      subtopic,
      difficulty,
      questionTypes,
      count,
    } = req.body;

    // ============================================
    // ROLE-BASED TEST CREATION PERMISSION CHECKS
    // ============================================

    // 1. SOLO users can only create tests for themselves
    if (user.role === "SOLO") {
      const soloProfile = await StudentProfile.findOne({ user: user._id });
      if (!soloProfile || soloProfile._id.toString() !== studentId) {
        return res.status(403).json({ error: "Solo users can only create tests for themselves" });
      }
    }

    // 2. STUDENT role with schoolId CANNOT create their own tests
    //    (School-connected students can only take assigned tests)
    if (user.role === "STUDENT") {
      const studentProfile = await StudentProfile.findOne({ user: user._id });
      if (studentProfile?.schoolId) {
        return res.status(403).json({ 
          error: "School-connected students cannot create their own tests. Please wait for tests assigned by your teacher or school." 
        });
      }
      // Independent students (no schoolId) can create tests for themselves only
      if (!studentProfile || studentProfile._id.toString() !== studentId) {
        return res.status(403).json({ error: "Students can only create tests for themselves" });
      }
    }

    // 3. TEACHER can create tests for students in their classes
    if (user.role === "TEACHER") {
      const teacherProfile = await TeacherProfile.findOne({ user: user._id });
      if (!teacherProfile) {
        return res.status(403).json({ error: "Teacher profile not found" });
      }
      // Verify the target student belongs to one of the teacher's classes
      const targetStudent = await StudentProfile.findById(studentId);
      if (!targetStudent) {
        return res.status(404).json({ error: "Student not found" });
      }
      // Check if student's class is in teacher's classIds
      const teacherClassIds = (teacherProfile.classIds || []).map((id: any) => id.toString());
      if (targetStudent.classId && !teacherClassIds.includes(targetStudent.classId.toString())) {
        return res.status(403).json({ error: "You can only create tests for students in your classes" });
      }
    }

    // 4. SCHOOL can create tests for any student in their school
    if (user.role === "SCHOOL") {
      const targetStudent = await StudentProfile.findById(studentId);
      if (!targetStudent) {
        return res.status(404).json({ error: "Student not found" });
      }
      // Verify student belongs to this school
      if (!user.schoolId || !targetStudent.schoolId || 
          user.schoolId.toString() !== targetStudent.schoolId.toString()) {
        return res.status(403).json({ error: "You can only create tests for students in your school" });
      }
    }

    // 5. PARENT cannot create tests
    if (user.role === "PARENT") {
      return res.status(403).json({ error: "Parents cannot create tests" });
    }

    // ============================================
    // PROCEED WITH TEST CREATION
    // ============================================

    const query: Record<string, unknown> = {};
    if (board) query.board = board;
    if (grade) query.grade = grade;
    if (subject) query.subject = subject;
    if (chapter) query.chapter = chapter;
    if (topic) query.topic = topic;
    if (subtopic) query.subtopic = subtopic;
    if (difficulty) query.difficulty = difficulty;
    if (questionTypes && questionTypes.length) query.type = { $in: questionTypes };

    const questions = await Question.aggregate([
      { $match: query },
      { $sample: { size: Number(count) || 10 } },
    ]);

    if (!questions.length) {
      return res.status(400).json({ error: "No questions found for the given criteria" });
    }

    const testQuestions = questions.map((q: any) => ({
      originalQuestionId: q._id,
      type: q.type || "MCQ",
      body: q.body,
      options: q.options || [],
      answer: q.answer,
      explanation: q.explanation || "",
    }));

    const test = await Test.create({
      studentId,
      subject,
      chapter,
      topic,
      subtopic,
      difficulty,
      status: "Pending",
      questions: testQuestions,
      createdBy: user._id, // Track who created the test
    });

    return res.status(201).json(sanitizeTest(test));
  } catch (error) {
    console.error("Error creating test:", error);
    return res.status(500).json({ error: "Failed to create test" });
  }
}

export async function listTests(req: Request, res: Response) {
  try {
    const { page, limit, skip } = getPagination(req.query as Record<string, unknown>);
    const filter: Record<string, unknown> = {};
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.subject) filter.subject = req.query.subject;

    const [total, tests] = await Promise.all([
      Test.countDocuments(filter),
      Test.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    return res.json({ data: tests.map(sanitizeTest), page, limit, total });
  } catch (error) {
    console.error("Error listing tests:", error);
    return res.status(500).json({ error: "Failed to list tests" });
  }
}

export async function getTest(req: Request, res: Response) {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ error: "Test not found" });
    
    const questionCount = (test as any).questionCount || 10;
    
    // If test has no questions (assigned test not yet started), generate them
    if (test.questions.length === 0 && test.assignmentId) {
      // Build query for questions
      const query: Record<string, unknown> = {};
      if (test.subject) query.subject = test.subject;
      if (test.chapter) query.chapter = test.chapter;
      if (test.topic) query.topic = test.topic;
      if (test.difficulty) query.difficulty = test.difficulty;

      // Try to find questions from database
      const questions = await Question.aggregate([
        { $match: query },
        { $sample: { size: questionCount } },
      ]);

      if (questions.length > 0) {
        test.questions = questions.map((q: any) => ({
          originalQuestionId: q._id,
          type: q.type || "MCQ",
          body: q.body,
          options: q.options || [],
          answer: q.answer,
          explanation: q.explanation || "",
        }));
        test.status = "In progress";
        await test.save();
      } else {
        // Try AI generation if no questions in DB
        try {
          const generatedQuestions = await generateQuestions({
            board: "CBSE",
            grade: 10,
            subject: test.subject,
            chapter: test.chapter || "General",
            topic: test.topic || "General",
            difficulty: test.difficulty as "Easy" | "Medium" | "Hard",
            count: questionCount,
            types: ["MCQ"], // Default to MCQ for assigned tests
          });
          
          if (generatedQuestions && generatedQuestions.length > 0) {
            test.questions = generatedQuestions.map((q: any) => ({
              originalQuestionId: q._id,
              type: q.type || "MCQ",
              body: q.body,
              options: q.options || [],
              answer: q.answer,
              explanation: q.explanation || "",
            }));
            test.status = "In progress";
            await test.save();
          } else {
            return res.status(400).json({ error: "Could not generate questions. Please try again." });
          }
        } catch (aiError: any) {
          console.error("AI generation failed:", aiError?.message || aiError);
          return res.status(400).json({ error: "AI question generation failed. Please try again later." });
        }
      }
    }
    
    return res.json(sanitizeTest(test));
  } catch (error) {
    console.error("Error getting test:", error);
    return res.status(500).json({ error: "Failed to get test" });
  }
}

export async function autosaveResponse(req: Request, res: Response) {
  try {
    const { givenAnswer, timeSpentSeconds, flagged } = req.body;
    const updateObj: Record<string, unknown> = {};
    if (givenAnswer !== undefined) updateObj["questions.$.givenAnswer"] = givenAnswer;
    if (timeSpentSeconds !== undefined) updateObj["questions.$.timeSpentSeconds"] = timeSpentSeconds;
    if (flagged !== undefined) updateObj["questions.$.flagged"] = flagged;

    const test = await Test.findOneAndUpdate(
      { _id: req.params.id, "questions._id": req.params.qid },
      { $set: updateObj, status: "In progress" },
      { new: true },
    );

    if (!test) return res.status(404).json({ error: "Test or question not found" });
    return res.json(sanitizeTest(test));
  } catch (error) {
    console.error("Error saving response:", error);
    return res.status(500).json({ error: "Failed to save response" });
  }
}

export async function submitTest(req: Request, res: Response) {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ error: "Test not found" });

    let correctCount = 0;
    let answered = 0;
    test.questions.forEach((q: any) => {
      if (q.givenAnswer === null || q.givenAnswer === undefined) return;
      answered += 1;
      const correct = JSON.stringify(q.givenAnswer) === JSON.stringify(q.answer);
      q.isCorrect = correct;
      if (correct) correctCount += 1;
    });

    test.status = "Completed";
    test.score = test.questions.length ? Math.round((correctCount / test.questions.length) * 100) : 0;
    test.accuracy = answered ? Math.round((correctCount / answered) * 100) : 0;
    test.submittedAt = new Date();

    await test.save();
    return res.json(test);
  } catch (error) {
    console.error("Error submitting test:", error);
    return res.status(500).json({ error: "Failed to submit test" });
  }
}

export async function generateTestSeries(req: Request, res: Response) {
  const {
    studentId,
    board,
    grade,
    subject,
    chapter,
    topic,
    subtopic,
    difficulty,
    questionTypes,
    count,
  } = req.body;

  try {
    // 1. Generate questions using AI
    const questions = await generateQuestions({
      board,
      grade,
      subject,
      chapter,
      topic,
      subtopic,
      difficulty: difficulty || "Medium",
      count: Number(count) || 5,
      types: questionTypes && questionTypes.length ? questionTypes : ["MCQ"],
    });

    // 2. Create the test
    const testQuestions = questions.map((q: any) => ({
      originalQuestionId: q._id,
      body: q.body,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
    }));

    const test = await Test.create({
      studentId,
      subject,
      chapter,
      topic,
      subtopic,
      difficulty,
      status: "Pending",
      questions: testQuestions,
    });

    return res.status(201).json(sanitizeTest(test));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
