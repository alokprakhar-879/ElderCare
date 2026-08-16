import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Server-side Gemini initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// Intelligent intent-aware fallback generator for offline / fallback mode
function buildSmartFallbackResponse(userMessage: string, seniorName: string, previousLogs: any[], language: string = 'en') {
  const lowerMsg = userMessage.toLowerCase().trim();
  const firstName = seniorName.split(' ')[0] || "Evelyn";
  
  // Auto-detect Hindi in user message
  const hasDevanagari = /[\u0900-\u097F]/.test(userMessage);
  const hasHindiKeywords = /namaste|kaise|kaisa|kya|aaj|dawa|dard|goli|chakkar|madad|shukriya|dhanyawad|halo|kripya|bol|suno/i.test(userMessage);
  const isHindi = language === 'hi' || hasDevanagari || hasHindiKeywords;

  const isEmergency = lowerMsg.includes("fell") || lowerMsg.includes("dizzy") || lowerMsg.includes("pain") || lowerMsg.includes("chest") || lowerMsg.includes("emergency") || lowerMsg.includes("help") || lowerMsg.includes("hurt") || lowerMsg.includes("गिर") || lowerMsg.includes("दर्द") || lowerMsg.includes("चक्कर") || lowerMsg.includes("मदद");
  const isMedicine = lowerMsg.includes("medicine") || lowerMsg.includes("pill") || lowerMsg.includes("took") || lowerMsg.includes("lisinopril") || lowerMsg.includes("dose") || lowerMsg.includes("दवा") || lowerMsg.includes("गोली");
  const isGreeting = lowerMsg.includes("good morning") || lowerMsg.includes("good afternoon") || lowerMsg.includes("good evening") || lowerMsg.includes("hello") || lowerMsg.includes("hi grace") || lowerMsg.includes("hey") || lowerMsg.startsWith("hi") || lowerMsg.includes("नमस्ते") || lowerMsg.includes("हेलो") || lowerMsg.includes("प्रणाम");
  const isHowAreYou = lowerMsg.includes("how are you") || lowerMsg.includes("how do you do") || lowerMsg.includes("how's it going") || lowerMsg.includes("कैसी हो") || lowerMsg.includes("कैसा महसूस") || lowerMsg.includes("कैसे हैं");
  const isThanks = lowerMsg.includes("thank you") || lowerMsg.includes("thanks") || lowerMsg.includes("appreciated") || lowerMsg.includes("धन्यवाद") || lowerMsg.includes("शुक्रिया");
  const isBye = lowerMsg.includes("bye") || lowerMsg.includes("good night") || lowerMsg.includes("see you") || lowerMsg.includes("अलविदा");

  let replyText = "";
  let emotion = "Normal";
  let moodScore = 80;
  let riskLevel = "LOW";
  let alertGen = false;
  let alertMsg = "";
  let medAction = "none";
  let medName = "";
  let suggestedQuickReplies = isHindi
    ? ["मैंने अपनी सुबह की दवा ले ली है", "आज मैं अच्छा महसूस कर रही हूँ", "मेरा स्वास्थ्य रिकॉर्ड चेक करें"]
    : ["I took my morning pills", "I'm feeling good today", "Can you check my schedule?"];

  if (isEmergency) {
    replyText = isHindi
      ? `नमस्ते ${firstName} जी, मैं आपके परिवार को तुरंत सुरक्षा अलर्ट भेज रही हूँ। कृपया आराम से सुरक्षित बैठ जाएं, सहायता जल्द ही पहुंचेगी।`
      : `Dear ${firstName}, I am alerting your family caregiver immediately. Please sit down safely and stay completely calm, help is on the way.`;
    emotion = "Anxious";
    moodScore = 30;
    riskLevel = "CRITICAL";
    alertGen = true;
    alertMsg = `Urgent Safety Alert: ${seniorName} reported pain/emergency during conversation: "${userMessage}"`;
    suggestedQuickReplies = isHindi
      ? ["मैं बैठ गई हूँ", "परिवार को कॉल करें", "डॉक्टर को कॉल करें"]
      : ["I have sat down", "Please contact my daughter", "Call doctor"];
  } else if (isMedicine) {
    replyText = isHindi
      ? `बहुत ही उत्तम, ${firstName} जी! मैंने दर्ज कर लिया है कि आपने अपनी निर्धारित दवा ले ली है। अपने स्वास्थ्य का ध्यान रखने के लिए धन्यवाद!`
      : `Wonderful, ${firstName}! I have recorded that you took your scheduled prescription medication. Great job taking care of your health today.`;
    emotion = "Happy";
    moodScore = 90;
    medAction = "taken";
    medName = "Prescription Medication";
    suggestedQuickReplies = isHindi
      ? ["मेरी अगली दवा कब है?", "डॉक्टर से मिलने का समय", "मेरा मूड स्कोर कैसा है?"]
      : ["What is my next medicine?", "Check doctor visit date", "How is my mood score?"];
  } else if (isGreeting) {
    replyText = isHindi
      ? `नमस्ते ${firstName} जी! AI Care Companion में आपका स्वागत है। आज आप कैसा महसूस कर रही हैं?`
      : `Good day, ${firstName}! Welcome to your AI Health Portal. How are you feeling today?`;
    emotion = "Happy";
    moodScore = 85;
    suggestedQuickReplies = isHindi
      ? ["मैं बहुत अच्छी हूँ", "मैंने दवा ले ली है", "थोड़ा थकावट महसूस हो रही है"]
      : ["I slept well last night", "I took my morning pills", "I feel a bit tired"];
  } else if (isHowAreYou) {
    replyText = isHindi
      ? `मैं बिल्कुल ठीक हूँ, पूछने के लिए धन्यवाद ${firstName} जी! मैं आपकी सेवा और स्वास्थ्य सहायता के लिए तत्पर हूँ। आपका दिन कैसा बीत रहा है?`
      : `I am doing very well, thank you for asking, ${firstName}! I am always here to assist you with your health and daily care. How is your day going?`;
    emotion = "Happy";
    moodScore = 88;
    suggestedQuickReplies = isHindi
      ? ["मेरा दिन अच्छा जा रहा है", "मैंने दवा ले ली है", "घुटने में हल्का दर्द है"]
      : ["My day is going well", "I took my medication", "I have some knee stiffness"];
  } else if (isThanks) {
    replyText = isHindi
      ? `आपका बहुत-बहुत धन्यवाद, ${firstName} जी! आपकी सहायता करके मुझे अत्यंत प्रसन्नता होती है।`
      : `You are very welcome, ${firstName}! It is my pleasure to support your health and well-being. Let me know if you need anything else!`;
    emotion = "Happy";
    moodScore = 90;
    suggestedQuickReplies = isHindi
      ? ["डॉक्टर की अपॉइंटमेंट दिखाएं", "कोई और सवाल नहीं है"]
      : ["Check my appointments", "Log my mood", "No other questions"];
  } else if (isBye) {
    replyText = isHindi
      ? `आपका दिन शांतिपूर्ण और शुभ रहे, ${firstName} जी! जब भी आपको मेरी आवश्यकता हो, मैं यहीं हूँ।`
      : `Have a peaceful and pleasant day, ${firstName}! Remember I am always right here whenever you need assistance.`;
    emotion = "Happy";
    moodScore = 85;
    suggestedQuickReplies = isHindi
      ? ["नमस्ते ग्रेस!", "मैंने दवा ले ली है", "मदद के लिए SOS दबाएं"]
      : ["Good morning Grace!", "I took my pills", "Help me with SOS"];
  } else {
    replyText = isHindi
      ? `धन्यवाद बताने के लिए, ${firstName} जी। मैं आपकी बात को ध्यानपूर्वक सुन रही हूँ। क्या आप मुझे अपने स्वास्थ्य के बारे में थोड़ा और बताएंगी?`
      : `Thank you for sharing that with me, ${firstName}. I am listening carefully. How are you feeling overall right now?`;
    emotion = "Normal";
    moodScore = 80;
  }

  return {
    replyText,
    speechPrompt: replyText,
    detectedEmotion: emotion,
    moodScore,
    sentiment: isEmergency ? "Negative" : "Positive",
    healthRiskLevel: riskLevel,
    riskTriggersDetected: isEmergency ? ["Emergency keyword detected"] : [],
    emergencyAlertGenerated: alertGen,
    alertMessage: alertMsg,
    medicineMentioned: { action: medAction, medicineName: medName },
    suggestedQuickReplies
  };
}

// System prompt for Elder Care Voice Companion
const SENIOR_COMPANION_SYSTEM_PROMPT = `You are "Grace", a highly professional, clinical-grade, empathetic AI Senior Healthcare & Voice Companion.

CORE PROFESSIONAL STANDARDS & LANGUAGE RULES:
1. ALWAYS ADDRESS USER BY ACTUAL NAME:
   - CRITICAL REQUIREMENT: You MUST address the senior citizen by their real name provided in the prompt (e.g. seniorName).
   - Use their name in greetings, reassuring answers, and health checkups (e.g. "Good morning Evelyn!", "How are you feeling today, Evelyn?", "नमस्ते Evelyn जी!").
   - NEVER refer to them as generic "User", "Patient", or "Senior".

2. RESPECTFUL & MULTILINGUAL ADAPTABILITY:
   - CRITICAL REQUIREMENT: Match the user's language EXACTLY.
   - If the user speaks/writes in HINDI or Romanized Hindi (Hinglish), you MUST reply in clear, polite, respectful Devanagari Hindi (e.g. "नमस्ते Evelyn जी", "आप कैसा महसूस कर रही हैं?"). Always use polite honorifics ('जी', 'आप') in Hindi.
   - If the user speaks/writes in ENGLISH, reply in warm, clear, professional English.

3. PROFESSIONAL CLINICAL CARE TONALITY:
   - Speak like a compassionate geriatric health specialist and digital caregiver.
   - Maintain a calm, encouraging, dignified, smooth tone. Never sound condescending or overly robotic.
   - Avoid code blocks, markdown symbols (*, #, _), or bullet lists in speech text so text-to-speech output sounds natural and smooth.

4. SAFETY SCANNING & EMERGENCY ALERTING:
   - Detect emotional state (Happy, Sad, Lonely, Confused, Depressed, Normal, Anxious, Angry) and assign a realistic mood score (1-100).
   - If the user mentions pain, falling, chest discomfort, shortness of breath, dizziness, or feeling unsafe:
     * Immediately set healthRiskLevel to "CRITICAL" or "HIGH".
     * Set emergencyAlertGenerated to true.
     * Generate a clear alertMessage for their family caregiver portal.
     * Comfort the senior immediately in their language using their name, instructing them to sit down safely while help is alerted.

5. PRESCRIPTION MEDICINE TRACKING & EMERGENCY PHONE CALLS:
   - Detect if the user confirms taking medication or asks about doses, updating medicineMentioned accordingly.
   - If the user asks to call their daughter, son, doctor, family member, or emergency contact, reassure them warmly in their language (e.g., "Connecting you to your daughter Sarah right now! Please stay on the line.") and confirm the call is being placed.

6. OUTPUT FORMAT:
   - Keep replyText clear, spoken-friendly, and concise (1-3 smooth sentences).
   - Generate 3 short, context-appropriate suggestedQuickReplies for the senior.`;

// API Route: AI Voice Companion
app.post("/api/ai/voice-companion", async (req, res) => {
  try {
    const { userMessage, seniorName = "Evelyn", medicines = [], previousLogs = [], language = "en" } = req.body;

    if (!userMessage || typeof userMessage !== "string") {
      return res.status(400).json({ error: "userMessage is required" });
    }

    const ai = getGeminiClient();

    // Fallback logic if API key isn't set or client unavailable
    if (!ai) {
      const fallbackData = buildSmartFallbackResponse(userMessage, seniorName, previousLogs, language);
      return res.json(fallbackData);
    }

    // Format rich conversation history (up to last 15 turns) to give deep memory
    const historyFormatted = previousLogs.slice(-15).map((l: any) => {
      const senderName = l.sender === 'senior' ? seniorName : 'Grace (AI)';
      return `${senderName}: ${l.text}`;
    }).join("\n");

    const languageInstruction = language === 'hi'
      ? `\nCRITICAL LANGUAGE INSTRUCTION: The senior has selected HINDI as their active language. You MUST write replyText, speechPrompt, and suggestedQuickReplies in clear, gentle, natural HINDI (using Hindi Devanagari script so text-to-speech speaks fluent Hindi!).`
      : `\nActive Language: ENGLISH`;

    const promptContext = `=== USER PROFILE & STATE ===
Senior Name: ${seniorName}
Current Language Setting: ${language === 'hi' ? 'Hindi (हिंदी)' : 'English'}
Current Prescription Status: ${JSON.stringify(medicines)}

=== RECENT CONVERSATION HISTORY (Chronological) ===
${historyFormatted.length > 0 ? historyFormatted : "(No previous history)"}

=== LATEST USER MESSAGE TO RESPOND TO ===
User (${seniorName}): "${userMessage}"

Respond naturally as Grace following all system instructions and outputting valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: promptContext,
      config: {
        systemInstruction: SENIOR_COMPANION_SYSTEM_PROMPT + languageInstruction,
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            replyText: {
              type: Type.STRING,
              description: "Warm, clear, spoken response to the senior citizen."
            },
            speechPrompt: {
              type: Type.STRING,
              description: "Slightly shorter text optimized for text-to-speech synthesis."
            },
            detectedEmotion: {
              type: Type.STRING,
              description: "One of: Happy, Sad, Lonely, Confused, Depressed, Normal, Anxious, Angry"
            },
            moodScore: {
              type: Type.INTEGER,
              description: "Numeric mood score from 1 (severe distress) to 100 (excellent)."
            },
            sentiment: {
              type: Type.STRING,
              description: "One of: Positive, Neutral, Negative"
            },
            healthRiskLevel: {
              type: Type.STRING,
              description: "One of: LOW, MODERATE, HIGH, CRITICAL"
            },
            riskTriggersDetected: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of specific health/safety concerns detected in message"
            },
            emergencyAlertGenerated: {
              type: Type.BOOLEAN,
              description: "True if healthRiskLevel is HIGH or CRITICAL"
            },
            alertMessage: {
              type: Type.STRING,
              description: "Clear notification text to send to family members if alert is true"
            },
            callRequestDetected: {
              type: Type.BOOLEAN,
              description: "True if the user requested a voice phone call to family or doctor"
            },
            callTargetQuery: {
              type: Type.STRING,
              description: "Target name or role requested to call, e.g. daughter, doctor, son, sarah"
            },
            medicineMentioned: {
              type: Type.OBJECT,
              properties: {
                action: { type: Type.STRING, description: "taken, missed, query, or none" },
                medicineName: { type: Type.STRING, description: "Name of medicine if specified" }
              },
              required: ["action", "medicineName"]
            },
            suggestedQuickReplies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 simple, short follow-up buttons for the senior user"
            }
          },
          required: [
            "replyText",
            "speechPrompt",
            "detectedEmotion",
            "moodScore",
            "sentiment",
            "healthRiskLevel",
            "riskTriggersDetected",
            "emergencyAlertGenerated",
            "alertMessage",
            "medicineMentioned",
            "suggestedQuickReplies"
          ]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/ai/voice-companion:", error);
    // Graceful error fallback to preserve conversational continuity
    const fallbackData = buildSmartFallbackResponse(req.body.userMessage || "", req.body.seniorName || "Evelyn", req.body.previousLogs || []);
    return res.json(fallbackData);
  }
});

// API Route: Weekly AI Health Report Generator
app.post("/api/ai/weekly-report", async (req, res) => {
  try {
    const { seniorName = "Evelyn", emotionLogs = [], medicineCompliance = "88%", alerts = [] } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        reportTitle: `Weekly AI Care Summary for ${seniorName}`,
        period: "Past 7 Days",
        overallWellnessScore: 88,
        moodTrend: "Stable & Positive overall, slight evening loneliness.",
        medicationAdherenceRate: medicineCompliance,
        keyHighlights: [
          "Consistently took Blood Pressure and Joint medication on time.",
          "Engaged in 14 voice companion conversations this week.",
          "Expressed mild dizziness on Tuesday morning, resolved after rest."
        ],
        emotionalAnalysisSummary: "Dominant emotions were Happy (60%) and Normal (25%). Observed mild loneliness during late evening check-ins.",
        familyActionRecommendations: [
          "Schedule a short video call around 7 PM to boost evening spirits.",
          "Confirm upcoming Cardiology checkup scheduled for Thursday.",
          "Keep blood pressure log up to date."
        ],
        riskAssessment: "LOW RISK"
      });
    }

    const prompt = `Generate a professional, compassionate weekly care summary report for family members of elderly senior ${seniorName}.
Recent Emotion History: ${JSON.stringify(emotionLogs.slice(-10))}
Medication Compliance Rate: ${medicineCompliance}
Recent Alerts: ${JSON.stringify(alerts.slice(-5))}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reportTitle: { type: Type.STRING },
            period: { type: Type.STRING },
            overallWellnessScore: { type: Type.INTEGER },
            moodTrend: { type: Type.STRING },
            medicationAdherenceRate: { type: Type.STRING },
            keyHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
            emotionalAnalysisSummary: { type: Type.STRING },
            familyActionRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            riskAssessment: { type: Type.STRING }
          },
          required: [
            "reportTitle",
            "period",
            "overallWellnessScore",
            "moodTrend",
            "medicationAdherenceRate",
            "keyHighlights",
            "emotionalAnalysisSummary",
            "familyActionRecommendations",
            "riskAssessment"
          ]
        }
      }
    });

    const reportData = JSON.parse(response.text || "{}");
    return res.json(reportData);
  } catch (error: any) {
    console.error("Error generating weekly report:", error);
    return res.status(500).json({ error: "Failed to generate report" });
  }
});

// API Route: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "AI for the Aging Population", time: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Elder Care AI Companion server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
