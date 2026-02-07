// app/tables/create/route.js  (or pages/api/... for Pages Router)

import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET(request) {
  const sql = neon(process.env.DATABASE_URL);

  // Prevent running in production (remove if you know what you're doing)
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Table creation disabled in production" },
      { status: 403 }
    );
  }

  try {
    // Step 1: Create the table (if it doesn't exist)
    // await sql`
    //   CREATE TABLE IF NOT EXISTS "webhook-status" (
    //     teams TEXT,
    //     status TEXT,
    //     email TEXT NOT NULL,
    //     event TEXT NOT NULL,
    //     chicago_time TEXT NOT NULL,
    //     timestamp INTEGER NOT NULL,
    //     smtp_id TEXT,
    //     useragent TEXT,
    //     ip TEXT,
    //     sg_event_id TEXT NOT NULL PRIMARY KEY,  -- Unique per SendGrid event
    //     sg_message_id TEXT NOT NULL,
    //     reason TEXT,
    //     response TEXT,
    //     tls TEXT,
    //     url TEXT,
    //     category TEXT[],
    //     asm_group_id INTEGER,
    //     marketing_campaign_id INTEGER,
    //     marketing_campaign_name TEXT,
    //     attempt INTEGER,
    //     pool TEXT,
    //     sg_machine_open BOOLEAN,
    //     bounce_classification TEXT,
    //     type TEXT
    //   );
    // `;

    // Step 2: Create indexes separately (idempotent with IF NOT EXISTS)
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_status_email ON "webhook-status" (email);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_status_event ON "webhook-status" (event);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_status_timestamp ON "webhook-status" (timestamp);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_status_sg_message_id ON "webhook-status" (sg_message_id);`;

    return NextResponse.json(
      {
        message: "Table 'webhook-status' created (if needed) and indexes added successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database error:", error);

    return NextResponse.json(
      {
        error: "Failed to create table or indexes",
        details: error.message,
        code: error.code || "UNKNOWN",
      },
      { status: 500 }
    );
  }
}