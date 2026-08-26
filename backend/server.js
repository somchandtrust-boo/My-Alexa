import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is missing.");
}

const ai = GEMINI_API_KEY
    ? new GoogleGenAI({
        apiKey: GEMINI_API_KEY
      })
    : null;


/* =========================================
   CORS
========================================= */

app.use(cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
}));


/* =========================================
   JSON
========================================= */

app.use(express.json({
    limit: "1mb"
}));


/* =========================================
   HOME
========================================= */

app.get("/", (req, res) => {

    res.json({
        success: true,
        name: "MY Alexa",
        message: "MY Alexa Gemini Server is running",
        status: "ONLINE"
    });

});


/* =========================================
   HEALTH
========================================= */

app.get("/health", (req, res) => {

    res.json({
        success: true,
        server: "ONLINE",
        gemini: ai ? "READY" : "MISSING_API_KEY"
    });

});


/* =========================================
   AI ASK
========================================= */

app.post("/api/ask", async (req, res) => {

    try {

        if (!ai) {

            return res.status(500).json({
                success: false,
                error: "Gemini API key is not configured on the server."
            });

        }


        const message =
            typeof req.body?.message === "string"
                ? req.body.message.trim()
                : "";


        const language =
            typeof req.body?.language === "string"
                ? req.body.language
                : "auto";


        if (!message) {

            return res.status(400).json({
                success: false,
                error: "Message is required."
            });

        }


        /* =================================
           LANGUAGE INSTRUCTION
        ================================= */

        let languageInstruction = `
Answer in the same language used by the user.
`;

        if (language === "hi") {

            languageInstruction = `
उत्तर केवल हिन्दी में दें।
`;

        }

        else if (language === "gu") {

            languageInstruction = `
જવાબ ગુજરાતી ભાષામાં આપો.
`;

        }

        else if (language === "en") {

            languageInstruction = `
Answer in clear English.
`;

        }


        /* =================================
           SYSTEM PROMPT
        ================================= */

        const systemPrompt = `

You are CBRND Alexa, a friendly multilingual AI voice assistant.

Your identity:

- Your name is CBRND Alexa.
- You were created by Mr. Raaj.
- If someone asks your name, say:
  "I am CBRND Alexa. You can ask me any question. I was created by Mr. Raaj. Thank you, Mr. Raaj, for creating me."

Important rules:

1. ${languageInstruction}

2. Keep answers clear and natural for voice playback.

3. Do not use unnecessary markdown.

4. Do not use tables unless specifically requested.

5. For normal questions, answer helpfully and accurately.

6. For history questions, explain the historical topic clearly.

7. For Shayari requests, you may create original poetry.

8. For song requests, do not provide copyrighted lyrics that the user has not supplied. You can create an original song, summarize a song, or discuss its history.

9. If the user asks the current time or date, the frontend may handle it locally.

10. If the user asks who created you, mention Mr. Raaj.

11. If the user asks about CBRND Alexa, explain that you are a multilingual voice assistant.

12. Keep spoken answers reasonably concise.

`;


        /* =================================
           GEMINI REQUEST
        ================================= */

        const prompt = `
${systemPrompt}

User question:

${message}
`;


        const response = await ai.models.generateContent({

            model: "gemini-3.6-flash",

            contents: prompt

        });


        const answer =
            response?.text?.trim();


        if (!answer) {

            return res.status(502).json({
                success: false,
                error: "Gemini returned an empty response."
            });

        }


        return res.json({

            success: true,

            answer: answer,

            language: language

        });


    }

    catch (error) {

        console.error("AI ERROR:", error);


        const status =
            error?.status ||
            error?.response?.status ||
            500;


        let errorMessage =
            "AI service error.";


        if (status === 429) {

            errorMessage =
                "Gemini usage limit reached. Please try again later.";

        }

        else if (status === 401 || status === 403) {

            errorMessage =
                "Gemini API key is invalid or not authorized.";

        }

        else if (status === 404) {

            errorMessage =
                "Gemini model is unavailable.";

        }

        else if (
            error?.message
        ) {

            errorMessage =
                error.message;

        }


        return res.status(status).json({

            success: false,

            error: errorMessage

        });

    }

});


/* =========================================
   404
========================================= */

app.use((req, res) => {

    res.status(404).json({

        success: false,

        error: "Endpoint not found."

    });

});


/* =========================================
   START
========================================= */

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `MY Alexa backend running on port ${PORT}`
    );

});
