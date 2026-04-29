import 'dotenv/config';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';

const CHANNELS = [
  "1485016692613710057", // Vault Radio
  "1488349767233704127"  // Secondary Discord
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
    const res = await fetch(API_URL);
    const data = await res.json();

    const isLive = data.live?.is_live;
    const streamer = data.live?.streamer_name;

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

client.once("clientReady", () => {
  console.log(`Logged in as ${client.user.tag}`);
  checkLive();
  setInterval(checkLive, 60000);
});

client.login(process.env.DISCORD_TOKEN);