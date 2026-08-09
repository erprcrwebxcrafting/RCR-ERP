export async function sendWhatsAppMessage(to: string, message: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    throw new Error("WhatsApp API configuration is missing in the .env file. Please configure WHATSAPP_TOKEN and WHATSAPP_PHONE_ID.");
  }

  const response = await fetch(
    `https://graph.facebook.com/v17.0/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("WhatsApp API Error:", error);
    throw new Error("Failed to send WhatsApp message");
  }
}
