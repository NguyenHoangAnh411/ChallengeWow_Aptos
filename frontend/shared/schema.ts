import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  walletAddress: text("wallet_address").unique(),
  totalScore: integer("total_score").default(0),
  gamesWon: integer("games_won").default(0),
  rank: integer("rank").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  roomCode: text("room_code").notNull().unique(),
  hostId: integer("host_id").references(() => users.id),
  status: text("status").notNull().default("waiting"), // waiting, active, completed
  maxPlayers: integer("max_players").default(4),
  currentPlayers: integer("current_players").default(0),
  prize: integer("prize").default(100),
  duration: integer("duration").default(180), // 3 minutes in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  options: jsonb("options").notNull(), // Array of answer options
  correctAnswer: text("correct_answer").notNull(),
  category: text("category").default("general"),
  difficulty: text("difficulty").default("medium"),
});

export const gameInstances = pgTable("game_instances", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => rooms.id),
  currentQuestionId: integer("current_question_id").references(() => questions.id),
  questionNumber: integer("question_number").default(1),
  timeRemaining: integer("time_remaining").default(15),
  status: text("status").notNull().default("waiting"), // waiting, active, completed
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const playerAnswers = pgTable("player_answers", {
  id: serial("id").primaryKey(),
  gameInstanceId: integer("game_instance_id").references(() => gameInstances.id),
  playerId: integer("player_id").references(() => users.id),
  questionId: integer("question_id").references(() => questions.id),
  answer: text("answer").notNull(),
  isCorrect: boolean("is_correct").default(false),
  responseTime: integer("response_time"), // in seconds
  score: integer("score").default(0),
  answeredAt: timestamp("answered_at").defaultNow(),
});

export const roomParticipants = pgTable("room_participants", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => rooms.id),
  playerId: integer("player_id").references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  status: text("status").default("active"), // active, disconnected
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertGameInstanceSchema = createInsertSchema(gameInstances).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertPlayerAnswerSchema = createInsertSchema(playerAnswers).omit({
  id: true,
  answeredAt: true,
});

export const insertRoomParticipantSchema = createInsertSchema(roomParticipants).omit({
  id: true,
  joinedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type GameInstance = typeof gameInstances.$inferSelect;
export type InsertGameInstance = z.infer<typeof insertGameInstanceSchema>;
export type PlayerAnswer = typeof playerAnswers.$inferSelect;
export type InsertPlayerAnswer = z.infer<typeof insertPlayerAnswerSchema>;
export type RoomParticipant = typeof roomParticipants.$inferSelect;
export type InsertRoomParticipant = z.infer<typeof insertRoomParticipantSchema>;
