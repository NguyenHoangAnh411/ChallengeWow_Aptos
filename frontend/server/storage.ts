import { 
  users, rooms, questions, gameInstances, playerAnswers, roomParticipants,
  type User, type InsertUser, type Room, type InsertRoom, 
  type Question, type InsertQuestion, type GameInstance, type InsertGameInstance,
  type PlayerAnswer, type InsertPlayerAnswer, type RoomParticipant, type InsertRoomParticipant
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserScore(id: number, score: number, gamesWon?: number): Promise<User | undefined>;
  getTopPlayers(limit?: number): Promise<User[]>;

  // Rooms
  createRoom(room: InsertRoom): Promise<Room>;
  getRoom(id: number): Promise<Room | undefined>;
  getRoomByCode(roomCode: string): Promise<Room | undefined>;
  getAvailableRooms(): Promise<Room[]>;
  updateRoomStatus(id: number, status: string, currentPlayers?: number): Promise<Room | undefined>;

  // Questions
  getRandomQuestions(limit: number, category?: string): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;

  // Game Instances
  createGameInstance(gameInstance: InsertGameInstance): Promise<GameInstance>;
  updateGameInstance(id: number, updates: Partial<GameInstance>): Promise<GameInstance | undefined>;
  getGameInstance(id: number): Promise<GameInstance | undefined>;

  // Player Answers
  createPlayerAnswer(answer: InsertPlayerAnswer): Promise<PlayerAnswer>;
  getPlayerAnswers(gameInstanceId: number, playerId?: number): Promise<PlayerAnswer[]>;

  // Room Participants
  addRoomParticipant(participant: InsertRoomParticipant): Promise<RoomParticipant>;
  getRoomParticipants(roomId: number): Promise<RoomParticipant[]>;
  updateParticipantStatus(roomId: number, playerId: number, status: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private rooms: Map<number, Room> = new Map();
  private questions: Map<number, Question> = new Map();
  private gameInstances: Map<number, GameInstance> = new Map();
  private playerAnswers: Map<number, PlayerAnswer> = new Map();
  private roomParticipants: Map<number, RoomParticipant> = new Map();
  
  private currentUserId = 1;
  private currentRoomId = 1;
  private currentQuestionId = 1;
  private currentGameInstanceId = 1;
  private currentPlayerAnswerId = 1;
  private currentRoomParticipantId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed sample questions
    const sampleQuestions: Question[] = [
      {
        id: this.currentQuestionId++,
        text: "Which programming language is known as the 'mother of all languages'?",
        options: ["Assembly Language", "C Programming", "FORTRAN", "COBOL"],
        correctAnswer: "C Programming",
        category: "technology",
        difficulty: "medium"
      },
      {
        id: this.currentQuestionId++,
        text: "What does zk-SNARK stand for?",
        options: ["Zero-Knowledge Succinct Non-Interactive Argument of Knowledge", "Zero-Key Secure Network Authentication Protocol", "Zonal Kernel Security Network Access Control", "Zero-Knowledge Sequential Network Authentication"],
        correctAnswer: "Zero-Knowledge Succinct Non-Interactive Argument of Knowledge",
        category: "blockchain",
        difficulty: "hard"
      },
      {
        id: this.currentQuestionId++,
        text: "Which consensus mechanism does Ethereum 2.0 use?",
        options: ["Proof of Work", "Proof of Stake", "Delegated Proof of Stake", "Proof of Authority"],
        correctAnswer: "Proof of Stake",
        category: "blockchain",
        difficulty: "medium"
      },
      {
        id: this.currentQuestionId++,
        text: "What is the maximum supply of Bitcoin?",
        options: ["21 million", "100 million", "50 million", "Unlimited"],
        correctAnswer: "21 million",
        category: "blockchain",
        difficulty: "easy"
      },
      {
        id: this.currentQuestionId++,
        text: "Which data structure is used in blockchain?",
        options: ["Array", "Linked List", "Hash Table", "Merkle Tree"],
        correctAnswer: "Merkle Tree",
        category: "blockchain",
        difficulty: "medium"
      }
    ];

    sampleQuestions.forEach(q => this.questions.set(q.id, q));
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      totalScore: 0,
      gamesWon: 0,
      rank: 0,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserScore(id: number, score: number, gamesWon?: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      user.totalScore += score;
      if (gamesWon !== undefined) {
        user.gamesWon += gamesWon;
      }
      this.users.set(id, user);
    }
    return user;
  }

  async getTopPlayers(limit = 10): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);
  }

  // Rooms
  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = this.currentRoomId++;
    const room: Room = { 
      ...insertRoom, 
      id,
      createdAt: new Date()
    };
    this.rooms.set(id, room);
    return room;
  }

  async getRoom(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async getRoomByCode(roomCode: string): Promise<Room | undefined> {
    return Array.from(this.rooms.values()).find(room => room.roomCode === roomCode);
  }

  async getAvailableRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(room => 
      room.status === "waiting" && room.currentPlayers < room.maxPlayers
    );
  }

  async updateRoomStatus(id: number, status: string, currentPlayers?: number): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (room) {
      room.status = status;
      if (currentPlayers !== undefined) {
        room.currentPlayers = currentPlayers;
      }
      this.rooms.set(id, room);
    }
    return room;
  }

  // Questions
  async getRandomQuestions(limit: number, category?: string): Promise<Question[]> {
    let questions = Array.from(this.questions.values());
    if (category) {
      questions = questions.filter(q => q.category === category);
    }
    return questions.sort(() => Math.random() - 0.5).slice(0, limit);
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  // Game Instances
  async createGameInstance(insertGameInstance: InsertGameInstance): Promise<GameInstance> {
    const id = this.currentGameInstanceId++;
    const gameInstance: GameInstance = { 
      ...insertGameInstance, 
      id,
      startedAt: null,
      completedAt: null
    };
    this.gameInstances.set(id, gameInstance);
    return gameInstance;
  }

  async updateGameInstance(id: number, updates: Partial<GameInstance>): Promise<GameInstance | undefined> {
    const gameInstance = this.gameInstances.get(id);
    if (gameInstance) {
      Object.assign(gameInstance, updates);
      this.gameInstances.set(id, gameInstance);
    }
    return gameInstance;
  }

  async getGameInstance(id: number): Promise<GameInstance | undefined> {
    return this.gameInstances.get(id);
  }

  // Player Answers
  async createPlayerAnswer(insertPlayerAnswer: InsertPlayerAnswer): Promise<PlayerAnswer> {
    const id = this.currentPlayerAnswerId++;
    const playerAnswer: PlayerAnswer = { 
      ...insertPlayerAnswer, 
      id,
      answeredAt: new Date()
    };
    this.playerAnswers.set(id, playerAnswer);
    return playerAnswer;
  }

  async getPlayerAnswers(gameInstanceId: number, playerId?: number): Promise<PlayerAnswer[]> {
    return Array.from(this.playerAnswers.values()).filter(answer => 
      answer.gameInstanceId === gameInstanceId && 
      (playerId === undefined || answer.playerId === playerId)
    );
  }

  // Room Participants
  async addRoomParticipant(insertParticipant: InsertRoomParticipant): Promise<RoomParticipant> {
    const id = this.currentRoomParticipantId++;
    const participant: RoomParticipant = { 
      ...insertParticipant, 
      id,
      joinedAt: new Date()
    };
    this.roomParticipants.set(id, participant);
    return participant;
  }

  async getRoomParticipants(roomId: number): Promise<RoomParticipant[]> {
    return Array.from(this.roomParticipants.values()).filter(p => 
      p.roomId === roomId && p.status === "active"
    );
  }

  async updateParticipantStatus(roomId: number, playerId: number, status: string): Promise<void> {
    const participant = Array.from(this.roomParticipants.values()).find(p => 
      p.roomId === roomId && p.playerId === playerId
    );
    if (participant) {
      participant.status = status;
      this.roomParticipants.set(participant.id, participant);
    }
  }
}

export const storage = new MemStorage();
