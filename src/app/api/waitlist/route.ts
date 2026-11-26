
import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export const runtime = "nodejs";

declare global {
  // Reuse one pool during local hot reloads.
  // eslint-disable-next-line no-var
  var waitlistPool: Pool | undefined;
}

function getPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!global.waitlistPool) {
    const caPath = path.join(process.cwd(), "prod-ca-2021.crt");
    const ca = fs.readFileSync(caPath, "utf8");

    global.waitlistPool = new Pool({
      connectionString: connectionString
        .replace(/([?&])sslmode=[^&]*/i, "")
        .replace(/[?&]$/, ""),
      ssl: {
        ca,
        rejectUnauthorized: true,
      },
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  return global.waitlistPool;
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidFullName(name: string): boolean {
  if (name.length < 2 || name.length > 120) return false;

  // Allow letters, accents, spaces, hyphens, apostrophes and periods.
  // Reject numbers and punctuation-only names.
  const validCharacters =
    /^[\p{L}\p{M}]+(?:[ .'\u2019-][\p{L}\p{M}]+)*\.?$/u;

  const letterCount = name.match(/\p{L}/gu)?.length ?? 0;

  return validCharacters.test(name) && letterCount >= 2;
}

function isValidEmail(email: string): boolean {
  if (email.length > 254) return false;
  if (email.includes("..")) return false;

  const emailPattern =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  return emailPattern.test(email);
}

function normalizeNigerianPhone(phone: string): string | null {
  const parsed = parsePhoneNumberFromString(phone, "NG");

  if (!parsed || parsed.country !== "NG" || !parsed.isValid()) {
    return null;
  }

  return parsed.number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid submission." },
        { status: 400 },
      );
    }

    // Quietly accept bot submissions without storing them.
    if (clean(body.website)) {
      return NextResponse.json({ success: true });
    }

    const fullName = clean(body.fullName).replace(/\s+/g, " ");
    const email = clean(body.email).toLowerCase();
    const phoneInput = clean(body.phone);

    if (!isValidFullName(fullName)) {
      return NextResponse.json(
        { error: "Please enter a valid full name using letters only." },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const phone = normalizeNigerianPhone(phoneInput);

    if (!phone) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid Nigerian phone number",
        },
        { status: 400 },
      );
    }

    const result = await getPool().query(
      `INSERT INTO waitlist_private.signups (full_name, email, phone)
       VALUES ($1, $2, $3)
       ON CONFLICT ((lower(btrim(email)))) DO NOTHING
       RETURNING id`,
      [fullName, email, phone],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "That email address is already on the waitlist." },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Waitlist submission failed:", error);

    return NextResponse.json(
      {
        error:
          "We couldn't submit your details right now. Please try again shortly.",
      },
      { status: 500 },
    );
  }
}
