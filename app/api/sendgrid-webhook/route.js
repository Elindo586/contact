// API route to catch the SendGrid webhook
export default async function handler(req, res) {
  if (req.method === "POST") {
    // Step 1: Verify signature to ensure security
    if (!verifySendGridSignature(req)) {
      return res.status(403).json({ error: "Invalid webhook signature" });
    }

    // Step 2: Parse the request body (Next.js automatically does this)
    const eventData = req.body;

    try {
      // Accumulate results for event insertions
      let successfulInserts = 0;

      // SendGrid webhook sends an array of events, so loop through each event
      for (const event of eventData) {
        // Extract relevant fields for each event
        const {
          teams,
          email,
          event: eventType, // 'event' is a reserved keyword, renamed here
          timestamp,
          sg_event_id,
          sg_message_id,
          reason,
          status,
          response,
          useragent,
          ip,
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
          return res
            .status(400)
            .json({ error: "Missing required fields in webhook payload" });
        }

        // Get current Chicago time in ISO format
        const chicagoTime = new Date().toISOString();

        // Just insert the event, no team condition
        const result = await sql`
          INSERT INTO webhook (
            teams,
            email,
            event,
            timestamp,
            sg_event_id,
            sg_message_id,
            reason,
            status,
            response,
            useragent,
            ip,
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
            ${teams},
            ${email},
            ${eventType},
            ${timestamp},
            ${sg_event_id},
            ${sg_message_id},
            ${reason},
            ${status},
            ${response},
            ${useragent},
            ${ip},
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
          console.log(`Failed to insert event with sg_event_id: ${sg_event_id}`);
        }
      }

      // If any events were successfully inserted, return a success response
      if (successfulInserts > 0) {
        return res.status(200).json({ message: "Webhook received and data saved" });
      } else {
        return res.status(500).json({ error: "No valid events to insert" });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    // Reject non-POST requests
    return res.status(405).json({ error: "Method not allowed" });
  }
}
