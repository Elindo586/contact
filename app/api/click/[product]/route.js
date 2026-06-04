import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { product } = await params;

  const redirectUrl = new URL("https://tu.biz", request.url);

  switch (product) {
    case "tubiz":
      redirectUrl.href = "https://www.tu.biz";
      break;
    case "emerald-controller":
    case "emerald-drive":
    case "luminary-controller":
    case "luminary-drive":
    case "brushless-motors":
    case "toshiba-motors":
      redirectUrl.href =
        "https://www.iis-servo.com/contact-us?utm_source=technical-union-tubiz&utm_medium=referral";
      break;
    default:
      redirectUrl.href = "https://www.tu.biz";
      break;
  }

  return NextResponse.redirect(redirectUrl);
}
