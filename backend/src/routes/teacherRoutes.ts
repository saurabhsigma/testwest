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

router.get("/", requireAuth, listTeachers);
router.post("/", requireAuth, requireRole(["SCHOOL"]), validate(createSchema), createTeacher);
router.get("/:id", requireAuth, getTeacher);
router.patch("/:id", requireAuth, validate(updateSchema), updateTeacher);
router.delete("/:id", requireAuth, requireRole(["SCHOOL"]), deleteTeacher);
router.get("/:id/stats", requireAuth, getTeacherStats);
router.get("/:id/classes", requireAuth, getTeacherClasses);
router.get("/:id/students", requireAuth, getTeacherStudents);
router.get("/:id/analytics/subjects", requireAuth, getTeacherSubjectAnalytics);
router.get("/:id/analytics/topics", requireAuth, getTeacherTopicMastery);

export default router;
