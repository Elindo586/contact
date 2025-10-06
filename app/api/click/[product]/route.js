// import { sql } from "@vercel/postgres";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
	const { product } = await params;

	const sql = neon(`${process.env.DATABASE_URL}`);

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

	// Debug: Log parameters to check if data is correct
	console.log("Inserting data into database:", {
		product,
		chicagoTime,
	});

	try {
		// Insert into the database
		const result = await sql`
      INSERT INTO links (product, date)
      VALUES (${product}, ${chicagoTime});
    `;
		console.log("Data inserted successfully:", result);
	} catch (error) {
		console.error("Error inserting data:", error);
		return NextResponse.error(); // Optional: Return error response if insertion fails
	}

	// Define the redirect URL based on the product
	const redirectUrl = new URL("https://tu.biz", request.url);

	// the link is:
	// https://email.tu.biz/my/email-follow/g/g/g

	switch (product) {
		case "tubiz":
			redirectUrl.href = "https://www.tu.biz"
			break;
		case "fluidyne":
			redirectUrl.href = "https://www.fluidynefp.com/Literature.aspx";
			break;
		case "a4v":
			redirectUrl.href = "https://www.fluidynefp.com/LiteratureDoc.ashx?Id=39";
			break;
		case "vq-pump":
			redirectUrl.href = "https://www.tu.biz/products/vane-pumps";
			break;
		case "charlynn":
			redirectUrl.href = "https://www.tu.biz/products/geroler-motors";
			break;
		case "heatExchanger-hybrid":
		case "water-cooler":
			redirectUrl.href =
				"https://universalhydraulik-usa.com/products-solutions/heat-exchanger/shell-and-tube-heat-exchanger/hybrid-heat-exchanger/";
			break;
		case "heatExchanger-air":
		case "air-coolers":
			redirectUrl.href =
				"https://universalhydraulik.com/products-solutions/heat-exchanger/oil-air-cooler/oil-air-heat-exchanger-series/";
			break;
		case "won-linear":
			redirectUrl.href = "http://wonst.co.kr/english/product/product_main.php";
			break;
		case "linearguides":
		case "linearguides-english":
			redirectUrl.href =
				"https://www.tu.biz/products/mechanical/linear-bearings";
			break;
		case "iis-applications":
			redirectUrl.href = "https://www.iis-servo.com/industries/";
			break;
		case "iis-products":
			redirectUrl.href = "https://www.iis-servo.com/products/";
			break;
		case "controller":
			redirectUrl.href =
				"https://www.iis-servo.com/products/emerald-automation-controller/";
			break;
		case "toshiba":
			redirectUrl.href =
				"https://www.iis-servo.com/products/shibaura-machine-products/";
			break;
		case "luminary":
			redirectUrl.href =
				"https://www.iis-servo.com/products/luminary-motion-controller/";
			break;
        case "emerald-controller":
        case "emerald-drive":
        case "luminary-controller":
        case "luminary-drive":
        case "brushless-motors":
        case "toshiba-motors":
			redirectUrl.href =
				"https://www.iis-servo.com/request-quote/";
			break;

		default:
			// Handle unknown products with a default redirect
			redirectUrl.href = "https://www.tu.biz";
			break;
	}

	return NextResponse.redirect(redirectUrl);
}
