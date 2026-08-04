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

const blockedEmails = new Set(
  (Array.isArray(blockedEmailsJson)
    ? blockedEmailsJson
    : blockedEmailsJson?.default || []
  )
    .map((email) => extractEmail(email))
    .filter(Boolean),
);

export async function POST(req) {
  try {
    let from, to, subject, text, html;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      ({ from, to, subject, text, html } = body);
    } else {
      const formData = await req.formData();
      from = formData.get("from");
      to = formData.get("to");
      subject = formData.get("subject");
      text = formData.get("text");
      html = formData.get("html");
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

    const fromEmail = extractEmail(from);
    if (blockedEmails.has(fromEmail)) {
      console.info(`Blocked sendgrid forward for ${fromEmail}`);
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
