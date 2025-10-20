import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET(request) {
    
    gclid = request.body.gclid;
    linkId = request.body.linkid;
    ip = request.body.ip;


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
   

    try {
        // Insert into the database
        const result = await sql`
            INSERT INTO gclids (gclid, linkId, Ip, date)
            VALUES (${gclid}, ${linkId}, ${ip}, ${chicagoTime})
            RETURNING *;
        `;
        console.log("Data inserted successfully:", result);

        // Redirect to products page
        
      return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}