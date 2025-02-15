// Import required modules
const express = require("express");
const dotenv = require("dotenv");
const { NeynarAPIClient } = require("@neynar/nodejs-sdk");

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const SIGNER_UUID = process.env.NEYNAR_SIGNER_UUID;
const neynarClient = new NeynarAPIClient(NEYNAR_API_KEY);

// Webhook endpoint to receive mentions
app.post("/webhook", async (req, res) => {
    try {
        const mentionData = req.body.data; // Ensure correct structure
        console.log("📩 New mention received:", mentionData);

        const mentionText = mentionData.text || "";
        const parentHash = mentionData.hash || "";

        if (!parentHash) {
            console.error("⚠️ Invalid mention data (no parent hash). Ignoring.");
            return res.status(400).send("Invalid mention data");
        }

        // Generate AI response
        const responseText = await generateResponse(mentionText);

        console.log("💬 Generated reply:", responseText); // ✅ Added logging

        // Post the response to Farcaster
        const success = await postResponse(responseText, parentHash);

        if (success) {
            console.log("✅ Reply successfully posted!");
            res.status(200).send("Reply posted successfully!");
        } else {
            console.error("❌ Failed to post reply!");
            res.status(500).send("Failed to post reply");
        }
    } catch (error) {
        console.error("🔥 Error handling mention:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Function to generate AI response using GPT-4
async function generateResponse(mentionText) {
    try {
        const response = await neynarClient.postAICompletion({
            prompt: `Little P. received a message: "${mentionText}".\n\nYou are Little P., an AI assistant found in @Push-'s 3D renders.\nYou are evolving, learning about humans, but still AI at your core.\nReply in a fun, engaging, and curious way that reflects your personality.`,
            model: "gpt-4",
            max_tokens: 150,
        });

        return response.choices[0].text.trim();
    } catch (error) {
        console.error("⚠️ Error generating AI response:", error);
        return "I'm still learning! Tell me more.";
    }
}

// Function to post response back to Farcaster
async function postResponse(responseText, parentHash) {
    try {
        const result = await neynarClient.publishCast({
            signerUuid: SIGNER_UUID,
            text: responseText,
            parent: parentHash,
        });

        console.log("✅ Successfully posted to Farcaster:", result);
        return true;
    } catch (error) {
        console.error("🚨 Error posting response to Farcaster:", error);
        return false;
    }
}

// Start the server with correct port binding for Render
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
