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

function validateMetaSignature(appSecret, signatureHeader, rawBody) {
  if (!appSecret || !signatureHeader) return false;

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");

  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function messageBody(message) {
  if (!message) return "";
  if (message.text?.body) return message.text.body;
  if (message.button?.text) return message.button.text;
  if (message.interactive?.button_reply?.title) {
    return message.interactive.button_reply.title;
  }
  if (message.interactive?.list_reply?.title) {
    return message.interactive.list_reply.title;
  }
  if (message.image) return message.image.caption || "(image)";
  if (message.video) return message.video.caption || "(video)";
  if (message.document) {
    return message.document.caption || message.document.filename || "(document)";
  }
  if (message.audio) return "(audio)";
  if (message.sticker) return "(sticker)";
  if (message.location) {
    return `location ${message.location.latitude},${message.location.longitude}`;
  }
  return `(${message.type || "unknown"})`;
}

function collectIncoming(payload) {
  const items = [];
  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value;
      if (!value) continue;
      const metadata = value.metadata ?? {};
      const contacts = value.contacts ?? [];
      for (const message of value.messages ?? []) {
        const contact =
          contacts.find((item) => item.wa_id === message.from) ?? contacts[0];
        items.push({
          profileName: contact?.profile?.name || "",
          waId: contact?.wa_id || message.from || "",
          from: message.from || "",
          to: metadata.display_phone_number || metadata.phone_number_id || "",
          messageSid: message.id || "",
          type: message.type || "",
          body: messageBody(message),
        });
      }
    }
  }
  return items;
}

async function forwardMessage(item) {
  const text = [
    "Incoming WhatsApp message (Meta)",
    "",
    `WhatsApp name: ${item.profileName || "(not provided)"}`,
    `WhatsApp ID: ${item.waId || "(not provided)"}`,
    `From: ${item.from}`,
    `To (your Meta number): ${item.to}`,
    `Message ID: ${item.messageSid}`,
    `Type: ${item.type || "(unknown)"}`,
    "",
    "Message:",
    item.body || "(empty / media-only)",
  ].join("\n");

  const html = `
      <p><strong>Incoming WhatsApp message (Meta)</strong></p>
      <p><strong>WhatsApp name:</strong> ${escapeHtml(item.profileName || "(not provided)")}</p>
      <p><strong>WhatsApp ID:</strong> ${escapeHtml(item.waId || "(not provided)")}</p>
      <p><strong>From:</strong> ${escapeHtml(item.from)}</p>
      <p><strong>To (your Meta number):</strong> ${escapeHtml(item.to)}</p>
      <p><strong>Message ID:</strong> ${escapeHtml(item.messageSid)}</p>
      <p><strong>Type:</strong> ${escapeHtml(item.type || "(unknown)")}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(item.body || "(empty / media-only)").replace(/\n/g, "<br>")}</p>
    `;

  await sgMail.send({
    to: "info@tu.biz",
    from: "edgar@teams.tu.biz",
    subject: `WhatsApp (Meta) from ${item.profileName || item.waId || item.from || "unknown"}`,
    custom_args: { teams: "teams.tu.biz" },
    text,
    html,
  });
}

export async function GET(req) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  const expected = process.env.META_VERIFY_TOKEN;

  if (mode === "subscribe" && expected && token === expected) {
    return new NextResponse(String(challenge ?? ""), {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return NextResponse.json(
    { error: "Webhook verification failed" },
    { status: 403 },
  );
}

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const appSecret = process.env.META_APP_SECRET;
    const signature = req.headers.get("x-hub-signature-256") || "";

    if (appSecret && !validateMetaSignature(appSecret, signature, rawBody)) {
      return NextResponse.json(
        { error: "Invalid Meta signature" },
        { status: 403 },
      );
    }

    let payload = {};
    if (rawBody) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }
    }

    const incoming = collectIncoming(payload);
    for (const item of incoming) {
      await forwardMessage(item);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("WhatsApp Meta webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
