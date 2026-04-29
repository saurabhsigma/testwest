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

/**
 * @openapi
 * /parents:
 *   get:
 *     summary: List parents
 *     tags: [Parents]
 *     responses:
 *       '200': { description: Parent list }
 */
router.get("/", requireAuth, listParents);

/**
 * @openapi
 * /parents:
 *   post:
 *     summary: Create a parent
 *     tags: [Parents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParentCreateRequest'
 *     responses:
 *       '201': { description: Parent created }
 */
router.post("/", validate(createSchema), createParent);

/**
 * @openapi
 * /parents/{id}/children:
 *   get:
 *     summary: List children linked to a parent
 *     tags: [Parents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200': { description: Child list }
 */
router.get("/:id/children", requireAuth, getParentChildren);

/**
 * @openapi
 * /parents/{id}/children/{childId}/dashboard:
 *   get:
 *     summary: Get a linked child's dashboard
 *     tags: [Parents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: childId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200': { description: Dashboard data }
 */
router.get("/:id/children/:childId/dashboard", requireAuth, getParentDashboard);

/**
 * @openapi
 * /parents/{id}:
 *   get:
 *     summary: Get a parent by ID
 *     tags: [Parents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200': { description: Parent object }
 */
router.get("/:id", requireAuth, getParent);

/**
 * @openapi
 * /parents/{id}:
 *   patch:
 *     summary: Update a parent
 *     tags: [Parents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParentUpdateRequest'
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200': { description: Parent updated }
 */
router.patch("/:id", requireAuth, validate(updateSchema), updateParent);

/**
 * @openapi
 * /parents/{id}/verify-student:
 *   post:
 *     summary: Verify a student for linking
 *     tags: [Parents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParentVerifyStudentRequest'
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200': { description: Verification result }
 */
router.post("/:id/verify-student", requireAuth, validate(verifyStudentSchema), verifyStudent);

/**
 * @openapi
 * /parents/{id}/link-student:
 *   post:
 *     summary: Link a student to a parent
 *     tags: [Parents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParentLinkStudentRequest'
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200': { description: Student linked }
 */
router.post("/:id/link-student", requireAuth, validate(linkChildSchema), linkChild);

/**
 * @openapi
 * /parents/{id}:
 *   delete:
 *     summary: Delete a parent
 *     tags: [Parents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '204': { description: Deleted }
 */
router.delete("/:id", requireAuth, deleteParent);

export default router;
