import { Client, GatewayIntentBits, EmbedBuilder, Events } from "discord.js";
import fetch from "node-fetch";
import express from "express";

// ===== KEEP RENDER ALIVE =====
const app = express();
const PORT = process.env.PORT || 10000;
app.get("/", (req, res) => res.send("Bot is running"));
app.listen(PORT, () => console.log(`Web server listening on port ${PORT}`));

// ===== DISCORD CLIENT =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== CHANNEL IDs =====
const CHANNEL_IDS = [
  "148501669263170857", // Vault Radio
  "1488349767233704127" // Secondary Discord
];

// ===== API =====
const API_URL = "https://a13.asurahosting.com/api/nowplaying/366";

// ===== DJ POSTERS =====
const DJ_POSTERS = {
  "Benj": "PUT_YOUR_BENJ_IMAGE_URL_HERE",
  "DJ 0": "PUT_YOUR_DJ0_IMAGE_URL_HERE",
  "DJ Dean": "PUT_YOUR_DEAN_IMAGE_URL_HERE"
};

// ===== STATE =====
let lastStreamer = null;

// ===== CHECK LIVE =====
async function checkLive() {
  try {
    console.log("Checking live status...");

    const res = await fetch(API_URL);
    const data = await res.json();

    const isLive = data.live?.is_live;
    const streamer = data.live?.streamer_name || "Live Now";
    const title = data.now_playing?.song?.title || "Live Broadcast";

    console.log("Live:", isLive, "| Streamer:", streamer);

    if (isLive && streamer !== lastStreamer) {
      lastStreamer = streamer;

      console.log(`NEW LIVE DETECTED: ${streamer}`);

      const image = DJ_POSTERS[streamer] || null;

      const embed = new EmbedBuilder()
        .setTitle("🔴 LIVE NOW")
        .setDescription(`**${streamer}** is now live!\n\n🎵 ${title}`)
        .setColor(0xff0000)
        .setTimestamp();

      if (image) embed.setImage(image);

      for (const channelId of CHANNEL_IDS) {
        try {
          const channel = await client.channels.fetch(channelId);
          if (!channel) continue;

          await channel.send({ embeds: [embed] });
          console.log(`Posted to channel: ${channelId}`);
        } catch (err) {
          console.error(`Failed to post to ${channelId}:`, err.message);
        }
      }
    }

    if (!isLive) {
      lastStreamer = null;
    }

  } catch (err) {
    console.error("Error checking live status:", err);
  }
}

// ===== BOT READY =====
client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  setInterval(checkLive, 60000);
});

// ===== LOGIN + TOKEN DEBUG =====
console.log("Starting Discord bot login...");

const token = process.env.DISCORD_TOKEN?.trim();

if (!token) {
  console.error("❌ DISCORD_TOKEN missing!");
  process.exit(1);
}

console.log("Token found, length:", token.length);

// Test token BEFORE login
const test = await fetch("https://discord.com/api/v10/users/@me", {
  headers: {
    Authorization: `Bot ${token}`
  }
});

const botInfo = await test.json();

console.log("Discord token test status:", test.status);
console.log("Discord bot info:", botInfo.username || botInfo.message);

// Actual login
client.login(token)
  .then(() => {
    console.log("Discord login request accepted.");
  })
  .catch((err) => {
    console.error("Discord login failed:", err.message);
  });
