import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// WORKING MODEL (gemini model)
const WORKING_MODEL = "models/gemini-2.5-flash";

/**
 * Helper: Clean JSON response from Gemini
 */
const cleanJsonResponse = (text) => {
  let cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  cleaned = cleaned.trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  return cleaned;
};

/**
 * Improved keyword-based mood detection (fallback)
 */
const detectMoodFromKeywords = (userMessage) => {
  const msg = userMessage.toLowerCase();

  if (
    msg.includes("happy") ||
    msg.includes("upbeat") ||
    msg.includes("joy") ||
    msg.includes("cheerful")
  )
    return "happy";
  if (
    msg.includes("sad") ||
    msg.includes("emotional") ||
    msg.includes("cry") ||
    msg.includes("depressed")
  )
    return "sad";
  if (
    msg.includes("energetic") ||
    msg.includes("workout") ||
    msg.includes("hype") ||
    msg.includes("pump")
  )
    return "energetic";
  if (
    msg.includes("calm") ||
    msg.includes("chill") ||
    msg.includes("relax") ||
    msg.includes("peaceful")
  )
    return "calm";
  if (msg.includes("romantic") || msg.includes("love") || msg.includes("heart"))
    return "romantic";
  if (msg.includes("angry") || msg.includes("rage") || msg.includes("mad"))
    return "angry";

  return null;
};

/**
 * Filter songs by mood using DATABASE FIELDS first, then keyword fallback
 * Priority: 1. DB mood array, 2. DB genre, 3. DB description, 4. Title/Artist keywords
 */
const filterSongsByMood = (songs, mood) => {
  // Mood mapping for genre matching
  const genreMapping = {
    happy: ["pop", "dance", "k-pop", "disco"],
    sad: ["ballad", "indie", "soul", "blues"],
    energetic: ["rock", "metal", "electronic", "hip-hop", "edm"],
    calm: ["acoustic", "ambient", "classical", "jazz", "lofi"],
    romantic: ["r&b", "soul", "pop ballad", "acoustic"],
    angry: ["metal", "punk", "hard rock", "rap"],
  };

  // Keyword patterns for title/artist/description fallback
  const moodKeywords = {
    happy: {
      patterns:
        /(happy|joy|party|dance|upbeat|good|fun|celebration|smile|sunshine|wonderful|beautiful)/i,
      artists:
        /(pharrell|bruno mars|dua lipa|ariana grande|katy perry|justin timberlake|mark ronson)/i,
    },
    sad: {
      patterns:
        /(sad|cry|hurt|lonely|miss|someone|stay|sorry|goodbye|broken|tears|lost|alone)/i,
      artists:
        /(adele|sam smith|lewis capaldi|billie eilish|sia|coldplay|james arthur)/i,
    },
    energetic: {
      patterns:
        /(energy|power|strong|run|fight|alive|wild|thunder|fire|rock|metal|enemy|battle|warrior)/i,
      artists:
        /(imagine dragons|linkin park|foo fighters|ac\/dc|metallica|guns n roses)/i,
    },
    calm: {
      patterns:
        /(calm|chill|relax|slow|peace|dream|sleep|night|moon|stars|ocean|waves|quiet)/i,
      artists: /(norah jones|john mayer|bon iver|james bay|jack johnson)/i,
    },
    romantic: {
      patterns:
        /(love|heart|kiss|you|beautiful|forever|perfect|heaven|angel|together|romance)/i,
      artists:
        /(ed sheeran|john legend|bruno mars|shawn mendes|taylor swift|ariana grande)/i,
    },
    angry: {
      patterns: /(angry|rage|mad|fury|hate|scream|break|destroy)/i,
      artists: /(rage against the machine|slipknot|korn|disturbed)/i,
    },
  };

  const keywords = moodKeywords[mood];
  const genres = genreMapping[mood] || [];
  
  if (!keywords) return [];

  const matched = songs.filter((s) => {
    // 1. PRIORITY: Check DB mood array (most reliable)
    if (s.mood && Array.isArray(s.mood)) {
      const moodLower = s.mood.map(m => m.toLowerCase());
      if (moodLower.includes(mood.toLowerCase())) {
        console.log(`✅ Matched "${s.title}" by DB mood field`);
        return true;
      }
    }

    // 2. Check DB genre field
    if (s.genre) {
      const genreLower = s.genre.toLowerCase();
      if (genres.some(g => genreLower.includes(g))) {
        console.log(`✅ Matched "${s.title}" by DB genre field (${s.genre})`);
        return true;
      }
    }

    // 3. Check DB description field
    if (s.description && keywords.patterns.test(s.description)) {
      console.log(`✅ Matched "${s.title}" by DB description field`);
      return true;
    }

    // 4. FALLBACK: Check title/artist keywords
    if (keywords.patterns.test(s.title) || keywords.artists.test(s.artist)) {
      console.log(`✅ Matched "${s.title}" by title/artist keywords`);
      return true;
    }

    return false;
  });

  console.log(`🎯 filterSongsByMood(${mood}): Found ${matched.length} songs using DB fields + keywords`);
  return matched;
};

/**
 * Phân tích mood/genre từ user input
 */
export const analyzeMusicPreference = async (userMessage) => {
  try {
    const model = genAI.getGenerativeModel({
      model: WORKING_MODEL,
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
      },
    });

    const prompt = `Analyze this music request and extract mood/genre.

User message: "${userMessage}"

Rules:
- Mood can be: happy, sad, energetic, calm, romantic, melancholic, angry, nostalgic
- Genre can be: pop, rock, jazz, hip-hop, electronic, r&b, country, classical, or null
- Intent is always "recommendation"

Return ONLY this JSON structure, nothing else:
{"mood": "detected_mood", "genre": "detected_genre_or_null", "intent": "recommendation"}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = cleanJsonResponse(text);

    console.log("🔍 AI Preference analysis:", cleaned);

    return JSON.parse(cleaned);
  } catch (error) {
    console.error("❌ Gemini analysis error:", error.message);
    console.log("⚠️ Using keyword fallback");

    const mood = detectMoodFromKeywords(userMessage);
    console.log("🔍 Fallback detected mood:", mood || "mixed");
    return { mood, genre: null, intent: "recommendation" };
  }
};

/**
 * Gợi ý nhạc dựa trên mood/genre
 */
export const generateMusicRecommendation = async (userPrompt, context) => {
  try {
    const model = genAI.getGenerativeModel({
      model: WORKING_MODEL,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 50,
      },
    });

    const songsInfo = context.songs
      .map(
        (s, idx) =>
          `${idx + 1}. "${s.title}" by ${s.artist}
       - Mood: ${s.mood?.join(", ") || "N/A"}
       - Genre: ${s.genre || "N/A"}
       - Tags: ${s.tags?.join(", ") || "N/A"}
       - Description: ${s.description || "N/A"}
       - ID: ${s.id}`
      )
      .join("\n");

    // Build chat history context if available
    let chatHistoryContext = "";
    if (context.chatHistory && context.chatHistory.length > 0) {
      const history = context.chatHistory
        .reverse() // Oldest first
        .map((msg) => {
          const role = msg.role === "user" ? "User" : "Assistant";
          let content = `${role}: ${msg.content}`;
          if (msg.role === "assistant" && msg.recommendations?.length > 0) {
            // Get song titles from IDs
            const songTitles = msg.recommendations
              .map((songId) => {
                const song = context.songs.find((s) => s.id === songId.toString());
                return song ? `"${song.title}" by ${song.artist}` : null;
              })
              .filter(Boolean)
              .join(", ");
            if (songTitles) {
              content += ` [Recommended: ${songTitles}]`;
            }
          }
          return content;
        })
        .join("\n");
      chatHistoryContext = `\n\nRecent conversation history:\n${history}\n`;
    }

    const prompt = `You are a music expert. Recommend songs based on user request.
${chatHistoryContext}
Current user request: "${userPrompt}"

Available songs in database:
${songsInfo}

IMPORTANT RULES:
1. ONLY recommend songs from the list above
2. Use the EXACT song IDs provided (they look like MongoDB ObjectIDs)
3. DETECT USER INTENT FIRST:
   - If user asks for ONE SPECIFIC SONG (e.g., "play Enemy", "I want Nơi này có anh") → Check if that EXACT song exists in the list
     * IF FOUND → Return ONLY that 1 song
     * IF NOT FOUND → Return EMPTY array with message "Sorry, I couldn't find [song name] in the library"
     * DO NOT substitute with other songs by the same artist!
   - If user asks for RECOMMENDATIONS/SIMILAR (e.g., "similar songs", "songs like", "recommend me") → Return multiple songs
   - If user asks for MOOD/GENRE (e.g., "happy songs", "energetic music") → Return multiple matching songs
   - If user asks for ARTIST SONGS (e.g., "Sơn Tùng songs", "Imagine Dragons music") → Return all songs by that artist
4. Match songs based on:
   - Song title keywords (exact match has HIGHEST priority)
   - Artist name (if user mentions specific artist)
   - Your knowledge of artist's music style and mood
   - For example: "Enemy" by Imagine Dragons is ENERGETIC/INTENSE, not calm
5. PAY ATTENTION to conversation history:
   - If user says "similar to it", "like that", "the previous one" → Look at recent recommendations
   - Understand context references from chat history
6. Better to return NOTHING than return the WRONG song
7. Detect the mood from user's request (happy/sad/energetic/calm/romantic/etc)

Examples of artist moods you should know:
- Imagine Dragons = energetic, powerful, intense rock
- Sơn Tùng M-TP = varies (some energetic, some emotional)
- TWICE/MOMO = upbeat K-pop
- Adele = sad, emotional ballads
- Ed Sheeran = romantic, calm


Return ONLY this JSON structure, no extra text:
{
  "message": "Friendly response explaining the recommendations",
  "recommendations": ["song_id_1", "song_id_2", "song_id_3"],
  "mood": "detected_mood",
  "matchScore": 85
}`;

    //"reason": "Why these specific songs match (be honest if some don't fit)",

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = cleanJsonResponse(text);

    console.log("🎵 AI Response (raw):", cleaned);

    const aiResponse = JSON.parse(cleaned);

    // Validate song IDs exist
    const validIds = context.songs.map((s) => s.id);
    const validRecommendations = aiResponse.recommendations.filter((id) =>
      validIds.includes(id)
    );

    console.log(
      `✅ Valid recommendations: ${validRecommendations.length} out of ${aiResponse.recommendations.length}`
    );

    if (validRecommendations.length > 0) {
      return {
        message: aiResponse.message,
        recommendations: validRecommendations.slice(0, 6),
        reason: aiResponse.reason,
        mood: aiResponse.mood || "mixed",
        matchScore: aiResponse.matchScore || 85,
      };
    }

    // If AI returned invalid IDs, throw to trigger fallback
    throw new Error("No valid song IDs from AI");
  } catch (error) {
    console.error("Gemini recommendation error:", error.message);
    console.log("Using smart fallback");

    // IMPROVED FALLBACK
    const userLower = userPrompt.toLowerCase();
    let matched = [];
    let mood = "mixed";

    // 0. PRIORITY: Check for SPECIFIC SONG REQUEST
    // Patterns: "play [song]", "listen to [song]", "I want [song]", "put on [song]"
    const specificSongPattern = /^(play|listen to|i want|put on|nghe|cho tôi nghe|tôi muốn nghe)\s+(.+)$/i;
    const specificMatch = userPrompt.match(specificSongPattern);
    
    if (specificMatch) {
      const songName = specificMatch[2].trim().toLowerCase();
      console.log(`🎯 Detected specific song request: "${songName}"`);
      
      // Try exact match first
      let exactMatch = context.songs.find(s => 
        s.title.toLowerCase() === songName
      );
      
      // If no exact match, try partial match
      if (!exactMatch) {
        exactMatch = context.songs.find(s => 
          s.title.toLowerCase().includes(songName) ||
          songName.includes(s.title.toLowerCase())
        );
      }
      
      if (exactMatch) {
        console.log(`✅ Found exact match: "${exactMatch.title}" by ${exactMatch.artist}`);
        return {
          message: `Playing "${exactMatch.title}" by ${exactMatch.artist}`,
          recommendations: [exactMatch.id],
          reason: "Exact song match",
          mood: "specific",
          matchScore: 100,
        };
      } else {
        console.log(`❌ Song "${songName}" not found in database`);
        return {
          message: `Sorry, I couldn't find "${specificMatch[2]}" in the library. Try asking for a different song or mood!`,
          recommendations: [],
          reason: "Song not found in database",
          mood: "specific",
          matchScore: 0,
        };
      }
    }

    // 1. Check for specific artist
    const artistMatch = context.songs.filter((s) =>
      userLower.includes(s.artist.toLowerCase())
    );
    if (artistMatch.length > 0) {
      matched = artistMatch;
      mood = "artist-based";
      console.log(`Found ${matched.length} songs by matching artist`);
    } else {
      // 2. Detect mood and filter STRICTLY
      const detectedMood = detectMoodFromKeywords(userPrompt);
      if (detectedMood) {
        const filtered = filterSongsByMood(context.songs, detectedMood);

        // Use filtered results if we got meaningful matches
        // If >80% of all songs match, keywords might be too generic - still use but limit to 6
        if (filtered.length > 0 && filtered.length <= context.songs.length * 0.8) {
          matched = filtered;
          mood = detectedMood;
          console.log(
            `Found ${matched.length} ${mood} songs using keyword matching`
          );
        } else if (filtered.length > context.songs.length * 0.8) {
          // Too many matches - use subset
          matched = filtered.slice(0, 6);
          mood = detectedMood;
          console.log(
            `Found ${filtered.length} ${mood} songs (using top 6)`
          );
        } else {
          // No matches
          matched = [];
          mood = detectedMood;
          console.log(`No ${mood} songs found in database`);
        }
      }
    }

    // If no matches, return helpful message
    if (matched.length === 0) {
      return {
        message: `I couldn't find any ${
          mood !== "mixed" ? mood : ""
        } songs in the library yet. Want me to suggest another mood or genre instead?`,
        recommendations: [],
        reason: `No songs match the ${mood} mood in current database`,
        mood: mood,
        matchScore: 0,
      };
    }

    // Shuffle to add variety
    const shuffled = matched.sort(() => Math.random() - 0.5);

    return {
      message: `I found ${shuffled.length} ${
        mood !== "mixed" && mood !== "artist-based" ? mood : ""
      } song${shuffled.length > 1 ? "s" : ""} for you!`,
      recommendations: shuffled.slice(0, 6).map((s) => s.id),
      reason:
        mood !== "mixed"
          ? `Matched based on ${mood} ${
              mood === "artist-based" ? "preference" : "mood"
            }`
          : "Popular selections",
      mood: mood === "artist-based" ? "mixed" : mood,
      matchScore: 75,
    };
  }
};

/**
 * Find similar songs to a target song using AI
 */
export const analyzeSongSimilarity = async (targetSong, allSongs) => {
  try {
    const model = genAI.getGenerativeModel({
      model: WORKING_MODEL,
      generationConfig: {
        temperature: 0.5,
        topP: 0.8,
      },
    });

    const otherSongs = allSongs
      .filter((s) => s.id !== targetSong.id)
      .map((s, idx) => `${idx + 1}. "${s.title}" by ${s.artist} [ID: ${s.id}]`)
      .join("\n");

    const prompt = `Find songs similar to this target song:
Target: "${targetSong.title}" by ${targetSong.artist}

Available songs:
${otherSongs}

Criteria for similarity:
1. Same artist (highest priority)
2. Similar genre/style based on your knowledge
3. Similar mood/vibe
4. Similar era/decade

Recommend 5 most similar songs.

Return ONLY this JSON:
{
  "similarSongs": ["id1", "id2", "id3", "id4", "id5"],
  "matchCriteria": ["artist style", "genre", "mood"]
}`;

    // "reason": "Brief explanation",

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = cleanJsonResponse(text);

    console.log("🔎 Similarity response:", cleaned);

    const aiResponse = JSON.parse(cleaned);

    // Validate IDs
    const validIds = allSongs.map((s) => s.id);
    const validSimilar = aiResponse.similarSongs.filter((id) =>
      validIds.includes(id)
    );

    if (validSimilar.length === 0) {
      throw new Error("No valid similar songs");
    }

    return {
      similarSongs: validSimilar.slice(0, 5),
      reason: aiResponse.reason,
      matchCriteria: aiResponse.matchCriteria,
    };
  } catch (error) {
    console.error("❌ Gemini similarity error:", error.message);

    // Fallback: same artist only - DON'T return random songs
    const sameArtist = allSongs
      .filter((s) => s.artist.toLowerCase() === targetSong.artist.toLowerCase() && s.id !== targetSong.id)
      .slice(0, 5);

    if (sameArtist.length === 0) {
      // No similar songs found - be honest
      return {
        similarSongs: [],
        reason: `No similar songs found in the current library. The database doesn't have other songs by ${targetSong.artist} or with similar style.`,
        matchCriteria: [],
      };
    }

    return {
      similarSongs: sameArtist.map((s) => s.id),
      reason: `Songs by ${targetSong.artist}`,
      matchCriteria: ["same artist"],
    };
  }
};
