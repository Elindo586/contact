import { neon } from "@neondatabase/serverless";
import { IncomingForm } from "formidable";
import { NextResponse } from "next/server";

console.log("testing");

// Helper to parse multipart/form-data using formidable with a Promise
const parseForm = async (req) =>
	new Promise((resolve, reject) => {
		const form = new IncomingForm();

		form.parse(req, (err, fields, files) => {
			if (err) return reject(err);
			resolve(fields);
		});
	});

export async function POST(req) {
	try {
		const formData = await req.formData();
		const from = formData.get("from");
		const to = formData.get("to");
		const subject = formData.get("subject");
		const text = formData.get("text");
		const html = formData.get("html");

		

// 		if (typeof from !== "string" || from.trim() === "")
// 			throw new Error("from field was invalid"); // something like that // Format timestamp to Chicago time

// 		const now = new Date();
// 		const chicagoTime = now.toLocaleString("en-US", {
// 			timeZone: "America/Chicago",
// 			hour12: true,
// 		}); // Connect to Neon/Postgres

// 		const sql = neon(process.env.DATABASE_URL); // Insert parsed email into your table

// 		const result = await sql`INSERT INTO edgar_teams (
//         from_email,
//         to_email,
//         subject,
//         text_body,
//         html_body,
//         timestamp
//       )
//      
//       VALUES (
//         ${from},
//         ${to},
//         ${subject},
//         ${text},
//         ${html},
//         ${chicagoTime}
//       );`;
// 		console.log("✅ Email inserted:", result);

		return NextResponse.json({ message: `Email received ${to}` }, { status: 200 });
	} catch (error) {
		console.error("❌ Error:", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
