import type { Request, Response } from "express";
import { Question } from "../models/Question";

export async function getBoards(req: Request, res: Response) {
  const boards = await Question.distinct("board");
  return res.json(boards);
}

export async function getGrades(req: Request, res: Response) {
  const grades = await Question.distinct("grade");
  return res.json(grades.sort((a, b) => a - b));
}

export async function getSubjects(req: Request, res: Response) {
  const filter: Record<string, unknown> = {};
  if (req.query.grade) filter.grade = Number(req.query.grade);
  if (req.query.board) filter.board = req.query.board;
  const subjects = await Question.distinct("subject", filter);
  return res.json(subjects);
}

export async function getChapters(req: Request, res: Response) {
  const filter: Record<string, unknown> = {};
  if (req.query.grade) filter.grade = Number(req.query.grade);
  if (req.query.board) filter.board = req.query.board;
  if (req.query.subject) filter.subject = req.query.subject;
  const chapters = await Question.distinct("chapter", filter);
  return res.json(chapters);
}

export async function getTopics(req: Request, res: Response) {
  const filter: Record<string, unknown> = {};
  if (req.query.chapter) filter.chapter = req.query.chapter;
  if (req.query.subject) filter.subject = req.query.subject;
  const topics = await Question.distinct("topic", filter);
  return res.json(topics);
}

export async function getSubtopics(req: Request, res: Response) {
  const filter: Record<string, unknown> = {};
  if (req.query.topic) filter.topic = req.query.topic;
  if (req.query.chapter) filter.chapter = req.query.chapter;
  const subtopics = await Question.distinct("subtopic", filter);
  return res.json(subtopics);
}

export async function getQuestionCount(req: Request, res: Response) {
  const filter: Record<string, unknown> = {};
  if (req.query.subtopic) filter.subtopic = req.query.subtopic;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.difficulty) filter.difficulty = req.query.difficulty;
  const count = await Question.countDocuments(filter);
  return res.json({ count });
}
