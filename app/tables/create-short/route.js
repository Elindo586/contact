import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET(request) {
  const sql = neon(process.env.DATABASE_URL);

  try {
    // Corrected SQL statement (removed trailing comma)
    const result = await sql`
      CREATE TABLE team05 (
        from_email TEXT,
        to_email TEXT,
        subject varchar(255),
        text_body TEXT,
        html_body TEXT,
        timestamp varchar(255)
      );
    `;

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}