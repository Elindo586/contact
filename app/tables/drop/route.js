import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // Initialize the Neon client using DATABASE_URL
    const sql = neon(process.env.DATABASE_URL);

    // Execute the DROP TABLE query
    const result = await sql`DROP TABLE IF EXISTS webhook;`;

    // Send a response confirming the table was dropped
    return NextResponse.json({ message: "Table dropped successfully", result }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
