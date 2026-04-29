import { Router } from "express";
import { z } from "zod";
import {
  listTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherStats,
  getTeacherClasses,
  getTeacherStudents,
  getTeacherSubjectAnalytics,
  getTeacherTopicMastery,
} from "../controllers/teacherController";
import { validate } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

const createSchema = z.object({
  body: z.object({
    user: z.object({
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      avatarUrl: z.string().optional(),
      bio: z.string().optional(),
      phone: z.string().optional(),
      city: z.string().optional(),
    }),
    profile: z.object({
      subjects: z.array(z.string()).optional(),
      classIds: z.array(z.string()).optional(),
      schoolId: z.string().optional(),
      experienceYears: z.number().optional(),
    }),
  }),
});

const updateSchema = z.object({
  body: z.object({
    user: z
      .object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        avatarUrl: z.string().optional(),
        bio: z.string().optional(),
        phone: z.string().optional(),
        city: z.string().optional(),
      })
      .optional(),
    profile: z
      .object({
        subjects: z.array(z.string()).optional(),
        classIds: z.array(z.string()).optional(),
        schoolId: z.string().optional(),
        experienceYears: z.number().optional(),
      })
      .optional(),
  }),
});

/**
 * @openapi
 * /teachers:
 *   get:
 *     summary: List teachers
 *     tags: [Teachers]
 *     responses:
 *       '200': { description: Teacher list }
 */
router.get("/", requireAuth, listTeachers);
/**
 * @openapi
 * /teachers:
 *   post:
 *     summary: Create a teacher (school role required)
 *     tags: [Teachers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TeacherCreateRequest'
 *     responses:
 *       '201': { description: Teacher created }
 *       '400': { description: Validation error }
 */
router.post("/", requireAuth, requireRole(["SCHOOL"]), validate(createSchema), createTeacher);

/**
 * @openapi
 * /teachers/{id}:
 *   get:
 *     summary: Get a teacher by ID
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200': { description: Teacher object }
 */
router.get("/:id", requireAuth, getTeacher);
/**
 * @openapi
 * /teachers/{id}:
 *   patch:
 *     summary: Update a teacher
 *     tags: [Teachers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TeacherUpdateRequest'
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200': { description: Teacher updated }
 */
router.patch("/:id", requireAuth, validate(updateSchema), updateTeacher);

/**
 * @openapi
 * /teachers/{id}:
 *   delete:
 *     summary: Delete a teacher
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '204': { description: Deleted }
 */
router.delete("/:id", requireAuth, requireRole(["SCHOOL"]), deleteTeacher);

/**
 * @openapi
 * /teachers/{id}/stats:
 *   get:
 *     summary: Get teacher stats
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200': { description: Teacher stats }
 */
router.get("/:id/stats", requireAuth, getTeacherStats);
router.get("/:id/classes", requireAuth, getTeacherClasses);
router.get("/:id/students", requireAuth, getTeacherStudents);
router.get("/:id/analytics/subjects", requireAuth, getTeacherSubjectAnalytics);
router.get("/:id/analytics/topics", requireAuth, getTeacherTopicMastery);

export default router;
