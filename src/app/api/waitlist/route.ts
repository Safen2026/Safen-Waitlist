import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

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
    connectionString: connectionString.replace(
      /[?&]sslmode=[^&]*/g,
      ""
    ),
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

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Quietly accept bot submissions without storing them.
    if (clean(body.website)) {
      return NextResponse.json({ success: true });
    }

    const fullName = clean(body.fullName).replace(/\s+/g, " ");
    const email = clean(body.email).toLowerCase();
    const phone = clean(body.phone);

    if (fullName.length < 2 || fullName.length > 120) {
      return NextResponse.json({ error: "Please enter a valid full name." }, { status: 400 });
    }

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (phone.length < 7 || phone.length > 32 || !/^[+()\d\s.-]+$/.test(phone)) {
      return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
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
      { error: "We couldn't submit your details right now. Please try again shortly." },
      { status: 500 },
    );
  }
}
