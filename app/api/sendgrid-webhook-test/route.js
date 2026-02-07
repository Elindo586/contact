'use strict';
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import { Ecdsa, Signature, PublicKey } from 'starkbank-ecdsa';class EventWebhook {
  convertPublicKeyToECDSA(publicKey) {
    return PublicKey.fromPem(publicKey);
  }  verifySignature(publicKey, payload, signature, timestamp) {
    const signedPayload = timestamp + payload;
    console.log('Signature Verification Payload:', signedPayload);
    console.log('Signature:', signature);
    console.log('Timestamp:', timestamp);
    console.log('Payload Length:', payload.length);
    console.log('Payload:', payload);try {
  const decodedSignature = Signature.fromBase64(signature);
  console.log('Decoded Signature:', decodedSignature.toString());
  return Ecdsa.verify(signedPayload, decodedSignature, publicKey);
} catch (err) {
  console.error('ECDSA Verification Error:', err);
  return false;
}  }
}class EventWebhookHeader {
  static SIGNATURE() {
    return 'X-Twilio-Email-Event-Webhook-Signature';
  }  static TIMESTAMP() {
    return 'X-Twilio-Email-Event-Webhook-Timestamp';
  }
}const SENDGRID_SECRET = process.env.SENDGRID_SECRET.replace(/\n/g, '\n');
const sql = neon(process.env.DATABASE_URL);export const config = {
  api: {
    bodyParser: false,
  },
};export async function POST(req) {
  try {
    if (req.method !== 'POST') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }const signature = req.headers.get(EventWebhookHeader.SIGNATURE());
const timestamp = req.headers.get(EventWebhookHeader.TIMESTAMP());

if (!signature || !timestamp) {
  console.log('Missing signature or timestamp');
  return NextResponse.json({ error: 'Missing signature or timestamp' }, { status: 400 });
}

const rawBody = await req.text();
console.log('Raw Body Length:', rawBody.length);
console.log('Raw Body:', rawBody);

// Verify timestamp window (5 minutes)
const currentTime = Math.floor(Date.now() / 1000);
if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
  console.log('Timestamp outside 5-minute window:', timestamp);
  return NextResponse.json({ error: 'Timestamp too old or in future' }, { status: 403 });
}

const eventWebhook = new EventWebhook();
const publicKey = eventWebhook.convertPublicKeyToECDSA(SENDGRID_SECRET);
const isValidSignature = eventWebhook.verifySignature(publicKey, rawBody, signature, timestamp);

if (!isValidSignature) {
  console.log('Signature verification failed.');
  return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 403 });
}

let eventData;
try {
  eventData = JSON.parse(rawBody);
  console.log('Parsed eventData:', JSON.stringify(eventData, null, 2));
} catch (err) {
  console.error('Failed to parse JSON:', err);
  return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
}

if (!Array.isArray(eventData) || eventData.length === 0) {
  console.log('No events to process');
  return NextResponse.json({ message: 'No events to process', eventCount: 0 }, { status: 200 });
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
    // Custom args from your email send
    estatus, // <-- This is your custom_arg: estatus ("valid" or other)
  } = event;

  if (!email || !eventType || !sg_event_id || !sg_message_id) {
    console.log(`Missing required fields in event with sg_event_id: ${sg_event_id || 'undefined'}`);
    errors.push(`Missing required fields`);
    continue;
  }

  if (!teams || teams !== 'teams.tu.biz') {
    console.log(`Skipping event due to invalid teams value`);
    errors.push(`Invalid teams value`);
    continue;
  }

  const categoryValue = Array.isArray(category) ? category : (category ? [category] : null);
  const now = new Date();
  const chicagoTime = now.toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    hour12: true,
  });

  // Decide which table to insert into based on your custom estatus
  const isValid = estatus === 'valid';
  const targetTable = isValid ? 'webhook' : 'webhook-status';
  console.log(`Inserting into table: ${targetTable} (estatus: ${estatus || 'missing'})`);

  try {
    let result;
    if (isValid) {
      // For 'webhook' table (no status column)
      result = await sql`
        INSERT INTO "${targetTable}" (
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
        ON CONFLICT (sg_event_id) DO NOTHING
        RETURNING sg_event_id
      `;
    } else {
      // For 'webhook-status' table (includes status column)
      result = await sql`
        INSERT INTO "${targetTable}" (
          teams,
          email,
          status,           -- Your custom estatus goes here
          event,
          chicago_time,
          timestamp,
          smtp_id,
          useragent,
          ip,
          sg_event_id,
          sg_message_id,
          reason,
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
          ${estatus || null},     -- Save your custom estatus in the 'status' column
          ${eventType},
          ${chicagoTime},
          ${timestamp},
          ${smtp_id || null},
          ${useragent || null},
          ${ip || null},
          ${sg_event_id},
          ${sg_message_id},
          ${reason || null},
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
        ON CONFLICT (sg_event_id) DO NOTHING
        RETURNING sg_event_id
      `;
    }

    if (result.length > 0 || result.rowCount > 0) {
      console.log(`Successfully inserted into ${targetTable}: ${sg_event_id}`);
      successfulInserts++;
    } else {
      console.log(`No insert (likely duplicate): ${sg_event_id}`);
    }
  } catch (err) {
    console.error(`Database error for sg_event_id: ${sg_event_id}`, err);
    if (err.code === '23505') {
      errors.push(`Duplicate sg_event_id: ${sg_event_id}`);
    } else {
      errors.push(`DB error: ${err.message}`);
    }
  }
}

return NextResponse.json(
  {
    message: 'Webhook processed successfully',
    successfulInserts,
    eventCount: eventData.length,
    errors: errors.length > 0 ? errors : undefined,
  },
  { status: 200 }
);  } catch (err) {
    console.error('General error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}



