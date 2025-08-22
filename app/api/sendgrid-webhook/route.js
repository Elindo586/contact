'use strict';

import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import { Ecdsa, Signature, PublicKey } from 'starkbank-ecdsa';

class EventWebhook {
  convertPublicKeyToECDSA(publicKey) {
    return PublicKey.fromPem(publicKey);
  }

  verifySignature(publicKey, payload, signature, timestamp) {
    const signedPayload = timestamp + payload;
    console.log('Signature Verification Payload:', signedPayload);
    console.log('Signature:', signature);
    console.log('Timestamp:', timestamp);
    console.log('Payload Length:', payload.length);
    console.log('Payload:', payload);
    
    try {
      const decodedSignature = Signature.fromBase64(signature);
      console.log('Decoded Signature:', decodedSignature.toString());
      return Ecdsa.verify(signedPayload, decodedSignature, publicKey);
    } catch (err) {
      console.error('ECDSA Verification Error:', err);
      return false;
    }
  }
}

class EventWebhookHeader {
  static SIGNATURE() {
    return 'X-Twilio-Email-Event-Webhook-Signature';
  }

  static TIMESTAMP() {
    return 'X-Twilio-Email-Event-Webhook-Timestamp';
  }
}

const SENDGRID_SECRET = process.env.SENDGRID_SECRET.replace(/\\n/g, '\n');
const sql = neon(process.env.DATABASE_URL);

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  try {
    if (req.method !== 'POST') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const signature = req.headers.get(EventWebhookHeader.SIGNATURE());
    const timestamp = req.headers.get(EventWebhookHeader.TIMESTAMP());

    if (!signature || !timestamp) {
      console.log('Missing signature or timestamp');
      return NextResponse.json({ error: 'Missing signature or timestamp' }, { status: 400 });
    }

    const rawBody = await req.text();
    console.log('Raw Body Length:', rawBody.length);
    console.log('Raw Body:', rawBody);
    console.log('SENDGRID_SECRET (first 50 chars):', SENDGRID_SECRET.substring(0, 50));
    console.log('Content-Type:', req.headers.get('content-type'));

    // Verify timestamp window
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
      console.log('Timestamp outside 5-minute window:', timestamp);
      console.log('Server Time (Unix):', currentTime);
      return NextResponse.json({ error: 'Timestamp too old or in future' }, { status: 403 });
    }

    const eventWebhook = new EventWebhook();
    const publicKey = eventWebhook.convertPublicKeyToECDSA(SENDGRID_SECRET);
    const isValidSignature = eventWebhook.verifySignature(publicKey, rawBody, signature, timestamp);
    console.log('Signature Valid:', isValidSignature);

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

      if (!teams || teams !== 'teams.tu.biz') {
        console.log(`Skipping event with sg_event_id: ${sg_event_id} due to missing or invalid teams value`);
        errors.push(`Skipping event with sg_event_id: ${sg_event_id} due to missing or invalid teams value`);
        continue;
      }

      const categoryValue = Array.isArray(category) ? category : [category] || null;
      const now = new Date();
      const chicagoTime = now.toLocaleString('en-US', {
        timeZone: 'America/Chicago',
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
        console.log('Query result:', JSON.stringify(result, null, 2));
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

    if (successfulInserts > 0) {
      try {
        const insertedIds = eventData
          .filter(e => e.teams && e.teams === 'teams.tu.biz')
          .map(e => e.sg_event_id)
          .filter(id => id);
        if (insertedIds.length > 0) {
          const verification = await sql`SELECT sg_event_id FROM webhook WHERE sg_event_id = ANY(${insertedIds})`;
          console.log('Verification query result:', JSON.stringify(verification, null, 2));
        }
      } catch (err) {
        console.error('Verification query error:', err);
      }
    }

    return NextResponse.json(
      {
        message: 'Webhook received and data processed',
        successfulInserts,
        eventCount: eventData.length,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('General error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}