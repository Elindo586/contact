'use strict';

import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import { Ecdsa, Signature, PublicKey } from 'starkbank-ecdsa';

/*
  App Router notes:
  - NO export const config
  - raw body = await req.text()
  - optional: force node runtime
*/
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SENDGRID_SECRET = process.env.SENDGRID_SECRET?.replace(/\\n/g, '\n');
const sql = neon(process.env.DATABASE_URL);

if (!SENDGRID_SECRET) {
  throw new Error('Missing SENDGRID_SECRET env variable');
}

/* ----------------------------- Helpers ----------------------------- */

function verifySignature(publicKeyPem, payload, signature, timestamp) {
  try {
    const publicKey = PublicKey.fromPem(publicKeyPem);
    const decoded = Signature.fromBase64(signature);

    return Ecdsa.verify(timestamp + payload, decoded, publicKey);
  } catch (err) {
    console.error('Signature verification failed:', err);
    return false;
  }
}

const HEADERS = {
  SIGNATURE: 'x-twilio-email-event-webhook-signature',
  TIMESTAMP: 'x-twilio-email-event-webhook-timestamp',
};

/* ------------------------------ Route ------------------------------ */

export async function POST(req) {
  try {
    const signature = req.headers.get(HEADERS.SIGNATURE);
    const timestampHeader = req.headers.get(HEADERS.TIMESTAMP);

    if (!signature || !timestampHeader) {
      return NextResponse.json(
        { error: 'Missing signature or timestamp' },
        { status: 400 }
      );
    }

    /* raw body required for SendGrid verification */
    const rawBody = await req.text();

    /* ---- timestamp validation (5 min window) ---- */
    const now = Math.floor(Date.now() / 1000);
    const ts = Number(timestampHeader);

    if (Math.abs(now - ts) > 300) {
      return NextResponse.json(
        { error: 'Timestamp expired' },
        { status: 403 }
      );
    }

    /* ---- signature verification ---- */
    const isValid = verifySignature(
      SENDGRID_SECRET,
      rawBody,
      signature,
      timestampHeader
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 403 }
      );
    }

    /* ---- parse JSON AFTER verification ---- */
    let events;
    try {
      events = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { message: 'No events to process', eventCount: 0 },
        { status: 200 }
      );
    }

    /* ---------------- DB insert ---------------- */

    let successfulInserts = 0;
    const errors = [];

    for (const e of events) {
      const {
        teams,
        email,
        event: eventType,
        timestamp: eventTimestamp, // avoid shadowing
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
      } = e;

      /* required fields */
      if (!email || !eventType || !sg_event_id || !sg_message_id) {
        errors.push(`Missing fields for ${sg_event_id}`);
        continue;
      }

      /* your business filter */
      if (teams !== 'teams.tu.biz') continue;

      const chicagoTime = new Date().toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        hour12: true,
      });

      try {
        await sql`
          INSERT INTO webhook (
            teams,email,event,chicago_time,timestamp,smtp_id,useragent,ip,
            sg_event_id,sg_message_id,reason,status,response,tls,url,category,
            asm_group_id,marketing_campaign_id,marketing_campaign_name,
            attempt,pool,sg_machine_open,bounce_classification,type
          )
          VALUES (
            ${teams},
            ${email},
            ${eventType},
            ${chicagoTime},
            ${eventTimestamp},
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
            ${Array.isArray(category) ? category : category ? [category] : null},
            ${asm_group_id || null},
            ${marketing_campaign_id || null},
            ${marketing_campaign_name || null},
            ${attempt || null},
            ${pool || null},
            ${sg_machine_open || null},
            ${bounce_classification || null},
            ${type || null}
          )
        `;

        successfulInserts++;
      } catch (err) {
        if (err.code === '23505') continue; // duplicate safe
        errors.push(err.message);
      }
    }

    return NextResponse.json({
      message: 'Webhook processed',
      successfulInserts,
      eventCount: events.length,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
