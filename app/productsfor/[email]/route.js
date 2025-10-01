import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
    const { email } = await params;

    // Validate email parameter
    if (!email || typeof email !== "string") {
        return NextResponse.json({ error: "Invalid email parameter" }, { status: 400 });
    }

    // Initialize database connection
    const sql = neon(`${process.env.DATABASE_URL}`);
    console.log("Connecting to database with URL:", process.env.DATABASE_URL);

    // Get Chicago time in 12-hour format with AM/PM
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

    console.log("Chicago time:", chicagoTime); // e.g., "09/25/2025, 01:15:00 PM"
    console.log("Inserting data into database:", { email, chicagoTime });

    try {
        // Insert into the database
        const result = await sql`
            INSERT INTO productsfor (email, date)
            VALUES (${email}, ${chicagoTime})
            RETURNING *;
        `;
        console.log("Data inserted successfully:", result);

        // Redirect to products page
        const redirectUrl = new URL("https://tu.biz/products", request.url);
        console.log("Redirecting to:", redirectUrl.toString());
        return NextResponse.redirect(redirectUrl);
    } catch (error) {
        console.error("Error inserting data:", error);
        return NextResponse.json({ error: "Failed to insert data" }, { status: 500 });
    }
}