export async function GET(request, { params }) {
  const userEmail = params.email;

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
