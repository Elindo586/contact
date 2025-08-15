import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET(request) {
  const sql = neon(process.env.DATABASE_URL);

  try {
    // Corrected SQL statement (removed trailing comma)
    const result = await sql`
      CREATE TABLE webhook (
        teams TEXT,
        email TEXT NOT NULL,
        event TEXT NOT NULL,
        chicago_time TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        smtp_id TEXT,
        useragent TEXT,
        ip TEXT,
        sg_event_id TEXT NOT NULL,
        sg_message_id TEXT NOT NULL,
        reason TEXT,
        status TEXT,
        response TEXT,
        tls TEXT,
        url TEXT,
        category TEXT[], -- Changed to TEXT[] to handle arrays like ["cat facts"]
        asm_group_id INTEGER,
        marketing_campaign_id INTEGER,
        marketing_campaign_name TEXT,
        attempt INTEGER,
        pool TEXT,
        sg_machine_open BOOLEAN,
        bounce_classification TEXT,
        type TEXT
      );
    `;

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}