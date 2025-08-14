import crypto from "crypto";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const SENDGRID_SECRET = process.env.SENDGRID_SECRET;
const sql = neon(process.env.DATABASE_URL);
console.log(SENDGRID_SECRET);

// Function to verify the SendGrid webhook signature
export function verifySendGridSignature(req) {
	const signature = req.headers.get("x-twilio-email-event-webhook-signature");
	const timestamp = req.headers.get("x-twilio-email-event-webhook-timestamp");

	// console.log(req.headers);
	// console.log('Header Keys:', Object.keys(req.headers));
	// console.log(`signature: ${signature}`);
	// console.log(`timestamp: ${timestamp}`);

	// Concatenate the timestamp and body of the request to form the message
	const message = `${timestamp}${JSON.stringify(req.body)}`;

	// Create an HMAC using SHA256 and the SendGrid secret
	const expectedSignature = crypto
		.createHmac("sha256", SENDGRID_SECRET)
		.update(message)
		.digest("hex");

	// Compare the computed signature with the one sent by SendGrid
	// console.log("Received signature:", signature);
	// console.log("Generated signature:", expectedSignature);
	return signature === expectedSignature;
}

// POST method handler for the webhook
export async function POST(req) {
	if (req.method === "POST") {
		// Step 1: Verify signature to ensure security
		if (!verifySendGridSignature(req)) {
			return NextResponse.json(
				{ error: "Invalid webhook signature" },
				{ status: 403 }
			);
		}

		// Step 2: Parse the request body (Next.js automatically does this)
		const eventData = req.body;
		console.log("we are moving");

		try {
			// Accumulate results for event insertions
			let successfulInserts = 0;

			// SendGrid webhook sends an array of events, so loop through each event
			for (const event of eventData) {
				// Extract relevant fields for each event
				const {
					email,
					event: eventType, // 'event' is a reserved keyword, renamed here
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

				// Ensure necessary fields are present
				if (!email || !eventType || !sg_event_id || !sg_message_id) {
					return NextResponse.json(
						{ error: "Missing required fields in webhook payload" },
						{ status: 400 }
					);
				}

				// Get current Chicago time in ISO format
				const chicagoTime = new Date().toISOString();

				// Insert the event data into the database
				const result = await sql`
          INSERT INTO webhook (
            email,
            event,
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
            chicago_time
          )
          VALUES (
            ${email},
            ${eventType},
            ${timestamp},
            ${smtp_id},
            ${useragent},
            ${ip},
            ${sg_event_id},
            ${sg_message_id},
            ${reason},
            ${status},
            ${response},
            ${tls},
            ${url},
            ${category},
            ${asm_group_id},
            ${marketing_campaign_id},
            ${marketing_campaign_name},
            ${attempt},
            ${pool},
            ${sg_machine_open},
            ${bounce_classification},
            ${type},
            ${chicagoTime}
          );
        `;

				// Increment successful insert count if insertion was successful
				if (result.rowCount > 0) {
					successfulInserts++;
				} else {
					console.log(
						`Failed to insert event with sg_event_id: ${sg_event_id}`
					);
				}
			}

			// If any events were successfully inserted, return a success response
			if (successfulInserts > 0) {
				return NextResponse.json(
					{ message: "Webhook received and data saved" },
					{ status: 200 }
				);
			} else {
				return NextResponse.json(
					{ error: "No valid events to insert" },
					{ status: 500 }
				);
			}
		} catch (err) {
			console.error(err);
			return NextResponse.json({ error: err.message }, { status: 500 });
		}
	} else {
		// Reject non-POST requests
		return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
	}
}
