import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

// Set SendGrid API key once at module level
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(req) {
	try {
		let from, to, subject, text, html;
		const contentType = req.headers.get("content-type") || "";

		if (contentType.includes("application/json")) {
			const body = await req.json();
			({ from, to, subject, text, html } = body);
		} else {
			const formData = await req.formData();
			from = formData.get("from");
			to = formData.get("to");
			subject = formData.get("subject");
			text = formData.get("text");
			html = formData.get("html");
		}
		console.log (from);

		// Validate input fields
		if (typeof from !== "string" || from.trim() === "") {
			throw new Error(
				"The 'from' field is required and must be a non-empty string.",
			);
		}
		if (typeof to !== "string" || to.trim() === "") {
			throw new Error(
				"The 'to' field is required and must be a non-empty string.",
			);
		}
		if (typeof subject !== "string" || subject.trim() === "") {
			throw new Error(
				"The 'subject' field is required and must be a non-empty string.",
			);
		}

		const now = new Date();
		const chicagoTime = now.toLocaleString("en-US", {
			timeZone: "America/Chicago",
			hour12: true,
		});

		const sql = neon(process.env.DATABASE_URL);

		// Insert email data into database
		try {
			await sql`
    INSERT INTO edgar_teams (from_email, to_email, subject, text_body, html_body, timestamp)
    VALUES (${from}, ${to}, ${subject}, ${text}, ${html}, ${chicagoTime});
  `;
			console.log("DB insert successful");
		} catch (dbErr) {
			console.error("DB insert failed:", dbErr);
		}

		// Configure email message
		const msg = {
			to: "info@tu.biz", // Set to specified recipient
			from: "edgar@teams.tu.biz", // Verified sender
			replyTo: from,
			subject: subject,
			custom_args: { teams: "teams.tu.biz" }, // Kept as custom_args
			text: `From: ${from}\n\nText: ${text}`, // Include from, text, and html
			html: `From: ${from} \n\n ${html}`,
		};

		// Send email
		await sgMail.send(msg);
		console.log("Email sent successfully");

		return NextResponse.json(
			{ message: `Email received and sent from ${from} to ${to}` },
			{ status: 200 },
		);
	} catch (error) {
		console.error("❌ Error:", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
