# AI Music Chatbot - Setup Guide

## ✅ Hoàn thành implementation

AI Chatbot đã được tích hợp vào `/chat` như một contact đặc biệt.

---

## 📦 Installation

### 1. Install Gemini package
```bash
cd backend
npm install @google/generative-ai
```

### 2. Get Gemini API Key (FREE)
1. Truy cập: https://aistudio.google.com/app/apikey
2. Đăng nhập bằng Google account
3. Click "Create API key"
4. Copy key

**Free tier limits:**
- ✅ 60 requests/minute
- ✅ 1,500 requests/day
- ✅ Không cần thẻ tín dụng

### 3. Update .env
```bash
# backend/.env
GEMINI_API_KEY=your-api-key-here
```

---

## 🎯 Cách hoạt động

### AI dựa vào kiến thức về nghệ sĩ/title

AI **KHÔNG phân tích file nhạc**, mà dùng kiến thức huấn luyện sẵn của Gemini 1.5 Flash về:

**Ví dụ:**
- "Adele" hoặc "Someone Like You" → sad, emotional ballad
- "The Weeknd" hoặc "Blinding Lights" → energetic, synthwave, 80s
- "Ed Sheeran" → pop, romantic, acoustic
- "Coldplay" → alternative rock, melancholic
- "Lofi Hip Hop Radio" → chill, study

**Hạn chế:**
- ❌ Bài tự sáng tác/ít người biết: AI sẽ đoán dựa trên tên
- ❌ "xyz.mp3" by "Unknown Artist": AI không biết gì
- ✅ "Fix You" by "Coldplay": AI biết chính xác

---

## 🚀 Cách dùng

### Trong Chat Page
1. Mở `/chat`
2. **AI Music Assistant** xuất hiện đầu tiên trong danh sách (icon bot, badge "Always online")
3. Click vào AI → chat interface với:
   - Quick mood buttons (Happy, Sad, Energetic, Calm, Romantic, Focus)
   - Suggestion chips
   - Song recommendations với Play button

### Hỏi AI:
```
"I want happy and upbeat songs"
"Give me sad emotional music"
"Recommend songs for workout"
"I need calm study music"
"Songs similar to Blinding Lights"
```

### AI sẽ trả về:
- Friendly message giải thích
- 3-6 bài hát gợi ý với Play/Play All
- Mood/Genre detected
- Reason (tại sao chọn những bài này)

---

## 📂 Files đã tạo/sửa

### Backend (7 files)
```
backend/
├── src/
│   ├── lib/
│   │   └── ai.js                          ← NEW (Gemini AI service)
│   ├── models/
│   │   └── chatMessage.model.js           ← NEW (AI chat history)
│   ├── controller/
│   │   └── ai.controller.js               ← NEW (AI logic)
│   ├── routes/
│   │   └── ai.route.js                    ← NEW (AI endpoints)
│   └── index.js                           ← UPDATED (import ai routes)
└── .env                                   ← UPDATED (GEMINI_API_KEY)
```

### Frontend (8 files)
```
frontend/
├── src/
│   ├── components/
│   │   └── ai/
│   │       ├── MoodSelector.tsx           ← NEW
│   │       └── SongRecommendationCard.tsx ← NEW
│   ├── pages/
│   │   └── chat/
│   │       ├── ChatPage.tsx               ← UPDATED (AI toggle)
│   │       └── components/
│   │           ├── UsersList.tsx          ← UPDATED (AI contact)
│   │           └── AIChatInterface.tsx    ← NEW (AI chat UI)
│   ├── stores/
│   │   ├── useChatStore.ts                ← UPDATED (isAIChat state)
│   │   └── useAIChatStore.ts              ← NEW (AI store)
│   └── types/
│       └── index.ts                       ← UPDATED (AI types)
```

---

## 🧪 Testing

### 1. Start backend
```bash
cd backend
npm run dev
```

### 2. Start frontend
```bash
cd frontend
npm run dev
```

### 3. Test flow
1. Login vào app
2. Vào `/chat`
3. Click "AI Music Assistant"
4. Click mood button hoặc gõ: "I want energetic songs"
5. AI trả về recommendations → Click Play

---

## 🔧 API Endpoints

```
POST   /api/ai/chat               # Chat với AI
GET    /api/ai/similar/:songId    # Tìm bài tương tự
GET    /api/ai/history            # Lấy chat history
DELETE /api/ai/history            # Xóa chat history
```

---

## 💡 Tips

### Để AI gợi ý chính xác hơn:
1. Upload bài hát với tên/nghệ sĩ nổi tiếng
2. Hoặc thêm metadata (genre/mood) vào Song model:
```javascript
// backend/src/models/song.model.js
const songSchema = new mongoose.Schema({
  // ...existing fields...
  genre: String,    // "pop", "rock", "lofi"
  mood: String,     // "happy", "sad", "energetic"
  tags: [String],   // ["workout", "study", "romantic"]
});
```

### Nếu muốn AI tự tag:
Gọi AI ngay khi admin upload bài → tự phân tích title/artist → lưu genre/mood vào DB.

---

## ❓ Troubleshooting

**Error: "Missing API key"**
→ Kiểm tra `GEMINI_API_KEY` trong `.env` và restart backend

**AI trả lời sai/không liên quan**
→ AI dựa vào kiến thức về nghệ sĩ. Nếu bài ít người biết, AI sẽ đoán

**Rate limit exceeded**
→ Gemini free tier: 60 req/min, 1500 req/day. Chờ reset hoặc upgrade

**No recommendations**
→ Kiểm tra DB có songs chưa. AI cần ít nhất 5-10 bài để gợi ý

**Error: "Failed to generate recommendations"**
→ Kiểm tra API key hợp lệ tại https://aistudio.google.com/app/apikey

---

## 🎵 Enjoy your AI Music Assistant!
