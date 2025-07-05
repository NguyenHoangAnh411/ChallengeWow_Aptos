# Fix Summary: Game Not Moving to Next Question

## 🐛 **Vấn đề đã gặp phải:**

1. Khi có người chơi không trả lời câu hỏi, hệ thống hiển thị kết quả câu hỏi nhưng không chuyển sang câu hỏi tiếp theo (nếu còn).
2. **Frontend không xử lý** trường hợp người chơi không chọn câu trả lời khi hết thời gian.

## ✅ **Nguyên nhân:**

1. **Fallback timer** chỉ hiển thị kết quả câu hỏi nhưng không chuyển sang câu hỏi tiếp theo
2. **Thiếu logging** để debug flow của game
3. **Quản lý active_tasks** có thể gây conflict
4. **Frontend handleTimeUp** chỉ xử lý khi có `selectedAnswer`, không xử lý trường hợp không có

## 🔧 **Giải pháp đã áp dụng:**

### 1. **Sửa Fallback Timer Logic (Backend)**

```python
# Trước:
await self._show_question_result(room_id, handle_unanswered=False)
# Dừng ở đây, không chuyển tiếp

# Sau:
await self._show_question_result(room_id, handle_unanswered=False)
# ✅ FIXED: The result will automatically trigger next question after 3 seconds
# (handled by next_question_delay in _show_question_result)
```

### 2. **Sửa Frontend Time Up Logic**

```typescript
// Trước:
const handleTimeUp = () => {
  if (!hasAnswered && selectedAnswer) {
    handleAnswerSelect(selectedAnswer);
  } else {
    // Không xử lý gì
  }
};

// Sau:
const handleTimeUp = () => {
  if (!hasAnswered) {
    if (selectedAnswer) {
      // Player had selected an answer but didn't submit - submit it now
      handleAnswerSelect(selectedAnswer);
    } else {
      // Player didn't select any answer - submit "no answer"
      sendMessage({
        type: SUBMIT_ANSWER_TYPE,
        data: {
          answer: "", // Empty string indicates no answer
          questionStartAt: questionEndAt
            ? questionEndAt - (currentQuestion?.timePerQuestion || 10) * 1000
            : Date.now(),
        },
      });
    }
  }
};
```

### 3. **Cải thiện Server Response**

```python
# Thêm thông tin cho "no answer" submissions
await send_json_safe(websocket, {
    "type": "answer_submitted",
    "payload": {
        # ... existing fields ...
        "message": response_message,
        "isNoAnswer": not player_answer or player_answer == ""
    }
})
```

### 4. **Cải thiện Frontend Toast Messages**

```typescript
if (payload.isNoAnswer) {
  toast({
    title: "Time's up!",
    description: "No answer submitted - 0 points",
    variant: "destructive",
  });
} else {
  toast({
    title: payload.isCorrect ? "Correct!" : "Incorrect",
    description: payload.message || `You earned ${payload.points} points`,
    variant: payload.isCorrect ? "default" : "destructive",
  });
}
```

### 5. **Thêm Comprehensive Logging**

- **Fallback Timer**: Track khi nào timer bắt đầu, kết thúc, và có được trigger không
- **Next Question Delay**: Track việc tạo task và chuyển sang câu hỏi tiếp theo
- **Player Answers**: Track số lượng người chơi đã trả lời
- **No Answer Submissions**: Track khi người chơi submit "no answer"
- **Task Management**: Track việc cancel và tạo tasks

### 6. **Cải thiện Error Handling**

```python
try:
    # Logic chính
except Exception as e:
    print(f"[ERROR] Error in next_question_delay for room {room_id}: {e}")
finally:
    # Cleanup tasks
```

## 📋 **Flow hoạt động hiện tại:**

### **Khi tất cả người chơi đã trả lời:**

1. `_handle_submit_answer` → Kiểm tra tất cả đã trả lời
2. Cancel fallback timer
3. `_show_question_result` → Hiển thị kết quả
4. Tạo `next_question_delay` task → Chuyển sang câu hỏi tiếp theo sau 3s

### **Khi có người không trả lời (timeout):**

1. **Frontend**: `handleTimeUp` → Submit "no answer" nếu chưa chọn
2. **Backend**: Fallback timer trigger sau `time_per_question + 10s`
3. `_handle_unanswered_questions` → Tự động submit "no answer" cho người chưa trả lời
4. `_show_question_result` → Hiển thị kết quả (bao gồm "no answer")
5. Tạo `next_question_delay` task → Chuyển sang câu hỏi tiếp theo sau 3s

## 🎯 **Kết quả:**

- ✅ Game sẽ luôn chuyển sang câu hỏi tiếp theo sau khi hiển thị kết quả
- ✅ **Frontend tự động submit "no answer"** khi hết thời gian
- ✅ Người chơi không trả lời sẽ được tính 0 điểm
- ✅ **Toast messages phù hợp** cho từng loại submission
- ✅ Có logging chi tiết để debug
- ✅ Không có conflict giữa các tasks

## 🧪 **Cách test:**

1. Tạo room với nhiều người chơi
2. Bắt đầu game
3. **Test case 1**: Để một số người không trả lời câu hỏi
4. **Test case 2**: Để một số người chọn câu trả lời nhưng không submit
5. Kiểm tra xem game có chuyển sang câu hỏi tiếp theo không
6. Kiểm tra toast messages có hiển thị đúng không
7. Kiểm tra logs để xem flow hoạt động

## 📝 **Logs quan trọng cần theo dõi:**

```
[FALLBACK] Room {room_id} - Starting fallback timer for question {n}
[FALLBACK] Room {room_id} - Auto moving to next question after timeout
[UNANSWERED] Room {room_id} - Question {n}: {x} players didn't answer
[NO_ANSWER] Player {wallet_id} submitted no answer for question {n}
[NEXT_QUESTION] Room {room_id} - Created next question delay task
[NEXT_QUESTION] Room {room_id} - Moving to next question now
[FRONTEND] Time up - submitting no answer
```
