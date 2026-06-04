import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { email } = await params;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Invalid email parameter" }, { status: 400 });
  }

  const redirectUrl = new URL("https://tu.biz/products", request.url);
  return NextResponse.redirect(redirectUrl);
}
