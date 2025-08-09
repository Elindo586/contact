import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function POST(req) {

  console.log("hi");
  try {
    const formData = await req.formData();
    const from = formData.get("from");
    const to = formData.get("to");
    const subject = formData.get("subject");
    const text = formData.get("text");
    const html = formData.get("html");

    if (typeof from !== "string" || from.trim() === "") {
      throw new Error("The 'from' field is required and must be a string.");
    }

    const now = new Date();
    const chicagoTime = now.toLocaleString("en-US", {
      timeZone: "America/Chicago",
      hour12: true,
    });

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

    console.log("✅ Email inserted:", result);
    console.log("hello");

    return NextResponse.json(
      { message: `Email received from ${from} to ${to}` },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

