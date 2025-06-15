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
- The winner’s result is transformed into a **zero-knowledge proof**.
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
