import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import express from "express";
import UserAgent from "user-agent-array"; // Randomizes identity to avoid blocks

dotenv.config();

// --- 1. CLOUD SERVER SETUP (Keeps Render Awake) ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("Worker is running safely..."));
app.listen(PORT, () =>
  console.log(`🌍 Cloud Server listening on port ${PORT}`)
);

// --- 2. CONFIGURATION ---
const GEMINI_KEY = process.env.GEMINI_API_KEY;
// Note: When deployed, this uses the Render URL. Locally, it uses localhost.
const LARAVEL_API =
  process.env.LARAVEL_API || "http://127.0.0.1:8000/api/articles";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getPendingArticle() {
  try {
    const res = await axios.get(LARAVEL_API);
    // Find the first article that has NO ai_content yet
    return res.data.find((a) => !a.ai_content);
  } catch (err) {
    console.error(
      "API Connection Error (Backend might be sleeping):",
      err.message
    );
    return null;
  }
}

// --- 3. SMART RESEARCH (Cheerio + Fallback) ---
async function performResearch(query) {
  console.log(`🔎 Attempting Google Search for: "${query}"...`);

  try {
    // A. The "Real" Search Attempt
    // We use a random User-Agent to look like a real Laptop, not a bot
    const headers = { "User-Agent": new UserAgent().toString() };

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
      query
    )}`;
    const { data } = await axios.get(searchUrl, { headers, timeout: 5000 });

    const $ = cheerio.load(data);
    const links = [];

    // Extract clean links from Google results
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      if (href && href.startsWith("/url?q=")) {
        const cleanUrl = href.split("/url?q=")[1].split("&")[0];
        // Filter out Google's own links and our source site
        if (
          !cleanUrl.includes("google.com") &&
          !cleanUrl.includes("beyondchats")
        ) {
          links.push(cleanUrl);
        }
      }
    });

    // If we found links, scrape the top 2
    if (links.length > 0) {
      console.log(`   ✅ Found ${links.length} links. Scraping top 2...`);
      const researchData = [];

      for (const link of links.slice(0, 2)) {
        try {
          const pageRes = await axios.get(link, { headers, timeout: 4000 });
          const $$ = cheerio.load(pageRes.data);
          // Remove menu, scripts, and footer to get just the article text
          $$("script, style, nav, footer, header").remove();
          const text = $$("body")
            .text()
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 1500);

          if (text.length > 100) {
            researchData.push({ url: link, content: text });
          }
        } catch (e) {
          // Skip broken links silently
        }
      }

      if (researchData.length > 0) return researchData;
    }
  } catch (error) {
    console.log(
      `   ⚠️ Google Search blocked or failed (${error.message}). Switching to Fallback.`
    );
  }

  // B. The "Safety Net" Fallback
  // If Google blocks us (common on free cloud), we return this so the AI still works.
  console.log("   Using Internal AI Knowledge instead.");
  return [
    {
      url: "Internal Knowledge Base",
      content:
        "Search unavailable. Using Gemini's advanced internal database to generate authoritative insights.",
    },
  ];
}

async function rewriteWithAI(originalContent, research) {
  // Format the research into a string for Gemini
  const referenceText = research
    .map((r) => `Source (${r.url}): ${r.content}`)
    .join("\n\n");

  const prompt = `
  You are an expert editor. Rewrite the "Original Article" below to be more authoritative, clear, and professional.
  
  Context / Research:
  ${referenceText}
  
  Original Article:
  ${originalContent.substring(0, 5000)}
  
  Requirements:
  1. Use HTML formatting (<h2>, <p>, <ul>).
  2. STRICTLY DO NOT include a "References" or "Sources" section at the bottom.
  3. Return ONLY the HTML string.
  `;

  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );
    return res.data.candidates[0].content.parts[0].text;
  } catch (e) {
    console.error("Gemini Error:", e.response?.data || e.message);
    return originalContent; // Fallback: return original if AI fails
  }
}

async function updateArticle(id, aiContent) {
  console.log(`   Updating Article ID: ${id}`);
  await axios.put(`${LARAVEL_API}/${id}`, {
    ai_content: aiContent,
    version: 2,
  });
}

// === MAIN LOOP ===
(async () => {
  console.log("🚀 Cloud Worker Started (Smart Mode)...");

  while (true) {
    const article = await getPendingArticle();

    if (article) {
      console.log(`\n📝 Processing: ${article.title}`);

      // 1. Research (Google or Fallback)
      let research = await performResearch(article.title);

      // 2. Generate Content
      const newContent = await rewriteWithAI(article.content, research);

      // 3. Save to Database
      const articleId = article.id || article._id;
      if (articleId) await updateArticle(articleId, newContent);
    } else {
      // No articles found? Wait 5 seconds before checking again.
      // This prevents spamming the server.
    }

    await sleep(5000);
  }
})();
