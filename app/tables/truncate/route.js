import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET(request) {
  const sql = neon(`${process.env.DATABASE_URL}`);
  try {
    const result = await sql`TRUNCATE TABLE webhook;`;
    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}