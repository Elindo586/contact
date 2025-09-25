import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
    const { email: userEmail } = params;

    // Validate email parameter
    if (!userEmail || typeof userEmail !== "string") {
        return NextResponse.json({ error: "Invalid email parameter" }, { status: 400 });
    }

    // Initialize database connection
    const sql = neon(`${process.env.DATABASE_URL}`);
    console.log("Connecting to database with URL:", process.env.DATABASE_URL);

    // Get Chicago time in a database-friendly format
    const d = new Date();
    const chicagoTime = d
        .toLocaleString("en-US", {
            timeZone: "America/Chicago",
            hour12: false,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        })
        .replace(/(\d+)\/(\d+)\/(\d+),/, "$3-$1-$2"); // Convert to YYYY-MM-DD HH:MM:SS

    console.log("Chicago time:", chicagoTime);
    console.log("Inserting data into database:", { userEmail, chicagoTime });

    try {
        // Insert into the database
        const result = await sql`
            INSERT INTO productsfor (email, date)
            VALUES (${userEmail}, ${chicagoTime})
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