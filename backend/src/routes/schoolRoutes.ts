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
router.patch("/:id", requireAuth, requireRole(["SCHOOL"]), validate(schoolUpdateSchema), updateSchool);
router.delete("/:id", requireAuth, requireRole(["SCHOOL"]), deleteSchool);
router.get("/:id/stats", requireAuth, getSchoolStats);
router.get("/:id/teachers", requireAuth, listTeachers);
router.get("/:id/students", requireAuth, listStudents);
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

router.post("/:id/teachers", requireAuth, requireRole(["SCHOOL"]), validate(createTeacherSchema), createTeacherForSchool);

router.get("/:id/classes", requireAuth, listClasses);
router.post("/:id/classes", requireAuth, requireRole(["SCHOOL"]), validate(classSchema), createClass);
router.patch("/:id/classes/:classId", requireAuth, requireRole(["SCHOOL"]), validate(classUpdateSchema), updateClass);
router.delete("/:id/classes/:classId", requireAuth, requireRole(["SCHOOL"]), deleteClass);
router.get("/:id/classes/:classId/students", requireAuth, getClassStudents);

export default router;
