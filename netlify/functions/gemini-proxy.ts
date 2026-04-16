
import { GoogleGenAI, Type } from "@google/genai";
import type { Handler } from "@netlify/functions";

// Helper function to parse meta tags from HTML using a more robust method
const parseMetaTags = (html: string, baseUrl: string) => {
  const getTag = (prop: string) => {
    const metaTags = html.match(/<meta[^>]*?>/g) || [];
    const propRegex = new RegExp(`(property|name)=["']${prop}["']`);
    const contentRegex = /content=(?:"([^"]*?)"|'([^']*?)')/;
    for (const tag of metaTags) {
      if (propRegex.test(tag)) {
        const contentMatch = tag.match(contentRegex);
        if (contentMatch) return contentMatch[1] || contentMatch[2];
      }
    }
    return null;
  };
  const getTitle = () => {
    const titleRegex = /<title[^>]*>([^<]*)<\/title>/i;
    const match = html.match(titleRegex);
    return match ? match[1] : null;
  };
  let image = getTag("og:image") || getTag("twitter:image");
  if (image && !image.startsWith("http")) {
      try {
          image = new URL(image, baseUrl).href;
      } catch (e) {
          console.error("Failed to construct absolute image URL", e);
          image = null;
      }
  }
  const decodeHtml = (text: string | null) => {
      if (!text) return "";
      const entities: {[key: string]: string} = {'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'"};
      return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, m => entities[m]);
  };
  return {
    title: decodeHtml(getTag("og:title") || getTag("twitter:title") || getTitle()) || "Untitled Article",
    description: decodeHtml(getTag("og:description") || getTag("twitter:description") || getTag("description")) || "",
    image: image,
  };
};

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const body = JSON.parse(event.body || '{}');
    const { type, prompt, image, url, title, description } = body;

    if (type === 'generate') {
      if (!prompt) return { statusCode: 400, body: JSON.stringify({ error: 'Prompt required' }) };
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `High-quality digital artwork: ${prompt}. Professional artistic style, masterpiece.` }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(response) };

    } else if (type === 'enhance') {
      if (!image?.data) return { statusCode: 400, body: JSON.stringify({ error: 'Image data required' }) };
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ inlineData: { mimeType: image.mimeType, data: image.data } }, { text: 'Professionally enhance this artwork.' }] }
      });
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(response) };
    
    } else if (type === 'suggest-price') {
      if (!image?.data) return { statusCode: 400, body: JSON.stringify({ error: 'Image data required' }) };
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: image.mimeType, data: image.data } },
            { text: `Analyze this artwork titled "${title || 'Untitled'}" with description "${description || 'None'}". Suggest a fair market price in USD for an original digital/physical piece. Return ONLY JSON with fields: suggestedPrice (number) and reasoning (string).` }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedPrice: { type: Type.NUMBER },
              reasoning: { type: Type.STRING }
            },
            required: ['suggestedPrice', 'reasoning']
          }
        }
      });
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: response.text };

    } else if (type === 'intelligent-preview') {
        if (!url) return { statusCode: 400, body: JSON.stringify({ error: 'URL required' }) };

        // --- Stage 1: Fast Scrape ---
        try {
            const fastResponse = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }});
            if (fastResponse.ok) {
                const html = await fastResponse.text();
                const metadata = parseMetaTags(html, url);
                if (metadata.title && metadata.title !== "Untitled Article" && metadata.image) {
                    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(metadata) };
                }
            }
        } catch (e) { console.warn("Intelligent Preview: Fast Scrape failed.", e); }
        
        // --- Stage 2: AI Scrape (Fallback) ---
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Using Google Search, find the Open Graph metadata (og:title, og:description, and og:image) for the URL: ${url}. Prioritize getting a high-quality image URL. If Open Graph tags aren't available, use the page's main title and meta description.`,
                config: {
                    tools: [{googleSearch: {}}],
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            image: { type: Type.STRING }
                        },
                        required: ['title']
                    }
                }
            });

            const aiData = JSON.parse(response.text || '{}');
            if (aiData.title) {
                return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(aiData) };
            }
        } catch (e) { console.error("Intelligent Preview: AI Scrape failed.", e); }

        return { statusCode: 500, body: JSON.stringify({ error: 'Could not generate a preview for this link.' }) };

    } else if (type === 'recommend') {
      if (!prompt) return { statusCode: 400, body: JSON.stringify({ error: 'Prompt required' }) };
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: response.text };

    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request type' }) };
    }
  } catch (error: any) {
    console.error('Proxy error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message || 'Internal error' }) };
  }
};

export { handler };
