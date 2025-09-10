// import { sql } from "@vercel/postgres";
import { neon } from '@neondatabase/serverless';
import { NextResponse } from "next/server";

export async function GET(request) {
  const sql = neon(`${process.env.DATABASE_URL}`);
  try {
   const result = 
    await sql`SELECT * FROM webhook`;
// await sql `SELECT row_to_json(product)
// FROM product`;
// await sql `SELECT json_agg(row_to_json(product))
// FROM product`;
// await sql`COPY(SELECT json_agg(row_to_json(product))
// FROM product)
// to "/copy.json"`
   

    
    return NextResponse.json({result}, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
