{\rtf1\ansi\ansicpg1252\cocoartf2639
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx566\tx1133\tx1700\tx2267\tx2834\tx3401\tx3968\tx4535\tx5102\tx5669\tx6236\tx6803\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // Import required modules\
const express = require("express");\
const axios = require("axios");\
const dotenv = require("dotenv");\
\
dotenv.config();\
\
const app = express();\
app.use(express.json());\
\
const PORT = process.env.PORT || 3000;\
\
// Webhook endpoint to receive mentions\
app.post("/webhook", async (req, res) => \{\
    try \{\
        const mentionData = req.body;\
        console.log("New mention received:", mentionData);\
\
        const mentionText = mentionData.text || "";\
        const parentHash = mentionData.hash || "";\
\
        if (!parentHash) \{\
            return res.status(400).send("Invalid mention data");\
        \}\
\
        // Generate AI response\
        const responseText = await generateResponse(mentionText);\
\
        // Post the response to Farcaster\
        await postResponse(responseText, parentHash);\
\
        res.status(200).send("Reply posted successfully!");\
    \} catch (error) \{\
        console.error("Error handling mention:", error);\
        res.status(500).send("Internal Server Error");\
    \}\
\});\
\
// Function to generate AI response using GPT-4\
async function generateResponse(mentionText) \{\
    try \{\
        const openaiResponse = await axios.post(\
            "https://api.openai.com/v1/completions",\
            \{\
                model: "gpt-4",\
                prompt: `Little P. received a message: "$\{mentionText\}".\\n\\nYou are Little P., an AI assistant found in @Push-'s 3D renders.\\nYou are evolving, learning about humans, but still AI at your core.\\nReply in a fun, engaging, and curious way that reflects your personality.`,\
                max_tokens: 150,\
            \},\
            \{\
                headers: \{\
                    Authorization: `Bearer $\{process.env.OPENAI_API_KEY\}`,\
                    "Content-Type": "application/json",\
                \},\
            \}\
        );\
\
        return openaiResponse.data.choices[0].text.trim();\
    \} catch (error) \{\
        console.error("Error generating AI response:", error);\
        return "I'm still learning! Tell me more.";\
    \}\
\}\
\
// Function to post response back to Farcaster\
async function postResponse(responseText, parentHash) \{\
    try \{\
        await axios.post(\
            "https://api.neynar.com/v2/farcaster/cast",\
            \{\
                signer_uuid: process.env.NEYNAR_SIGNER_UUID,\
                text: responseText,\
                parent: parentHash,\
            \},\
            \{\
                headers: \{\
                    Authorization: `Bearer $\{process.env.NEYNAR_API_KEY\}`,\
                    "Content-Type": "application/json",\
                \},\
            \}\
        );\
    \} catch (error) \{\
        console.error("Error posting response to Farcaster:", error);\
    \}\
\}\
\
// Start the server\
app.listen(PORT, () => \{\
    console.log(`Server is running on port $\{PORT\}`);\
\});\
}