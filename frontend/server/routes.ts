import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertRoomSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time features
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const roomSockets = new Map<string, Set<WebSocket>>();
  
  wss.on('connection', (ws) => {
    let currentRoom: string | null = null;
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join_room':
            if (currentRoom) {
              roomSockets.get(currentRoom)?.delete(ws);
            }
            currentRoom = message.roomId;
            if (!roomSockets.has(currentRoom)) {
              roomSockets.set(currentRoom, new Set());
            }
            roomSockets.get(currentRoom)?.add(ws);
            break;
            
          case 'leave_room':
            if (currentRoom) {
              roomSockets.get(currentRoom)?.delete(ws);
              currentRoom = null;
            }
            break;
            
          case 'submit_answer':
            if (currentRoom) {
              broadcastToRoom(currentRoom, {
                type: 'player_answered',
                playerId: message.playerId,
                responseTime: message.responseTime
              });
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      if (currentRoom) {
        roomSockets.get(currentRoom)?.delete(ws);
      }
    });
  });
  
  function broadcastToRoom(roomId: string, message: any) {
    const sockets = roomSockets.get(roomId);
    if (sockets) {
      sockets.forEach(socket => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(message));
        }
      });
    }
  }

  // API Routes
  
  // Create user
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  });

  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const players = await storage.getTopPlayers(limit);
    res.json(players);
  });

  // Create room
  app.post("/api/rooms", async (req, res) => {
    try {
      const roomData = insertRoomSchema.parse({
        ...req.body,
        roomCode: Math.random().toString(36).substring(2, 8).toUpperCase()
      });
      const room = await storage.createRoom(roomData);
      res.json(room);
    } catch (error) {
      res.status(400).json({ error: "Invalid room data" });
    }
  });

  // Get available rooms
  app.get("/api/rooms", async (req, res) => {
    const rooms = await storage.getAvailableRooms();
    res.json(rooms);
  });

  // Join room
  app.post("/api/rooms/:id/join", async (req, res) => {
    const roomId = parseInt(req.params.id);
    const { playerId } = req.body;
    
    const room = await storage.getRoom(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    
    if (room.currentPlayers >= room.maxPlayers) {
      return res.status(400).json({ error: "Room is full" });
    }
    
    await storage.addRoomParticipant({ roomId, playerId, status: "active" });
    await storage.updateRoomStatus(roomId, room.status, room.currentPlayers + 1);
    
    // Broadcast room update
    broadcastToRoom(room.roomCode, {
      type: 'player_joined',
      playerId,
      currentPlayers: room.currentPlayers + 1
    });
    
    res.json({ success: true });
  });

  // Get random questions
  app.get("/api/questions/random", async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const questions = await storage.getRandomQuestions(limit, category);
    res.json(questions);
  });

  // Submit answer
  app.post("/api/answers", async (req, res) => {
    try {
      const { gameInstanceId, playerId, questionId, answer, responseTime } = req.body;
      
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      
      const isCorrect = answer === question.correctAnswer;
      const score = isCorrect ? Math.max(0, 15 - responseTime) : 0;
      
      const playerAnswer = await storage.createPlayerAnswer({
        gameInstanceId,
        playerId,
        questionId,
        answer,
        isCorrect,
        responseTime,
        score
      });
      
      // Update user total score
      await storage.updateUserScore(playerId, score);
      
      res.json({ playerAnswer, isCorrect, score });
    } catch (error) {
      res.status(400).json({ error: "Invalid answer data" });
    }
  });

  return httpServer;
}
