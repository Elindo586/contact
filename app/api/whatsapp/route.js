import { NextResponse } from "next/server";
import crypto from "crypto";
import sgMail from "@sendgrid/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function twiml() {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    },
  );
}

function validateTwilioSignature(authToken, signature, url, params) {
  if (!authToken || !signature) return false;

  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);

  const expected = crypto
    .createHmac("sha1", authToken)
    .update(Buffer.from(data, "utf-8"))
    .digest("base64");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function collectMedia(params) {
  const count = Number(params.NumMedia || 0);
  const items = [];
  for (let i = 0; i < count; i += 1) {
    items.push({
      url: params[`MediaUrl${i}`] || "",
      contentType: params[`MediaContentType${i}`] || "",
    });
  }
  return items;
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const params = {};
    for (const [key, value] of formData.entries()) {
      params[key] = String(value);
    }

    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("host");
    const webhookUrl = `${proto}://${host}${req.nextUrl.pathname}${req.nextUrl.search}`;
    const signature = req.headers.get("x-twilio-signature") || "";
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (
      authToken &&
      !validateTwilioSignature(authToken, signature, webhookUrl, params)
    ) {
      return NextResponse.json(
        { error: "Invalid Twilio signature" },
        { status: 403 },
      );
    }

    const from = params.From || "";
    const to = params.To || "";
    const body = params.Body || "";
    const profileName = params.ProfileName || "";
    const waId = params.WaId || "";
    const messageSid = params.MessageSid || params.SmsMessageSid || "";
    const numMedia = params.NumMedia || "0";
    const media = collectMedia(params);

    const mediaText = media.length
      ? media
          .map((item, i) => `  ${i + 1}. ${item.contentType} ${item.url}`)
          .join("\n")
      : "(none)";

    const text = [
      "Incoming WhatsApp message",
      "",
      `WhatsApp name: ${profileName || "(not provided)"}`,
      `WhatsApp ID: ${waId || "(not provided)"}`,
      `From: ${from}`,
      `To (your Twilio number): ${to}`,
      `Message SID: ${messageSid}`,
      `Media count: ${numMedia}`,
      `Media:`,
      mediaText,
      "",
      "Message:",
      body || "(empty / media-only)",
    ].join("\n");

    const mediaHtml = media.length
      ? `<ul>${media
          .map(
            (item) =>
              `<li>${escapeHtml(item.contentType)} — ${escapeHtml(item.url)}</li>`,
          )
          .join("")}</ul>`
      : "<p>(none)</p>";

    const html = `
      <p><strong>Incoming WhatsApp message</strong></p>
      <p><strong>WhatsApp name:</strong> ${escapeHtml(profileName || "(not provided)")}</p>
      <p><strong>WhatsApp ID:</strong> ${escapeHtml(waId || "(not provided)")}</p>
      <p><strong>From:</strong> ${escapeHtml(from)}</p>
      <p><strong>To (your Twilio number):</strong> ${escapeHtml(to)}</p>
      <p><strong>Message SID:</strong> ${escapeHtml(messageSid)}</p>
      <p><strong>Media count:</strong> ${escapeHtml(numMedia)}</p>
      <p><strong>Media:</strong></p>
      ${mediaHtml}
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(body || "(empty / media-only)").replace(/\n/g, "<br>")}</p>
    `;

    await sgMail.send({
      to: "info@tu.biz",
      from: "edgar@teams.tu.biz",
      subject: `WhatsApp from ${profileName || waId || from || "unknown"}`,
      custom_args: { teams: "teams.tu.biz" },
      text,
      html,
    });

    return twiml();
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
