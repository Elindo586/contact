import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { simpleParser } from "mailparser";  // Import mailparser to handle multipart emails

export async function POST(req) {
  console.log("Request received");

  try {
    // Read the raw body of the request (this should be the entire email raw data)
    const rawBody = await req.text();
    console.log("Raw body received:", rawBody);

    // Use mailparser to parse the raw email content
    const parsedEmail = await simpleParser(rawBody);

    console.log("Parsed email:", parsedEmail);

    // Extract key parts from the parsed email
    const from = parsedEmail.from.text;
    const to = parsedEmail.to.text;
    const subject = parsedEmail.subject;
    const text = parsedEmail.text || "";  // Plain text part of the email
    const html = parsedEmail.html || "";  // HTML part of the email

    // Log any attachments if they exist
    if (parsedEmail.attachments.length > 0) {
      console.log("Attachments:", parsedEmail.attachments);
      // Optionally, save or process attachments here
    }

    // If no content (text or HTML), log and handle the case
    if (!text && !html) {
      console.warn("No email body content found. This may be due to missing text or HTML parts.");
    }

    // Optional fallback: If no text, use HTML as text (convert HTML to plain text)
    if (!text && html) {
      text = stripHtml(html);  // Convert HTML to plain text
      console.log("Fallback to HTML as text:", text);
    }

    // Optional fallback: If no HTML, wrap text in HTML
    if (!html && text) {
      html = `<pre>${text}</pre>`;  // Wrap text content in HTML format
      console.log("Fallback to Text as HTML:", html);
    }

    // Validate mandatory fields (ensure 'from' field is valid)
    if (typeof from !== "string" || from.trim() === "") {
      throw new Error("The 'from' field is required and must be a string.");
    }

    // Get current timestamp (converted to Chicago timezone)
    const now = new Date();
    const chicagoTime = now.toLocaleString("en-US", {
      timeZone: "America/Chicago",
      hour12: true,
    });

    // Insert the parsed email into your database
    const sql = neon(process.env.DATABASE_URL);

    const result = await sql`
      INSERT INTO edgar_teams (
        from_email,
        to_email,
        subject,
        text_body,
        html_body,
        timestamp
      )
      VALUES (
        ${from},
        ${to},
        ${subject},
        ${text},
        ${html},
        ${chicagoTime}
      );
    `;

    console.log("✅ Email inserted into database:", result);

    return NextResponse.json(
      { message: `Email received from ${from} to ${to}` },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error processing the email:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Function to strip HTML tags (for cases where you want to extract plain text from HTML)
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, "").trim();
}
