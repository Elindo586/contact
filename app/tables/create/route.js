import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET(request) {
	const sql = neon(`${process.env.DATABASE_URL}`);

	try {
		// Corrected SQL statement
		const result = await sql`
      CREATE TABLE IF NOT EXISTS webhook (
        teams varchar(255),
        event varchar(255),
        email varchar(255),
        timestamp varchar(255),
        smtp_id varchar(255),
        useragent varchar(255),
        ip varchar(255),
        sg_event_id varchar(255),
        sg_message_id varchar(255),
        reason varchar(255),
        status varchar(255),
        response varchar(255),
        tls varchar(255),
        url varchar(255),
        category varchar(255),
        asm_group_id varchar(255),
        unique_args varchar(255),
        marketing_campaign_id varchar(255),
        marketing_campaign_name varchar(255),
        attempt varchar(255),
        pool varchar(255),
        sg_machine_open varchar(255),
        bounce_classification varchar(255),
        type varchar(255)
      );
    `;

		return NextResponse.json({ result }, { status: 200 });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
