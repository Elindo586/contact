import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
	const { email: userEmail } = params;

	const sql = neon(`${process.env.DATABASE_URL}`);

	const d = new Date();

	// Chicago is UTC-6 or UTC-5 (depending on daylight saving)
	const chicagoTime = d.toLocaleString("en-US", {
		timeZone: "America/Chicago",
		hour12: true,
	});

	console.log(chicagoTime);

	// Debug: Log parameters to check if data is correct
	console.log("Inserting data into database:", {
		userEmail,
		date,
	});

	try {
		// Insert into the database
		const result = await sql`
      INSERT INTO productsfor ( email, date)
      VALUES (${userEmail}, ${date});
    `;
		console.log("Data inserted successfully:", result);
	} catch (error) {
		console.error("Error inserting data:", error);
		return NextResponse.error(); // Optional: Return error response if insertion fails
	}

	// Define the redirect URL based on the product
	const redirectUrl = new URL("https://tu.biz/products", request.url);

	return NextResponse.redirect(redirectUrl);
}
