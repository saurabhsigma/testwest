import { Router } from "express";
import { z } from "zod";
import {
  listQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../controllers/questionController";
import { validate } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

const createSchema = z.object({
  body: z.object({
    board: z.string().min(1),
    grade: z.number().min(1).max(12),
    subject: z.string().min(1),
    chapter: z.string().min(1),
    topic: z.string().min(1),
    subtopic: z.string().min(1),
    type: z.enum(["MCQ", "MSQ", "Fill in the blanks", "Short answer"]),
    difficulty: z.enum(["Easy", "Medium", "Hard"]),
    body: z.string().min(1),
    options: z.any().optional(),
    answer: z.any(),
    explanation: z.string().optional(),
  }),
});

const updateSchema = z.object({
  body: z.object({
    board: z.string().optional(),
    grade: z.number().min(1).max(12).optional(),
    subject: z.string().optional(),
    chapter: z.string().optional(),
    topic: z.string().optional(),
    subtopic: z.string().optional(),
    type: z.enum(["MCQ", "MSQ", "Fill in the blanks", "Short answer"]).optional(),
    difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
    body: z.string().optional(),
    options: z.any().optional(),
    answer: z.any().optional(),
    explanation: z.string().optional(),
  }),
});

/**
 * @openapi
 * /questions:
 *   get:
 *     summary: List questions
 *     tags:
 *       - Questions
 *     responses:
 *       '200':
 *         description: Array of questions
 */
router.get("/", requireAuth, listQuestions);

/**
 * @openapi
 * /questions:
 *   post:
 *     summary: Create a question (teacher or school role required)
 *     tags:
 *       - Questions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuestionCreateRequest'
 *     responses:
 *       '201':
 *         description: Question created
 */
router.post("/", requireAuth, requireRole(["SCHOOL", "TEACHER"]), validate(createSchema), createQuestion);

/**
 * @openapi
 * /questions/{id}:
 *   get:
 *     summary: Get a question by ID
 *     tags:
 *       - Questions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Question object
 */
router.get("/:id", requireAuth, getQuestion);

/**
 * @openapi
 * /questions/{id}:
 *   patch:
 *     summary: Update a question
 *     tags:
 *       - Questions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuestionUpdateRequest'
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Updated question
 */
router.patch("/:id", requireAuth, requireRole(["SCHOOL", "TEACHER"]), validate(updateSchema), updateQuestion);

/**
 * @openapi
 * /questions/{id}:
 *   delete:
 *     summary: Delete a question
 *     tags:
 *       - Questions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '204':
 *         description: Deleted
 */
router.delete("/:id", requireAuth, requireRole(["SCHOOL", "TEACHER"]), deleteQuestion);

export default router;
