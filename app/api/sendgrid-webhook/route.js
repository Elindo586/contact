'use strict';

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

    const rawBody = await req.text();

    const now = Math.floor(Date.now() / 1000);
    const ts = Number(timestampHeader);

    if (Math.abs(now - ts) > 300) {
      return NextResponse.json(
        { error: 'Timestamp expired' },
        { status: 403 }
      );
    }

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

    return NextResponse.json({
      message: 'Webhook accepted (Neon tracking suspended)',
      tracking: false,
      eventCount: events.length,
      successfulInserts: 0,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
