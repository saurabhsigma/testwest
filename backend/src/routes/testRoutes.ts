import { Router } from "express";
import { z } from "zod";
import {
  createTest,
  listTests,
  getTest,
  autosaveResponse,
  submitTest,
  generateTestSeries,
} from "../controllers/testController";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";

const router = Router();

const createSchema = z.object({
  body: z.object({
    studentId: z.string().min(1),
    board: z.string().optional(),
    grade: z.number().optional(),
    subject: z.string().min(1),
    chapter: z.string().optional(),
    topic: z.string().optional(),
    subtopic: z.string().optional(),
    difficulty: z.enum(["Easy", "Medium", "Hard"]),
    questionTypes: z.array(z.string()).optional(),
    count: z.number().min(1).max(100).optional(),
  }),
});

const responseSchema = z.object({
  body: z.object({
    givenAnswer: z.any().optional(),
    timeSpentSeconds: z.number().optional(),
    flagged: z.boolean().optional(),
  }),
});

/**
 * @openapi
 * /tests:
 *   get:
 *     summary: List tests for the authenticated user
 *     tags:
 *       - Tests
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *     responses:
 *       '200':
 *         description: A list of tests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tests:
 *                   type: array
 *                   items:
 *                     type: object
 *       '400':
 *         description: Bad request
 *       '401':
 *         description: Missing or invalid token
 *       '500':
 *         description: Server error
 */
router.get("/", requireAuth, listTests);

/**
 * @openapi
 * /tests:
 *   post:
 *     summary: Create a test
 *     tags: [Tests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TestCreateRequest'
 *     responses:
 *       '201': { description: Test created }
 */
router.post("/", requireAuth, validate(createSchema), createTest);

/**
 * @openapi
 * /tests/{id}:
 *   get:
 *     summary: Get a test by ID
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200': { description: Test object }
 */
router.get("/:id", requireAuth, getTest);

/**
 * @openapi
 * /tests/{id}/responses/{qid}:
 *   patch:
 *     summary: Autosave a test response
 *     tags: [Tests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TestResponsePatchRequest'
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: qid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200': { description: Response saved }
 */
router.patch("/:id/responses/:qid", requireAuth, validate(responseSchema), autosaveResponse);

/**
 * @openapi
 * /tests/{id}/submit:
 *   post:
 *     summary: Submit a test
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200': { description: Test submitted }
 */
router.post("/:id/submit", requireAuth, submitTest);

/**
 * @openapi
 * /tests/generate-ai:
 *   post:
 *     summary: Generate an AI test series
 *     tags: [Tests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TestCreateRequest'
 *     responses:
 *       '200': { description: AI generated test series }
 */
router.post("/generate-ai", requireAuth, validate(createSchema), generateTestSeries);

export default router;
