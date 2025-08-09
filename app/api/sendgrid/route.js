import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { simpleParser } from "mailparser";  // Import mailparser to handle multipart

export async function POST(req) {
  console.log("Request received");

  try {
    // Read the raw body of the request (this should be the entire email raw data)
    const rawBody = await req.text();
    console.log("Raw body received:", rawBody);

    // Use mailparser to parse the raw email
    const parsedEmail = await simpleParser(rawBody);

    console.log("Parsed email:", parsedEmail);

    // Extract parts from the parsed email
    const from = parsedEmail.from.text;
    const to = parsedEmail.to.text;
    const subject = parsedEmail.subject;
    const text = parsedEmail.text || "";  // Text part of the email (plain text)
    const html = parsedEmail.html || "";  // HTML part of the email

    // If no text or HTML part, log and handle the case
    if (!text && !html) {
      console.warn("No email body content found. This may be due to missing text or HTML parts.");
    }

    // Optional fallback if one is missing
    if (!text && html) {
      text = stripHtml(html);  // Convert HTML to plain text if no plain-text body exists
      console.log("Fallback to HTML as text:", text);
    }

    if (!html && text) {
      html = `<pre>${text}</pre>`;  // Wrap text content in HTML format (optional)
      console.log("Fallback to Text as HTML:", html);
    }

    // Validate mandatory fields
    if (typeof from !== "string" || from.trim() === "") {
      throw new Error("The 'from' field is required and must be a string.");
    }

    // Get current timestamp (converted to Chicago timezone)
    const now = new Date();
    const chicagoTime = now.toLocaleString("en-US", {
      timeZone: "America/Chicago",
      hour12: true,
    });

    // Insert into your database using Neon SQL
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
