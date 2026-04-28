import { Router } from "express";
import { z } from "zod";
import {
  listParents,
  getParent,
  createParent,
  updateParent,
  deleteParent,
  getParentChildren,
  getParentDashboard,
  linkChild,
  verifyStudent,
} from "../controllers/parentController";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";

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
    children: z.array(z.string()).optional(),
  }),
});

const linkChildSchema = z.object({
  body: z.object({
    studentId: z.string().min(1, "Student email or ID is required"),
    studentPassword: z.string().min(1, "Student password is required"),
  }),
});

const verifyStudentSchema = z.object({
  body: z.object({
    studentEmail: z.string().min(1, "Student email is required"),
  }),
});

router.get("/", requireAuth, listParents);
router.post("/", validate(createSchema), createParent);
router.get("/:id/children", requireAuth, getParentChildren);
router.get("/:id/children/:childId/dashboard", requireAuth, getParentDashboard);
router.get("/:id", requireAuth, getParent);
router.patch("/:id", requireAuth, validate(updateSchema), updateParent);
router.post("/:id/verify-student", requireAuth, validate(verifyStudentSchema), verifyStudent);
router.post("/:id/link-student", requireAuth, validate(linkChildSchema), linkChild);
router.delete("/:id", requireAuth, deleteParent);

export default router;
