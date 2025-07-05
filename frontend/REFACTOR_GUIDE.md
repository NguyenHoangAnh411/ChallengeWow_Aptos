# Game System Refactor Guide

## Overview

The game system has been refactored from two separate routes (`/room/[roomId]/waiting` and `/room/[roomId]`) into a single unified route (`/room/[roomId]`) that manages all game phases using Zustand state management.

## Key Changes

### 1. Unified Route Structure

- **Before**: Two separate pages with `router.replace()` causing WebSocket disconnections
- **After**: Single `/room/[roomId]/page.tsx` with phase-based rendering

### 2. Zustand State Management

Extended `useGameState` store to include:

- `gamePhase`: Controls which UI component to render
- Game-specific state (countdown, questions, answers, etc.)
- Chat and player management state

### 3. Game Phases

The system now supports these phases:

- `"waiting"`: Waiting room with player list and settings
- `"countdown"`: Pre-game countdown timer
- `"inGame"`: Active question answering
- `"questionResult"`: Showing question results
- `"gameSummary"`: Final game results

## File Structure

```
frontend/src/
├── app/room/[roomId]/
│   └── page.tsx                    # Main unified room page
├── components/game-phases/
│   ├── WaitingRoom.tsx            # Waiting room UI
│   ├── CountdownScreen.tsx        # Countdown UI
│   ├── GameScreen.tsx             # Game UI
│   ├── QuestionResult.tsx         # Question result UI
│   └── GameSummary.tsx            # Game summary UI
├── hooks/
│   └── use-game-socket.ts         # WebSocket message handler
└── lib/
    └── game-state.ts              # Extended Zustand store
```

## How It Works

### 1. State Management

```typescript
// Game phase transitions
setGamePhase("waiting"); // Show waiting room
setGamePhase("countdown"); // Show countdown
setGamePhase("inGame"); // Show game questions
setGamePhase("questionResult"); // Show question results
setGamePhase("gameSummary"); // Show final results
```

### 2. WebSocket Message Handling

The `useGameSocket` hook handles all WebSocket messages and updates the Zustand store accordingly:

```typescript
// Example message handling
case "game_started":
  setGamePhase("countdown");
  setCountdown(data.payload.countdownDuration);
  break;

case "next_question":
  setGamePhase("inGame");
  setCurrentQuestion(data.payload.question);
  break;

case "question_result":
  setGamePhase("questionResult");
  break;

case "game_ended":
  setGamePhase("gameSummary");
  setGameResults(data.payload.leaderboard);
  break;
```

### 3. Component Rendering

The main page renders different components based on `gamePhase`:

```typescript
const renderGamePhase = () => {
  switch (gamePhase) {
    case "waiting":
      return <WaitingRoom {...props} />;
    case "countdown":
      return <CountdownScreen {...props} />;
    case "inGame":
      return <GameScreen {...props} />;
    case "questionResult":
      return <QuestionResult {...props} />;
    case "gameSummary":
      return <GameSummary {...props} />;
  }
};
```

## Benefits

### 1. No WebSocket Disconnections

- Single route means WebSocket connection stays active
- No more lost messages during route transitions
- Consistent state throughout the game

### 2. Better State Management

- All game state in one place (Zustand)
- Easy to debug and track state changes
- Predictable state transitions

### 3. Improved User Experience

- Smooth transitions between phases
- No page reloads or navigation delays
- Consistent UI/UX throughout the game

### 4. Maintainable Code

- Separated concerns (each phase has its own component)
- Reusable components
- Clear data flow

## Migration Notes

### Removed Files

- `frontend/src/app/room/[roomId]/waiting/page.tsx` (deleted)

### Updated Files

- `frontend/src/lib/game-state.ts` (extended with new state)
- `frontend/src/app/room/[roomId]/page.tsx` (completely rewritten)

### New Files

- `frontend/src/hooks/use-game-socket.ts` (new WebSocket handler)
- `frontend/src/components/game-phases/*.tsx` (new phase components)

## Usage Example

```typescript
// In your component
const { gamePhase, setGamePhase, currentQuestion } = useGameState();

// The component will automatically render the correct phase
// based on the gamePhase state
```

## Testing

To test the refactored system:

1. Create a room and join it
2. Verify waiting room displays correctly
3. Start the game and verify countdown works
4. Answer questions and verify transitions
5. Check that WebSocket messages are received properly
6. Verify game summary displays correctly

## Troubleshooting

### Common Issues

1. **State not updating**: Check that you're using the correct Zustand actions
2. **WebSocket messages not received**: Verify the `useGameSocket` hook is properly connected
3. **Phase not changing**: Check that `setGamePhase` is being called with the correct phase

### Debug Tips

- Use browser dev tools to monitor Zustand state changes
- Check WebSocket connection status in the header
- Monitor console logs for WebSocket message handling
- Verify localStorage persistence for game state
