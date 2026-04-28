import { Router } from "express";
import { z } from "zod";
import {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  listStudentTests,
  getStudentDashboard,
} from "../controllers/studentController";
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
      grade: z.number().min(1).max(12),
      board: z.string().min(1),
      avatarUrl: z.string().optional(),
      schoolId: z.string().optional(),
      classId: z.string().optional(),
      section: z.string().optional(),
      rollNo: z.string().optional(),
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
        grade: z.number().min(1).max(12).optional(),
        board: z.string().optional(),
        avatarUrl: z.string().optional(),
        schoolId: z.string().optional(),
        classId: z.string().optional(),
        section: z.string().optional(),
        rollNo: z.string().optional(),
      })
      .optional(),
  }),
});

router.get("/", requireAuth, listStudents);
router.post("/", requireAuth, requireRole(["SCHOOL"]), validate(createSchema), createStudent);
router.get("/:id", requireAuth, getStudent);
router.patch("/:id", requireAuth, validate(updateSchema), updateStudent);
router.delete("/:id", requireAuth, requireRole(["SCHOOL"]), deleteStudent);
router.get("/:id/tests", requireAuth, listStudentTests);
router.get("/:id/dashboard", requireAuth, getStudentDashboard);

export default router;
