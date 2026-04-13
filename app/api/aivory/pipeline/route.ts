import { NextRequest, NextResponse } from "next/server";

const BRIDGE_BASE_URL =
  process.env.BRIDGE_BASE_URL ?? process.env.VPS_BRIDGE_URL ?? "http://43.156.108.96:3003";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // { intent, diagnostic, companyProfile?, options? }

    const res = await fetch(`${BRIDGE_BASE_URL}/llm/aivory/pipeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("api/aivory/pipeline error", err);
    return NextResponse.json(
      {
        error: true,
        code: "PIPELINE_PROXY_ERROR",
        message: "Failed to call Aivory pipeline",
      },
      { status: 500 }
    );
  }
}
