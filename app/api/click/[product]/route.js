// import { sql } from "@vercel/postgres";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
	const { product } = await params;

	const sql = neon(`${process.env.DATABASE_URL}`);

const d = new Date();
    const chicagoTime = d.toLocaleString("en-US", {
        timeZone: "America/Chicago",
        hour12: true, // Enable 12-hour format with AM/PM
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

	// Debug: Log parameters to check if data is correct
	console.log("Inserting data into database:", {
		product,
		chicagoTime,
	});

	try {
		// Insert into the database
		const result = await sql`
      INSERT INTO links (product, date)
      VALUES (${product}, ${chicagoTime});
    `;
		console.log("Data inserted successfully:", result);
	} catch (error) {
		console.error("Error inserting data:", error);
		return NextResponse.error(); // Optional: Return error response if insertion fails
	}

	// Define the redirect URL based on the product
	const redirectUrl = new URL("https://tu.biz", request.url);

	// the link is:
	// https://email.tu.biz/my/email-follow/g/g/g

	switch (product) {
		case "tubiz":
			redirectUrl.href = "https://www.tu.biz"
			break;
        case "emerald-controller":
        case "emerald-drive":
        case "luminary-controller":
        case "luminary-drive":
        case "brushless-motors":
        case "toshiba-motors":
			redirectUrl.href =
				"https://www.tu.biz/contact-us?utm_source=technical-union-tubiz&utm_medium=referral";
			break;

		default:
			// Handle unknown products with a default redirect
			redirectUrl.href = "https://www.tu.biz";
			break;
	}

	return NextResponse.redirect(redirectUrl);
}
