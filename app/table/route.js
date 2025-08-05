import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET(request) {
	const sql = neon(`${process.env.DATABASE_URL}`);

	try {
		const result = await sql`
			CREATE TABLE test1 (
				email varchar(255),
				campId varchar(255),
				date varchar(255)
			
			);
		`;

		return NextResponse.json({ result }, { status: 200 });

	} catch (error) {
		console.error(error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
