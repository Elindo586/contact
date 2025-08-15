import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // Initialize Neon client with the connection URL
    const sql = neon(process.env.DATABASE_URL);

    // Drop the 'teams' column from the 'webhook' table
    const result = await sql`
      ALTER TABLE webhook
      ALTER COLUMN category TYPE TEXT[] USING ARRAY[category];
    `;

    return NextResponse.json({ message: "It has been changed.", result }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
