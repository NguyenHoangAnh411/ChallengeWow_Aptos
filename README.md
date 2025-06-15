# 🌊 Challenge Wave - GameFi for Competitive Proofs

**Challenge Wave** is a fast-paced GameFi DApp where players prove their skill and speed by answering random quiz challenges in real-time. Powered by the OLYM3 Testnet and zk-SNARK technology, every match is more than just a game—it's a cryptographic proof of challenge.

## ⚙️ Core Gameplay

- 👥 **Room-based Challenges**: Players enter a **Challenge Room** with a maximum of **4 participants**.
- ⏳ **3-minute Countdown Timer**: Once there are **2–4 players**, the room countdown starts.
- ❓ **Randomized Questions**: Questions are **randomly fetched** from a **Supabase database**, ensuring variety and fairness.
- 🕒 **15-second Answer Timer**: Each question must be answered in **15 seconds**. The **faster** the player answers correctly, the **higher** their score.

> ✅ The **winner** is the one who answers correctly in the **shortest amount of time**.
> If multiple correct answers are submitted, the fastest response wins.

## 🧠 Scoring Mechanism

| Player | Time to Answer (s) | Correct? | Score |
|--------|--------------------|----------|-------|
| Alice  | 4.2                | ✅        | 10.8  |
| Bob    | 3.7                | ✅        | 11.3 🏆 |
| Clara  | 5.9                | ✅        | 9.1   |
| Dave   | 2.3                | ❌        | 0     |

- Final score is calculated as:  
  **Score = 15 - time_taken** (only for correct answers)

## 🔐 Proof of Challenge with zk-SNARK

Each completed challenge is cryptographically sealed using **zk-SNARK**:
- The winner's result is transformed into a **zero-knowledge proof**.
- The zk-proof is submitted to the **OLYM3 Testnet** as an immutable on-chain **Challenge Block**.
- This block includes:
  - Player IDs (hashed)
  - Room ID
  - Winning proof
  - Timestamp

> This creates a **verifiable, decentralized** record of achievement – a true *Proof of Challenge*.

## 💡 Why zk-SNARK?

- ✅ Privacy: Individual answers are **not exposed** on-chain.
- 🔍 Verifiability: Any observer can verify that the winner **met the challenge conditions**, without seeing their actual responses.
- ⚔️ Anti-Cheat: Prevents falsification of results and ensures **provable fairness**.

## 🛠️ Tech Stack

| Layer             | Technology Used               |
|------------------|-------------------------------|
| Frontend         | React / TypeScript / Wagmi     |
| Backend          | Supabase (Realtime DB)         |
| Blockchain       | OLYM3 Testnet                  |
| ZK Layer         | snarkjs / circom               |
| Proof Storage    | IPFS / OLYM3 Chain             |

## 🔮 Future Plans

- 🎖️ NFT Badges for verified winners
- 🧠 AI-generated quizzes for increased complexity
- 🥇 Leaderboard with on-chain staking rewards
- 🔗 Cross-room tournaments and seasonal leagues

---

## 🌐 Live Demo & Docs

- [DApp Preview](https://challengewave.olym3.xyz) *(Coming Soon)*
- [Whitepaper](https://docs.olym3.xyz/challengewave)
- [OLYM3 Testnet Explorer](https://explorer.olym3.xyz)

## 🤝 Join the Wave

Challenge your brain, race the clock, and write your name into the chain.  
This isn't just a quiz game — it's a **Challenge Wave**.

> 🏁 **Play Fast. Think Smart. Prove It Onchain.**

---

# Challenge Wave GameFi Backend

A FastAPI-based backend for the Challenge Wave GameFi application that allows players to create and join challenge rooms, answer questions, and compete for rewards.

## Features

- Create and join challenge rooms (2-4 players)
- Real-time game updates via WebSocket
- 3-minute countdown when enough players join
- 15-second time limit for each question
- Score calculation based on answer speed
- zk-SNARK proof generation for winners
- Supabase integration for questions database

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file with your Supabase credentials:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

4. Run the application:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

### REST Endpoints

- `POST /create-room`: Create a new game room
- `POST /join-room`: Join an existing room
- `POST /submit-answer`: Submit an answer for the current question
- `GET /room/{room_id}`: Get current room status

### WebSocket Endpoint

- `WS /ws/{room_id}`: Real-time game updates

## Game Flow

1. Player creates a room or joins an existing one
2. When 2-4 players join, a 3-minute countdown starts
3. After countdown, players have 15 seconds to answer each question
4. Score is calculated based on answer speed (15 - time taken)
5. After all questions, winner is determined and zk-SNARK proof is generated
6. Results are saved to Supabase

## Development

The project structure:
```
.
├── main.py           # FastAPI application and endpoints
├── models.py         # Pydantic models and schemas
├── database.py       # Supabase connection and database operations
├── game_logic.py     # Game mechanics and helper functions
└── requirements.txt  # Project dependencies
```

## Notes

- Currently using in-memory storage for rooms (should be moved to database in production)
- zk-SNARK proof generation is simulated
- Supabase integration is prepared but needs actual database setup
