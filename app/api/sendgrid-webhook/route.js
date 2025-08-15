import crypto from "crypto";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const SENDGRID_SECRET = process.env.SENDGRID_SECRET;
const sql = neon(process.env.DATABASE_URL);

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  try {
    if (req.method !== "POST") {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    }

    const signature = req.headers.get("x-twilio-email-event-webhook-signature");
    const timestamp = req.headers.get("x-twilio-email-event-webhook-timestamp");

    let rawBody;
    try {
      rawBody = await req.text();
    } catch (err) {
      console.error("Failed to read request body:", err);
      return NextResponse.json({ error: "Failed to read request body" }, { status: 400 });
    }

    const normalizedBody = rawBody.trim();
    const message = `${timestamp}${normalizedBody}`;

    let isValidSignature;
    try {
      const verifier = crypto.createVerify("sha256");
      verifier.update(message);
      isValidSignature = verifier.verify(SENDGRID_SECRET, signature, "base64");
    } catch (err) {
      console.error("Error during ECDSA verification:", err);
      return NextResponse.json({ error: "Error verifying signature" }, { status: 403 });
    }

    if (!isValidSignature) {
      console.log("Signature verification failed.");
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 403 });
    }

    let eventData;
    try {
      eventData = JSON.parse(normalizedBody);
      console.log("Parsed eventData:", JSON.stringify(eventData, null, 2));
    } catch (err) {
      console.error("Failed to parse JSON:", err);
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    if (!Array.isArray(eventData) || eventData.length === 0) {
      console.log("No events to process");
      return NextResponse.json({ message: "No events to process", eventCount: 0 }, { status: 200 });
    }

    let successfulInserts = 0;
    let errors = [];
    for (const event of eventData) {
      const {
        teams,
        email,
        event: eventType,
        timestamp,
        smtp_id,
        useragent,
        ip,
        sg_event_id,
        sg_message_id,
        reason,
        status,
        response,
        tls,
        url,
        category,
        asm_group_id,
        marketing_campaign_id,
        marketing_campaign_name,
        attempt,
        pool,
        sg_machine_open,
        bounce_classification,
        type,
      } = event;

      if (!email || !eventType || !sg_event_id || !sg_message_id) {
        console.log(`Missing required fields in event with sg_event_id: ${sg_event_id || 'undefined'}`);
        errors.push(`Missing required fields in event with sg_event_id: ${sg_event_id || 'undefined'}`);
        continue;
      }

      // Log teams if present
      if (teams) {
        console.log(`Teams value for sg_event_id: ${sg_event_id}: ${teams}`);
      }

      // Only insert data if teams field is present and equals "teams.tu.biz"
      if (!teams || teams !== "teams.tu.biz") {
        console.log(`Skipping event with sg_event_id: ${sg_event_id} due to missing or invalid teams value`);
        errors.push(`Skipping event with sg_event_id: ${sg_event_id} due to missing or invalid teams value`);
        continue;
      }

      const categoryValue = Array.isArray(category) ? category : [category] || null;
      const now = new Date();
      const chicagoTime = now.toLocaleString("en-US", {
        timeZone: "America/Chicago",
        hour12: true,
      });

      try {
        const result = await sql`
          INSERT INTO webhook (
            teams,
            email,
            event,
            chicago_time,
            timestamp,
            smtp_id,
            useragent,
            ip,
            sg_event_id,
            sg_message_id,
            reason,
            status,
            response,
            tls,
            url,
            category,
            asm_group_id,
            marketing_campaign_id,
            marketing_campaign_name,
            attempt,
            pool,
            sg_machine_open,
            bounce_classification,
            type
          )
          VALUES (
            ${teams},
            ${email},
            ${eventType},
            ${chicagoTime},
            ${timestamp},
            ${smtp_id || null},
            ${useragent || null},
            ${ip || null},
            ${sg_event_id},
            ${sg_message_id},
            ${reason || null},
            ${status || null},
            ${response || null},
            ${tls || null},
            ${url || null},
            ${categoryValue},
            ${asm_group_id || null},
            ${marketing_campaign_id || null},
            ${marketing_campaign_name || null},
            ${attempt || null},
            ${pool || null},
            ${sg_machine_open || null},
            ${bounce_classification || null},
            ${type || null}
          )
          RETURNING sg_event_id
        `;
        console.log("Query result:", JSON.stringify(result, null, 2));
        const rowCount = Array.isArray(result) && result.length > 0 ? result.length : (result && result.rowCount) || 0;
        if (rowCount > 0) {
          console.log(`Successfully inserted event with sg_event_id: ${sg_event_id}`);
          successfulInserts++;
        } else {
          console.log(`No rows affected for sg_event_id: ${sg_event_id}`);
          errors.push(`No rows affected for sg_event_id: ${sg_event_id}`);
        }
      } catch (err) {
        console.error(`Database error for sg_event_id: ${sg_event_id}`, err);
        if (err.code === '23505') {
          errors.push(`Duplicate sg_event_id: ${sg_event_id}`);
        } else {
          errors.push(`Database error for sg_event_id: ${sg_event_id}: ${err.message}`);
        }
      }
    }

    // Verify inserts by querying the database hello!
    if (successfulInserts > 0) {
      try {
        const insertedIds = eventData
          .filter(e => e.teams && e.teams === "teams.tu.biz")
          .map(e => e.sg_event_id)
          .filter(id => id);
        if (insertedIds.length > 0) {
          const verification = await sql`SELECT sg_event_id FROM webhook WHERE sg_event_id = ANY(${insertedIds})`;
          console.log("Verification query result:", JSON.stringify(verification, null, 2));
        }
      } catch (err) {
        console.error("Verification query error:", err);
      }
    }

    if (successfulInserts > 0) {
      return NextResponse.json(
        {
          message: "Webhook received and data processed",
          successfulInserts,
          eventCount: eventData.length,
          errors: errors.length > 0 ? errors : undefined,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          error: "Failed to process events",
          successfulInserts,
          eventCount: eventData.length,
          errors: errors.length > 0 ? errors : undefined,
        },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("General error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}