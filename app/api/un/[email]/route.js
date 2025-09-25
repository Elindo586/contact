// import { sql } from "@vercel/postgres";
import { neon } from "@neondatabase/serverless";

export async function GET(request, { params }) {


  const userEmail = params.email;
  

  const sql = neon(`${process.env.DATABASE_URL}`);

  const d = new Date();
  const month = d.getMonth() + 1;
  const days = d.getDate();
  const year = d.getFullYear();
  const hour = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();

  const date = ` ${year}/${month}/${days} at ${hour}:${minutes}:${seconds}s`;

  await sql`INSERT INTO unsub (email, date) VALUES ( ${userEmail}, ${date});`;

  const htmlResponse = `
      <html>
        <body style = "color: blue">
          <div>
            <div> <h1> Hello, </h1> </div>
            <div> Your email: ${userEmail} has been unsubscribed. </div>
          </div>
        </body>
      </html>
    `;

  return new Response(htmlResponse, {
    headers: { "Content-Type": "text/html" },
  });
}