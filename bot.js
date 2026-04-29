import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';

// =======================
// CONFIG
// =======================

const CHANNEL_IDS = [
  "YOUR_CHANNEL_ID_1", // Vault Radio
  "YOUR_CHANNEL_ID_2"  // Second server
];

const API_URL = "https://a13.asurahosting.com/api/nowplaying/366";

// =======================
// EXPRESS (for Render)
// =======================

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

app.listen(PORT, () => {
  console.log(`Web server listening on port ${PORT}`);
});

// =======================
// DISCORD BOT
// =======================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

let lastStreamer = null;

// =======================
// CHECK LIVE STATUS
// =======================

async function checkLive() {
  try {
    console.log("Checking live status...");

    const res = await fetch(API_URL);
    const data = await res.json();

    const isLive = data.live.is_live;
    const streamer = data.live.streamer_name;

    console.log(`Live: ${isLive} | Streamer: ${streamer}`);

    if (isLive && streamer !== lastStreamer) {
      lastStreamer = streamer;

      const embed = new EmbedBuilder()
        .setColor("#ff6600")
        .setTitle("🔴 LIVE NOW ON VAULT RADIO")
        .setDescription(`🎧 **${streamer}** is now live!\n\nTune in now!`)
        .setImage("https://your-image-link-here.com/poster.jpg") // 👈 REPLACE WITH YOUR POSTER URL
        .setFooter({ text: "Vault Radio • 24/7" })
        .setTimestamp();

      for (const channelId of CHANNEL_IDS) {
        try {
          const channel = await client.channels.fetch(channelId);
          if (!channel) continue;

          await channel.send({ embeds: [embed] });
          console.log(`Posted to channel: ${channelId}`);
        } catch (err) {
          console.error(`Failed to post to channel ${channelId}:`, err.message);
        }
      }
    }

    if (!isLive) {
      lastStreamer = null;
    }

  } catch (error) {
    console.error("Error checking live status:", error);
  }
}

// =======================
// BOT READY
// =======================

client.once("clientReady", () => {
  console.log(`Logged in as ${client.user.tag}`);
  setInterval(checkLive, 60000); // every 60 seconds
});

// =======================
// LOGIN (IMPORTANT)
// =======================

console.log("Starting Discord bot login...");

if (!process.env.DISCORD_TOKEN) {
  console.error("DISCORD_TOKEN is missing!");
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN).catch((err) => {
  console.error("Discord login failed:", err.message);
});
