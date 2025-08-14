import crypto from 'crypto';

// Public key from SendGrid webhook settings (stored in environment variables for security)
const SENDGRID_PUBLIC_KEY = process.env.SENDGRID_PUBLIC_KEY;

// Function to verify the SendGrid webhook signature
export function verifySendGridSignature(req) {
  const signature = req.headers['x-twilio-email-event-webhook-signature']; // Signature from the SendGrid webhook request
  const timestamp = req.headers['x-twilio-email-event-webhook-timestamp']; // Timestamp from the SendGrid webhook request

  // Concatenate the timestamp and body of the request to form the message
  const message = `${timestamp}${JSON.stringify(req.body)}`;

  // Verify the signature using the public key
  const isVerified = crypto.verify(
    'sha256',
    Buffer.from(message),
    {
      key: SENDGRID_PUBLIC_KEY,
      format: 'pem',
      type: 'spki',
    },
    Buffer.from(signature, 'base64')
  );

  return isVerified;
}

// POST method handler for the webhook
export async function POST(req, res) {
  if (req.method === 'POST') {
    // Step 1: Verify signature to ensure security
    if (!verifySendGridSignature(req)) {
      return res.status(403).json({ error: 'Invalid webhook signature' });
    }

    // Step 2: Parse the request body
    const eventData = req.body;

    try {
      let successfulInserts = 0;

      for (const event of eventData) {
        const {
          email,
          event: eventType,
          timestamp,
          sg_event_id,
          sg_message_id,
          // other fields...
        } = event;

        if (!email || !eventType || !sg_event_id || !sg_message_id) {
          return res.status(400).json({ error: 'Missing required fields in webhook payload' });
        }

        const chicagoTime = new Date().toISOString();

        // Insert the event data into the database
        const result = await sql`
          INSERT INTO webhook (
            email, event, timestamp, sg_event_id, sg_message_id, chicago_time
          ) VALUES (
            ${email}, ${eventType}, ${timestamp}, ${sg_event_id}, ${sg_message_id}, ${chicagoTime}
          );
        `;

        if (result.rowCount > 0) {
          successfulInserts++;
        } else {
          console.log(`Failed to insert event with sg_event_id: ${sg_event_id}`);
        }
      }

      if (successfulInserts > 0) {
        return res.status(200).json({ message: 'Webhook received and data saved' });
      } else {
        return res.status(500).json({ error: 'No valid events to insert' });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
