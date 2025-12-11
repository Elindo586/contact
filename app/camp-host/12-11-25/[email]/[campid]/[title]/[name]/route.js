// import { sql } from "@vercel/postgres";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET(_, { params }) {

  const sql = neon(`${process.env.DATABASE_URL}`);
  const email = params.email;
  const campId = params.campid;
  const title = params.title;
  const name = params.name;

  const d = new Date();
  const month = d.getMonth() + 1;
  const days = d.getDate();
  const year = d.getFullYear();
  const hour = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();

  const date = ` ${year}/${month}/${days} at ${hour}:${minutes}:${seconds}s`;

  await sql`INSERT INTO host1 (email, campId, date) VALUES ( ${email}, ${campId}, ${date});`;

  const htmlResponse = `<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>Email</title>
		<style>
			/* General Styles */
			@media only screen and (max-width: 1000px) {
				.container {
					width: 100% !important;
					padding: 0 !important;
				}
				.container2 {
					width: 100% !important;
				}
				.social-icons img {
					width: 24px !important;
					height: 24px !important;
				}
			}

			/* Make images responsive */
			img {
				max-width: 100%;
				height: auto;
				border: 0;
				display: block;
			}

			/* Responsive Layout for Two Column */
			@media only screen and (max-width: 600px) {
				.two-column td {
					display: block;
					width: 100% !important;
					text-align: center;
					padding: 0;
				}
				.two-column td img {
					margin: 0 auto;
					display: block;
				}
				.tbutton {
					width: 75% !important;
					margin-left: auto;
					margin-right: auto;
				}
			}
		</style>
	</head>
	<body
		style="
			font-family: Arial, sans-serif;
			background-color: whitesmoke;
			margin: 0;
			padding: 0;
		"
	>
		<table
			width="99%"
			cellspacing="0"
			cellpadding="0"
			style="
				background-color: whitesmoke;
				padding: 20px;
				margin-top: 2px;
				margin-right: auto;
				margin-left: auto;
			"
		>
			<tr>
				<td style="text-align: center">
					<p style="margin-bottom: 0.2em; margin-top: 0.1em">
						If you can't see images,
						<a
							href="https://contact.tu.biz/camp-host/12-11-25/${email}/${campId}/${title}"
							>click here</a
						>
						to view it on the web.
					</p>
					<!-- <p style="margin-bottom: 0; margin-top: 0.1em">${title}</p> -->
				</td>
			</tr>
			<tr>
				<td align="center">
					<!-- Main Container -->
					<table
						width="1000"
						border="0"
						cellspacing="0"
						cellpadding="0"
						class="container"
						style="
							background-color: #016698;
							margin-bottom: 0.3em;
							margin-top: 0;
							border-radius: 10px;
							padding: 1em;
						"
					>
						<tr>
							<td style="text-align: center">
								<h1 style="margin: 0; color: white">Technical Union</h1>
								<p style="margin-top: 1em; margin-bottom: 0.3em; color: white">
									Industrial Automation
								</p>
								<p style="color: white; margin: 0">
									Hydraulics | Pneumatics | Electrical | Mechanical
								</p>
							</td>
						</tr>
					</table>
					<!-- Middle line  -->
					<table
						width="1000"
						border="0"
						cellspacing="0"
						cellpadding="0"
						class="container2"
						style="
							background-color: #016698;
							margin-bottom: 0.3em;
							border-radius: 10px;
							padding: 0.1em;
						"
					></table>

					<!-- Two Column Layout -->
					<table
						width="1000"
						border="0"
						cellspacing="0"
						cellpadding="0"
						class="container two-column"
						style="
							background-color: white;
							margin-bottom: 0.3em;
							border-radius: 10px;
							padding: 1em;
						"
					>
						<tr>
							<td style="text-align: center" colspan="5">
								<p style="color: #3a6b83; margin: 0; line-height: 1.8">
									<b style="padding: 2px 8px; margin: 0 10px"
										>Merry Christmas!</b
									>
									<b style="padding: 2px 8px; margin: 0 10px">Feliz Navidad!</b>
									<b style="padding: 2px 8px; margin: 0 10px">Feliz Natal!</b>
								</p>
							</td>
						</tr>
						<tr>
							<td colspan="5">
								<p>Hello ${name},</p>
								<p>Wishing you a Merry Christmas and Happy New Year!</p>
							</td>
						</tr>
						<tr>
							<td
							
								colspan="5"
								style="text-align: center; padding: 2%; box-sizing: border-box"
							>
								<a
									href="https://www.tu.biz"
								>
									<img
										src="https://email.tu.biz/_next/image?url=%2Fimages%2Fother%2Fchristmas-tree.png&w=1920&q=75"
										alt="Rexroth pump replacement"
										style="
											max-width: 40%;
											height: auto;
											display: block;
											border: 0;
											margin: 0 auto;
										"
									/>
								</a>
							</td>
						</tr>
						<tr>
							<td width="20%"
                style="text-align: center; padding: 2%; box-sizing: border-box"
              >
                <a
                  href="https://email.tu.biz/my/email-follow/${email}/${campId}/charlynn"
                >
                  <img
                    src="https://email.tu.biz/_next/image?url=%2Fimages%2Fproducts%2Fcharlynn263.png&w=1920&q=75"
                    alt="charlynn replacement"
                    style="
                      max-width: 100%;
                      height: auto;
                      display: block;
                      border: 0;
                      margin: 0 auto;
                    "
                  />
                                
                            </td>
							<td width="20%"
                style="text-align: center; padding: 2%; box-sizing: border-box"
              >
                <a
                  href="https://email.tu.biz/my/email-follow/${email}/${campId}/a10v"
                >
                  <img
                    src="https://email.tu.biz/_next/image?url=%2Fimages%2Fproducts%2Frexrothpump-5.png&w=1920&q=75"
                    alt="Rexroth pump replacement"
                    style="
                      max-width: 100%;
                      height: auto;
                      display: block;
                      border: 0;
                      margin: 0 auto;
                    "
                  /></td>
							<td width="20%"
                style="text-align: center; padding: 2%; box-sizing: border-box"
              >
                <a
                  href="https://email.tu.biz/my/email-follow/${email}/${campId}/controller"
                >
                  <img
                    src="https://email.tu.biz/_next/image?url=%2Fimages%2Fproducts%2Fcontroller.png&w=1920&q=75"
                    alt="Controller"
                    style="
                      max-width: 100%;
                      height: auto;
                      display: block;
                      border: 0;
                      margin: 0 auto;
                    "
                  /></td>
							<td width="20%"
                style="text-align: center; padding: 2%; box-sizing: border-box"
              >
                <a
                  href="https://email.tu.biz/my/email-follow/${email}/${campId}/heatExchanger-air"
                >
                  <img
                    src="https://email.tu.biz/_next/image?url=%2Fimages%2Fproducts%2Fair-heatexchanger.png&w=1920&q=75"
                    alt="Rexroth pump replacement"
                    style="
                      max-width: 100%;
                      height: auto;
                      display: block;
                      border: 0;
                      margin: 0 auto;
                    "
                  /></td>
							<td width="20%"
                style="text-align: center; padding: 2%; box-sizing: border-box"
              >
                <a
                  href="https://email.tu.biz/my/email-follow/${email}/${campId}/water-cooler"
                >
                  <img
                    src="https://email.tu.biz/_next/image?url=%2Fimages%2Fproducts%2FHeat-Exchanger-Hybrid.png&w=1920&q=75"
                    alt="water cooler"
                    style="
                      max-width: 100%;
                      height: auto;
                      display: block;
                      border: 0;
                      margin: 0 auto;
                    "
                  /></td>
						</tr>
					</table>
					<!-- Middle line  -->

					<!-- Middle line  -->

					<table
						width="1000"
						border="0"
						cellspacing="0"
						cellpadding="0"
						class="container2"
						style="
							background-color: #016698;
							margin-bottom: 0.3em;
							border-radius: 10px;
							padding: 0.1em;
						"
					></table>

					<!-- Industry table  -->

					<table
						width="1000"
						border="0"
						cellspacing="0"
						cellpadding="0"
						class="container"
						style="
							background-color: #016698;
							margin-bottom: 0.3em;
							border-radius: 10px;
							padding: 1em;
						"
					>
						<tr>
							<td style="text-align: center">
								<h1 style="margin: 0; color: white">Industries</h1>

								<p style="color: white; margin: 0">
									Steel | Aluminum | Metal Forming | Plastic | Automotive |
									Energy | Chemical | Medical | Petroleum | Cement | Paper |
									Food | Entertainment | Forestal | Agricultural | Construction
									| Fishing | Mining | Packaging | Printing | | Bottling |
									Transportation
								</p>
							</td>
						</tr>
					</table>
					<!-- Middle line  -->
					<table
						width="1000"
						border="0"
						cellspacing="0"
						cellpadding="0"
						class="container2"
						style="
							background-color: #016698;
							margin-bottom: 0.3em;
							border-radius: 10px;
							padding: 0.1em;
						"
					></table>

					<!-- Social Media -->
					<table
						width="400"
						border="0"
						cellspacing="0"
						cellpadding="0"
						class="container"
						style="
							background-color: whitesmoke;
							margin-bottom: 1em;
							margin-left: auto;
							margin-right: auto;
							padding-top: 0.5em;
							text-align: center;
						"
					>
						<tr>
							<td colspan="2">
								<p style="color: grey; margin-bottom: 0.5em">Contact</p>
							</td>
						</tr>
						<tr>
							<td width="50%" style="text-align: center">
								<a href="https://wa.me/15866125270">
									<img
										src="https://email.tu.biz/_next/image?url=%2Fimages%2Fsocial-icons%2Fwhatsapp.png&w=1920&q=75"
										alt="LinkedIn"
										style="
											max-width: 100%;
											height: auto;
											display: block;
											border: 0;
											margin: 0 auto;
											display: block;
										"
									/>
								</a>
								<p style="color: grey; margin-bottom: 0.5em">WhatsApp</p>
							</td>
							<td width="50%" style="text-align: center">
								<a href="mailto:info@tu.biz">
									<img
										src="https://email.tu.biz/_next/image?url=%2Fimages%2Fsocial-icons%2Femail.png&w=1920&q=75"
										alt="YouTube"
										style="
											max-width: 100%;
											height: auto;
											margin-left: auto;
											margin-right: auto;
											display: block;
										"
									/>
								</a>
								<p style="color: grey; margin-bottom: 0.5em">Email</p>
							</td>
						</tr>
					</table>

					<!-- Footer -->
					<table
						width="1000"
						border="0"
						cellspacing="0"
						cellpadding="0"
						class="container"
						style="
							background-color: whitesmoke;
							margin: auto;
							padding: 0.5em;
							text-align: center;
							font-size: 10px;
						"
					>
						<tr>
							<td>
								<p style="color: grey; margin: 0 0 0.5em">
									${new Date().getFullYear()} Technical Union, all rights
									reserved.
								</p>
								<p style="color: grey; margin: 0 0 0.5em">
									This email was sent to: ${email}
								</p>
								<p style="color: grey; margin: 0 0 0.5em">
									This email was sent by: Technical Union | 4 N Rammer |
									Arglington Heights IL 60004 | USA
								</p>
								<p style="color: grey; margin: 0 0 0.5em">
									To unsubscribe
									<a
										href="https://email.tu.biz/my/un1/${email}/${campId}"
										style="color: grey"
										>click here</a
									>
								</p>
							</td>
						</tr>
					</table>
				</td>
			</tr>
		</table>
	</body>
</html>

  `;

  // return new Response(htmlResponse, {
  //   headers: { "Content-Type": "text/html" },
  // });

  return new NextResponse(htmlResponse, {
    headers: { "Content-Type": "text/html" },
  });
}
