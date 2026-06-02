import { NextResponse } from "next/server";
import { getTrackingSql } from "../../../../lib/neon-tracking.js";

export async function GET(request, { params }) {
	const { product } = await params;

	const sql = getTrackingSql();

	if (sql) {
		const d = new Date();
		const chicagoTime = d.toLocaleString("en-US", {
			timeZone: "America/Chicago",
			hour12: true,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});

		try {
			await sql`
        INSERT INTO links (product, date)
        VALUES (${product}, ${chicagoTime});
      `;
		} catch (error) {
			console.error("Error inserting click tracking:", error);
		}
	}

	const redirectUrl = new URL("https://tu.biz", request.url);

	switch (product) {
		case "tubiz":
			redirectUrl.href = "https://www.tu.biz";
			break;
		case "emerald-controller":
		case "emerald-drive":
		case "luminary-controller":
		case "luminary-drive":
		case "brushless-motors":
		case "toshiba-motors":
			redirectUrl.href =
				"https://www.iis-servo.com/contact-us?utm_source=technical-union-tubiz&utm_medium=referral";
			break;
		default:
			redirectUrl.href = "https://www.tu.biz";
			break;
	}

	return NextResponse.redirect(redirectUrl);
}
