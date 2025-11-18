import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ WORKING MODEL từ test của bạn
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
 * Filter songs by mood using title/artist keywords
 */
/**
 * Filter songs by mood using title/artist keywords (STRICT - no fallback)
 */
const filterSongsByMood = (songs, mood) => {
  const moodKeywords = {
    happy: {
      titles:
        /(happy|joy|party|dance|upbeat|good|fun|celebration|smile|sunshine|wonderful|beautiful)/i,
      artists:
        /(pharrell|bruno mars|dua lipa|ariana grande|katy perry|justin timberlake|mark ronson)/i,
    },
    sad: {
      titles:
        /(sad|cry|hurt|lonely|miss|someone|stay|sorry|goodbye|broken|tears|lost|alone)/i,
      artists:
        /(adele|sam smith|lewis capaldi|billie eilish|sia|coldplay|james arthur)/i,
    },
    energetic: {
      titles:
        /(energy|power|strong|run|fight|alive|wild|thunder|fire|rock|metal|enemy|battle)/i,
      artists:
        /(imagine dragons|linkin park|foo fighters|ac\/dc|metallica|guns n roses)/i,
    },
    calm: {
      titles:
        /(calm|chill|relax|slow|peace|dream|sleep|night|moon|stars|ocean|waves)/i,
      artists: /(norah jones|ed sheeran|john mayer|bon iver|james bay)/i,
      // EXCLUDE energetic artists
      exclude: /(imagine dragons|linkin park|metallica)/i,
    },
    romantic: {
      titles:
        /(love|heart|kiss|you|beautiful|forever|perfect|heaven|angel|together)/i,
      artists:
        /(ed sheeran|john legend|bruno mars|shawn mendes|taylor swift|ariana grande)/i,
    },
  };

  const keywords = moodKeywords[mood];
  if (!keywords) return [];

  let matched = songs.filter(
    (s) => keywords.titles.test(s.title) || keywords.artists.test(s.artist)
  );

  // Apply exclusion filter if exists (for calm mood)
  if (keywords.exclude) {
    matched = matched.filter((s) => !keywords.exclude.test(s.artist));
  }

  return matched; // Return empty if no match (NOT all songs)
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

    const prompt = `You are a music expert. Recommend songs based on user request.

User request: "${userPrompt}"

Available songs in database:
${songsInfo}

IMPORTANT RULES:
1. ONLY recommend songs from the list above
2. Use the EXACT song IDs provided (they look like MongoDB ObjectIDs)
3. Match songs based on:
   - Artist name (if user mentions specific artist like "Sơn Tùng", ONLY recommend that artist)
   - Song title keywords
   - Your knowledge of artist's music style and mood
   - For example: "Enemy" by Imagine Dragons is ENERGETIC/INTENSE, not calm
4. If there are fewer than 3 matching songs, that's okay - recommend only what truly fits
5. Better to recommend 1-2 perfect matches than 6 wrong songs
6. Detect the mood from user's request (happy/sad/energetic/calm/romantic/etc)

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

        // ONLY use filtered if they actually matched keywords
        // If filterSongsByMood returns all songs (no match), return empty
        if (filtered.length < context.songs.length) {
          matched = filtered;
          mood = detectedMood;
          console.log(
            `Found ${matched.length} ${mood} songs using keyword matching`
          );
        } else {
          // No keyword match - be honest
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
        } songs in your library yet. Try adding more songs or ask for something else!`,
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
 * Tìm bài hát tương tự
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

    // Fallback: same artist first
    const sameArtist = allSongs
      .filter((s) => s.artist.toLowerCase() === targetSong.artist.toLowerCase())
      .slice(0, 5);

    return {
      similarSongs: (sameArtist.length > 0
        ? sameArtist
        : allSongs.slice(0, 5)
      ).map((s) => s.id),
      reason:
        sameArtist.length > 0
          ? `Same artist as ${targetSong.artist}`
          : "Popular recommendations",
      matchCriteria: ["artist"],
    };
  }
};
