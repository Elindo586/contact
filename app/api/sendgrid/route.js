import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
