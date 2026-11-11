import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import blockedEmailsJson from "./blocked-emails.json";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/** Pull a bare address from "Name <email@x.com>" or a plain email string. */
function extractEmail(value) {
  const raw = String(value).trim();
  const angle = raw.match(/<([^>]+)>/);
  const candidate = (angle ? angle[1] : raw).trim().toLowerCase();
  const match = candidate.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return match ? match[0].toLowerCase() : candidate;
}

const blockList = (
  Array.isArray(blockedEmailsJson)
    ? blockedEmailsJson
    : blockedEmailsJson?.default || []
)
  .map((entry) => String(entry).trim().toLowerCase())
  .filter(Boolean);

/** "@tu.biz" matches a@tu.biz only. It does not match a@teams.tu.biz. */
const blockedDomains = new Set(
  blockList.filter((entry) => entry.startsWith("@")),
);

const blockedEmails = new Set(
  blockList
    .filter((entry) => !entry.startsWith("@"))
    .map((email) => extractEmail(email))
    .filter(Boolean),
);

function fieldString(value) {
  return typeof value === "string" ? value : "";
}

/** First blocked address in a From or Reply-To value, or "". */
function blockedMatch(value) {
  const raw = fieldString(value);
  if (!raw.trim()) return "";
  const found = raw.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || [];
  const emails = found.map((email) => email.toLowerCase());
  if (!emails.length) {
    const one = extractEmail(raw);
    if (one.includes("@")) emails.push(one);
  }
  for (const email of emails) {
    if (blockedEmails.has(email)) return email;
    const at = email.lastIndexOf("@");
    if (at !== -1 && blockedDomains.has(email.slice(at))) return email;
  }
  return "";
}

/** Reply-To from a posted field, or from a SendGrid inbound headers blob. */
function incomingReplyTo(direct, headers) {
  const posted = fieldString(direct).trim();
  if (posted) return posted;
  const headerText = fieldString(headers);
  const line = headerText.match(/^reply-to:\s*(.+)$/im);
  return line ? line[1].trim() : "";
}

export async function POST(req) {
  try {
    let from, to, subject, text, html, replyTo, headers;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      ({ from, to, subject, text, html } = body);
      replyTo = body.replyTo || body.reply_to || body["reply-to"];
      headers = body.headers;
    } else {
      const formData = await req.formData();
      from = formData.get("from");
      to = formData.get("to");
      subject = formData.get("subject");
      text = formData.get("text");
      html = formData.get("html");
      replyTo =
        formData.get("replyTo") ||
        formData.get("reply_to") ||
        formData.get("reply-to");
      headers = formData.get("headers");
    }

    if (typeof from !== "string" || from.trim() === "") {
      throw new Error(
        "The 'from' field is required and must be a non-empty string.",
      );
    }
    if (typeof to !== "string" || to.trim() === "") {
      throw new Error(
        "The 'to' field is required and must be a non-empty string.",
      );
    }
    if (typeof subject !== "string" || subject.trim() === "") {
      throw new Error(
        "The 'subject' field is required and must be a non-empty string.",
      );
    }

    const blocked =
      blockedMatch(from) ||
      blockedMatch(replyTo) ||
      blockedMatch(incomingReplyTo("", headers));
    if (blocked) {
      console.info(`Blocked sendgrid forward for ${blocked}`);
      return NextResponse.json(
        { message: "Email received" },
        { status: 200 },
      );
    }

    const msg = {
      to: "info@tu.biz",
      from: "edgar@teams.tu.biz",
      replyTo: from,
      subject: subject,
      custom_args: { teams: "teams.tu.biz" },
      text: `From: ${from}\n\nText: ${text}`,
      html: `<p><strong>From:</strong> ${from}</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <p><strong>Message:</strong></p>
    ${html || text?.replace(/\n/g, "<br>") || ""}`,
    };

    await sgMail.send(msg);

    return NextResponse.json(
      { message: `Email received and sent from ${from} to ${to}` },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
