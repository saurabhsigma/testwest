import { Router } from "express";
import { z } from "zod";
import {
  listSchools,
  getSchool,
  createSchool,
  updateSchool,
  deleteSchool,
  listClasses,
  createClass,
  updateClass,
  deleteClass,
  getClassStudents,
  getSchoolStats,
  listTeachers,
  createStudentForSchool,
  createTeacherForSchool,
  listStudents,
} from "../controllers/schoolController";
import { validate } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

const schoolSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    board: z.string().min(1),
    city: z.string().optional(),
    principal: z.string().optional(),
  }),
});

const schoolUpdateSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    board: z.string().optional(),
    city: z.string().optional(),
    principal: z.string().optional(),
  }),
});

const classSchema = z.object({
  body: z.object({
    grade: z.number().min(1).max(12),
    section: z.string().min(1),
    teacherId: z.string().optional(),
  }),
});

const classUpdateSchema = z.object({
  body: z.object({
    grade: z.number().min(1).max(12).optional(),
    section: z.string().optional(),
    teacherId: z.string().optional(),
  }),
});

const createStudentSchema = z.object({
  body: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    grade: z.number().min(1).max(12),
    board: z.string().min(1),
    classId: z.string().optional(),
    section: z.string().optional(),
    rollNo: z.string().optional(),
  }),
});

/**
 * @openapi
 * /schools:
 *   get:
 *     summary: List schools
 *     tags: [Schools]
 *     responses:
 *       '200': { description: School list }
 */
router.get("/", requireAuth, listSchools);
/**
 * @openapi
 * /schools:
 *   post:
 *     summary: Create a school
 *     tags: [Schools]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SchoolCreateRequest'
 *     responses:
 *       '201': { description: School created }
 *       '400': { description: Validation error }
 */
router.post("/", requireAuth, requireRole(["SCHOOL"]), validate(schoolSchema), createSchool);

/**
 * @openapi
 * /schools/{id}:
 *   get:
 *     summary: Get a school by ID
 *     tags: [Schools]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200': { description: School object }
 */
router.get("/:id", requireAuth, getSchool);
/**
 * @openapi
 * /schools/{id}:
 *   patch:
 *     summary: Update a school
 *     tags: [Schools]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SchoolUpdateRequest'
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200': { description: School updated }
 */
router.patch("/:id", requireAuth, requireRole(["SCHOOL"]), validate(schoolUpdateSchema), updateSchool);

/**
 * @openapi
 * /schools/{id}:
 *   delete:
 *     summary: Delete a school
 *     tags: [Schools]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '204': { description: Deleted }
 */
router.delete("/:id", requireAuth, requireRole(["SCHOOL"]), deleteSchool);
router.get("/:id/stats", requireAuth, getSchoolStats);
router.get("/:id/teachers", requireAuth, listTeachers);
router.get("/:id/students", requireAuth, listStudents);
/**
 * @openapi
 * /schools/{id}/students:
 *   post:
 *     summary: Create a student under a school
 *     tags: [Schools]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentCreateRequest'
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '201': { description: Student created }
 */
router.post("/:id/students", requireAuth, requireRole(["SCHOOL"]), validate(createStudentSchema), createStudentForSchool);

const createTeacherSchema = z.object({
  body: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    subjects: z.array(z.string()).optional(),
    classIds: z.array(z.string()).optional(),
    experienceYears: z.number().min(0).optional(),
  }),
});

/**
 * @openapi
 * /schools/{id}/teachers:
 *   post:
 *     summary: Create a teacher under a school
 *     tags: [Schools]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TeacherCreateRequest'
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '201': { description: Teacher created }
 */
router.post("/:id/teachers", requireAuth, requireRole(["SCHOOL"]), validate(createTeacherSchema), createTeacherForSchool);

router.get("/:id/classes", requireAuth, listClasses);
/**
 * @openapi
 * /schools/{id}/classes:
 *   post:
 *     summary: Create a class under a school
 *     tags: [Schools]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClassCreateRequest'
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '201': { description: Class created }
 */
router.post("/:id/classes", requireAuth, requireRole(["SCHOOL"]), validate(classSchema), createClass);

/**
 * @openapi
 * /schools/{id}/classes/{classId}:
 *   patch:
 *     summary: Update a class under a school
 *     tags: [Schools]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClassUpdateRequest'
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: classId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200': { description: Class updated }
 */
router.patch("/:id/classes/:classId", requireAuth, requireRole(["SCHOOL"]), validate(classUpdateSchema), updateClass);

/**
 * @openapi
 * /schools/{id}/classes/{classId}:
 *   delete:
 *     summary: Delete a class under a school
 *     tags: [Schools]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: classId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '204': { description: Deleted }
 */
router.delete("/:id/classes/:classId", requireAuth, requireRole(["SCHOOL"]), deleteClass);
router.get("/:id/classes/:classId/students", requireAuth, getClassStudents);

export default router;
