import { Router } from "express";
import {
  getBoards,
  getGrades,
  getSubjects,
  getChapters,
  getTopics,
  getSubtopics,
  getQuestionCount,
} from "../controllers/curriculumController";

const router = Router();

/** @openapi
 * /curriculum/boards:
 *   get:
 *     summary: List boards
 *     tags: [Curriculum]
 *     responses:
 *       '200': { description: Board list }
 */
router.get("/boards", getBoards);
router.get("/grades", getGrades);
router.get("/subjects", getSubjects);
router.get("/chapters", getChapters);
router.get("/topics", getTopics);
router.get("/subtopics", getSubtopics);
router.get("/questions/count", getQuestionCount);

export default router;
