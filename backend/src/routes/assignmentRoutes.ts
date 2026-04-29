import { Router } from "express";
import { z } from "zod";
import {
  listAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentResults,
} from "../controllers/teacherController";
import { validate } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

const createSchema = z.object({
  body: z.object({
    teacherId: z.string(),
    schoolId: z.string().optional(),
    title: z.string().min(1),
    subject: z.string().min(1),
    chapter: z.string().optional(),
    topic: z.string().optional(),
    questionCount: z.number().min(1),
    difficulty: z.enum(["Easy", "Medium", "Hard"]),
    dueDate: z.string(),
    target: z.object({
      type: z.enum(["class", "students", "group"]),
      classIds: z.array(z.string()).optional(),
      studentIds: z.array(z.string()).optional(),
      groupId: z.string().optional(),
      targetLabel: z.string().optional(),
    }),
  }),
});

const updateSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    subject: z.string().optional(),
    chapter: z.string().optional(),
    topic: z.string().optional(),
    questionCount: z.number().optional(),
    difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
    dueDate: z.string().optional(),
    target: z
      .object({
        type: z.enum(["class", "students", "group"]).optional(),
        classIds: z.array(z.string()).optional(),
        studentIds: z.array(z.string()).optional(),
        groupId: z.string().optional(),
        targetLabel: z.string().optional(),
      })
      .optional(),
    totalStudents: z.number().optional(),
    submitted: z.number().optional(),
    inProgress: z.number().optional(),
    notStarted: z.number().optional(),
    averageScore: z.number().optional(),
    status: z.enum(["Assigned", "In progress", "Completed", "Overdue"]).optional(),
  }),
});

/**
 * @openapi
 * /assignments:
 *   get:
 *     summary: List assignments
 *     tags: [Assignments]
 *     responses:
 *       '200': { description: Assignment list }
 */
router.get("/", requireAuth, listAssignments);
/**
 * @openapi
 * /assignments/{id}/results:
 *   get:
 *     summary: Get assignment results
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200': { description: Assignment results }
 */
router.get("/:id/results", requireAuth, requireRole(["SCHOOL", "TEACHER"]), getAssignmentResults);

/**
 * @openapi
 * /assignments:
 *   post:
 *     summary: Create an assignment
 *     tags: [Assignments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignmentCreateRequest'
 *     responses:
 *       '201': { description: Assignment created }
 */
router.post("/", requireAuth, requireRole(["SCHOOL", "TEACHER"]), validate(createSchema), createAssignment);

/**
 * @openapi
 * /assignments/{id}:
 *   patch:
 *     summary: Update an assignment
 *     tags: [Assignments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignmentUpdateRequest'
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200': { description: Assignment updated }
 */
router.patch("/:id", requireAuth, requireRole(["SCHOOL", "TEACHER"]), validate(updateSchema), updateAssignment);

/**
 * @openapi
 * /assignments/{id}:
 *   delete:
 *     summary: Delete an assignment
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '204': { description: Deleted }
 */
router.delete("/:id", requireAuth, requireRole(["SCHOOL", "TEACHER"]), deleteAssignment);

export default router;
