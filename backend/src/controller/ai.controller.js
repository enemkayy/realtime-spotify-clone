import { Song } from "../models/song.model.js";
import { User } from "../models/user.model.js";
import { ChatMessage } from "../models/chatMessage.model.js";
import {
  generateMusicRecommendation,
  analyzeSongSimilarity,
  analyzeMusicPreference,
} from "../lib/ai.js";

/**
 * POST /api/ai/chat
 * Chat với AI để nhận gợi ý nhạc
 */
export const chatWithAI = async (req, res, next) => {
  try {
    console.log("💬 chatWithAI called");
    console.log("- userId:", req.auth?.userId);

    const { message } = req.body;
    const userId = req.auth.userId;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Check for cached response (within 5 minutes, not invalidated)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // First, find recent user message with same content
    const recentUserMessage = await ChatMessage.findOne({
      userId,
      role: "user",
      content: { $regex: new RegExp(`^${message.trim()}$`, "i") },
      createdAt: { $gte: fiveMinutesAgo },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (recentUserMessage) {
      // Find the assistant response right after this user message
      const assistantResponse = await ChatMessage.findOne({
        userId,
        role: "assistant",
        createdAt: { $gt: recentUserMessage.createdAt },
        recommendations: { $exists: true, $ne: [] },
        cacheInvalidated: { $ne: true }, // ✅ Check invalidation on assistant message
      })
        .populate("recommendations")
        .lean();

      if (assistantResponse) {
        console.log("✅ Using cached response (saved API call)");
        
        // Save user message to database even when using cache
        await ChatMessage.create({
          userId,
          role: "user",
          content: message,
          cacheInvalidated: false,
        });

        // Save assistant response (copy from cache) to maintain chat history
        await ChatMessage.create({
          userId,
          role: "assistant",
          content: assistantResponse.content,
          recommendations: assistantResponse.recommendations.map(song => song._id),
          metadata: assistantResponse.metadata,
          cacheInvalidated: false,
        });

        return res.status(200).json({
          message: assistantResponse.content,
          songs: assistantResponse.recommendations,
          reason: assistantResponse.metadata?.reason,
          mood: assistantResponse.metadata?.mood,
          cached: true,
        });
      }
    }

    console.log("🔄 No valid cache - calling Gemini API");

    // 1. Lấy danh sách bài hát (giới hạn để tránh token limit)
    const allSongs = await Song.find().limit(50).lean();

    // 2. Lấy chat history gần đây
    const chatHistory = await ChatMessage.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // 3. Phân tích preference
    const preference = await analyzeMusicPreference(message);

    // 4. Chuẩn bị context
    const context = {
      songs: allSongs.map((s) => ({
        id: s._id.toString(),
        title: s.title,
        artist: s.artist,
      })),
      recentSongs: chatHistory
        .filter((c) => c.recommendations?.length > 0)
        .flatMap((c) => c.recommendations)
        .slice(0, 5),
      preference,
      chatHistory: chatHistory.slice(0, 6), // Last 3 exchanges (6 messages)
    };

    // 5. Gọi AI để gợi ý
    const aiResponse = await generateMusicRecommendation(message, context);

    // 6. Lưu user message
    await ChatMessage.create({
      userId,
      role: "user",
      content: message,
      cacheInvalidated: false,
    });

    // 7. Lưu AI response (fresh, not invalidated)
    await ChatMessage.create({
      userId,
      role: "assistant",
      content: aiResponse.message,
      recommendations: aiResponse.recommendations,
      metadata: {
        reason: aiResponse.reason,
        mood: aiResponse.mood || preference.mood,
      },
      cacheInvalidated: false,
    });

    // 8. Lấy thông tin chi tiết các bài hát được gợi ý
    const recommendedSongs = await Song.find({
      _id: { $in: aiResponse.recommendations },
    }).lean();

    res.json({
      message: aiResponse.message,
      reason: aiResponse.reason,
      mood: aiResponse.mood,
      songs: recommendedSongs,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    next(error);
  }
};

/**
 * GET /api/ai/similar/:songId
 * Tìm bài hát tương tự
 */
export const findSimilarSongs = async (req, res, next) => {
  try {
    const { songId } = req.params;

    // 1. Lấy bài hát gốc
    const targetSong = await Song.findById(songId).lean();
    if (!targetSong) {
      return res.status(404).json({ message: "Song not found" });
    }

    // 2. Lấy tất cả bài hát khác
    const allSongs = await Song.find({ _id: { $ne: songId } })
      .limit(50)
      .lean();

    // 3. Phân tích similarity
    const result = await analyzeSongSimilarity(
      {
        id: targetSong._id.toString(),
        title: targetSong.title,
        artist: targetSong.artist,
      },
      allSongs.map((s) => ({
        id: s._id.toString(),
        title: s.title,
        artist: s.artist,
      }))
    );

    // 4. Lấy thông tin chi tiết
    const similarSongs = await Song.find({
      _id: { $in: result.similarSongs },
    }).lean();

    res.json({
      targetSong,
      reason: result.reason,
      matchCriteria: result.matchCriteria,
      songs: similarSongs,
    });
  } catch (error) {
    console.error("Similar songs error:", error);
    next(error);
  }
};

/**
 * GET /api/ai/history
 * Lấy lịch sử chat với AI
 */
export const getChatHistory = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const limit = parseInt(req.query.limit) || 50;

    const history = await ChatMessage.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("recommendations")
      .lean();

    res.json(history.reverse()); // Reverse để hiển thị từ cũ đến mới
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/ai/history
 * Xóa lịch sử chat
 */
export const clearChatHistory = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    await ChatMessage.deleteMany({ userId });
    res.json({ message: "Chat history cleared" });
  } catch (error) {
    next(error);
  }
};
