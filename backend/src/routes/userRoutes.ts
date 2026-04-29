import { Router } from "express";
import { z } from "zod";
import { getMe, updateMe } from "../controllers/userController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

const updateSchema = z.object({
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    avatarUrl: z.string().optional(),
    bio: z.string().optional(),
    phone: z.string().optional(),
    city: z.string().optional(),
  }),
});

/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Get profile of the authenticated user
 *     tags:
 *       - Users
 *     responses:
 *       '200':
 *         description: User profile
 *       '401':
 *         description: Missing or invalid token
 */
router.get("/me", requireAuth, getMe);

/**
 * @openapi
 * /users/me:
 *   patch:
 *     summary: Update profile of the authenticated user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       '200':
 *         description: Updated user profile
 *       '400':
 *         description: Validation error
 */
router.patch("/me", requireAuth, validate(updateSchema), updateMe);

export default router;
