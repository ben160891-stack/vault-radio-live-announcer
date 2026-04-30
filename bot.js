import 'dotenv/config';
import http from 'http';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Vault Radio Live Bot is running');
}).listen(PORT, () => {
  console.log(`Web server listening on port ${PORT}`);
});

const CHANNELS = [
  "1485016692613710057",
  "1488349767233704127"
];

const API_URL = "https://a13.asurahosting.com/api/nowplaying/366";
const WEBSITE_URL = "https://vaultradio.co.uk";

const djImages = {
  "Benj": "https://cdn.discordapp.com/attachments/1388592743877578854/1499109621212905644/benj.png",
  "DJ O": "https://cdn.discordapp.com/attachments/1388592743877578854/1499109588954513468/audie.png",
  "DJ DEAN": "https://cdn.discordapp.com/attachments/1388592743877578854/1499109667224162455/dj_dean.png"
};

const defaultImage = "https://cdn.discordapp.com/attachments/1388592743877578854/1499109621212905644/benj.png";

let lastStreamer = null;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

async function checkLive() {
  try {
    console.log("Checking live status...");

    const res = await fetch(API_URL);
    const data = await res.json();

    const isLive = data.live?.is_live;
    const streamer = data.live?.streamer_name;

    console.log(`Live: ${isLive} | Streamer: ${streamer}`);

    if (isLive && streamer && streamer !== lastStreamer) {
      const image = djImages[streamer] || defaultImage;

      const embed = new EmbedBuilder()
        .setTitle(`🔴 LIVE NOW: ${streamer}`)
        .setDescription(`🎧 Tune in now on Vault Radio\n\n👉 ${WEBSITE_URL}`)
        .setImage(image)
        .setColor("#ff0000")
        .setFooter({ text: "Vault Radio Live" })
        .setTimestamp();

      for (const channelId of CHANNELS) {
        try {
          const channel = await client.channels.fetch(channelId);

          if (!channel) {
            console.log(`Channel not found: ${channelId}`);
            continue;
          }

          await channel.send({ embeds: [embed] });
          console.log(`Posted to channel: ${channelId}`);
        } catch (err) {
          console.error(`Failed to post to channel ${channelId}:`, err.message);
        }
      }

      console.log(`${streamer} went live`);
      lastStreamer = streamer;
    }

    if (!isLive) {
      lastStreamer = null;
    }
  } catch (error) {
    console.error("Error checking live status:", error);
  }
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  checkLive();
  setInterval(checkLive, 60000);
});

console.log("Starting Discord bot login...");

if (!process.env.DISCORD_TOKEN) {
  console.error("DISCORD_TOKEN is missing!");
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN).catch((err) => {
  console.error("Discord login failed:", err.message);
});
