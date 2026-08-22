export interface Env {
  DB: D1Database;
  TURNSTILE_SECRET_KEY: string;
  RESEND_API_KEY: string;
  NOTIFY_TO: string;
  // 送信元。未設定なら Resend 共有ドメイン (DKIM 不要) を使う。
  // 独自ドメインを Resend で検証したら "Cursorvers LP <noreply@cursorvers.com>" 等を secret で設定。
  RESEND_FROM?: string;
}

const MAX_ORG = 200;
const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_PHONE = 30;
const MAX_MESSAGE = 5000;

interface ContactPayload {
  type?: unknown;
  org?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  message?: unknown;
  turnstileToken?: unknown;
  website?: unknown;
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= MAX_EMAIL;
}

const MAX_BODY_BYTES = 32 * 1024;
const MAX_TURNSTILE_TOKEN = 2048;
const ALLOWED_HOSTNAMES = ["cursorvers.com", "www.cursorvers.com"];

function isAllowedHostname(hostname: unknown): boolean {
  if (typeof hostname !== "string") return false;
  return (
    ALLOWED_HOSTNAMES.includes(hostname) ||
    hostname === "cursorvers-inc.pages.dev" ||
    hostname.endsWith(".cursorvers-inc.pages.dev")
  );
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const contentLength = Number(request.headers.get("Content-Length") || "0");
  if (contentLength > MAX_BODY_BYTES) {
    return json({ ok: false, error: "Payload too large" }, 413);
  }
  const contentTypeHeader = request.headers.get("Content-Type") || "";
  const mimeEssence = contentTypeHeader.split(";")[0].trim().toLowerCase();
  if (mimeEssence !== "application/json") {
    return json({ ok: false, error: "Unsupported Media Type" }, 415);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
    return json({ ok: false, error: "Payload too large" }, 413);
  }

  let body: ContactPayload;
  try {
    body = JSON.parse(rawBody) as ContactPayload;
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  // Honeypot: silent drop
  if (typeof body.website === "string" && body.website.length > 0) {
    return json({ ok: true }, 200);
  }

  // Turnstile verification
  if (
    !isNonEmptyString(body.turnstileToken) ||
    body.turnstileToken.length > MAX_TURNSTILE_TOKEN
  ) {
    return json({ ok: false, error: "turnstileToken is required" }, 400);
  }
  const remoteip = request.headers.get("CF-Connecting-IP") || "";
  const turnstileForm = new FormData();
  turnstileForm.append("secret", env.TURNSTILE_SECRET_KEY);
  turnstileForm.append("response", body.turnstileToken);
  if (remoteip) {
    turnstileForm.append("remoteip", remoteip);
  }
  let turnstileOk = false;
  try {
    const turnstileRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: turnstileForm }
    );
    const turnstileJson = (await turnstileRes.json()) as {
      success?: boolean;
      hostname?: string;
      action?: string;
    };
    turnstileOk =
      turnstileJson.success === true &&
      isAllowedHostname(turnstileJson.hostname) &&
      turnstileJson.action === "contact_submit";
  } catch {
    turnstileOk = false;
  }
  if (!turnstileOk) {
    return json({ ok: false, error: "Turnstile verification failed" }, 403);
  }

  // Input validation
  if (
    body.type !== "hospital" &&
    body.type !== "vendor" &&
    body.type !== "other"
  ) {
    return json({ ok: false, error: "type must be hospital, vendor, or other" }, 400);
  }
  if (!isNonEmptyString(body.org) || body.org.length > MAX_ORG) {
    return json({ ok: false, error: "org is required and must be <= 200 characters" }, 400);
  }
  if (!isNonEmptyString(body.name) || body.name.length > MAX_NAME) {
    return json({ ok: false, error: "name is required and must be <= 100 characters" }, 400);
  }
  if (!isNonEmptyString(body.email) || !isValidEmail(body.email)) {
    return json({ ok: false, error: "email is required and must be a valid email <= 254 characters" }, 400);
  }
  if (
    body.phone !== undefined &&
    body.phone !== null &&
    (typeof body.phone !== "string" || body.phone.length > MAX_PHONE)
  ) {
    return json({ ok: false, error: "phone must be a string <= 30 characters" }, 400);
  }
  if (!isNonEmptyString(body.message) || body.message.length > MAX_MESSAGE) {
    return json({ ok: false, error: "message is required and must be <= 5000 characters" }, 400);
  }

  const type = body.type;
  const org = body.org;
  const name = body.name;
  const email = body.email;
  const phone: string | null =
    typeof body.phone === "string" && body.phone.length > 0 ? body.phone : null;
  const message = body.message;
  const userAgent = request.headers.get("User-Agent") || null;

  // D1 insert
  try {
    await env.DB.prepare(
      `INSERT INTO leads (type, org, name, email, phone, message, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(type, org, name, email, phone, message, userAgent)
      .run();
  } catch {
    return json({ ok: false, error: "Internal database error" }, 500);
  }

  // Resend notification (plain text, no HTML)
  const mailBody = [
    `type: ${type}`,
    `org: ${org}`,
    `name: ${name}`,
    `email: ${email}`,
    `phone: ${phone ?? ""}`,
    "",
    message,
  ].join("\n");

  let mailWarn = false;
  try {
    const mailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM || "Cursorvers LP <onboarding@resend.dev>",
        to: [env.NOTIFY_TO],
        subject: `[Cursorvers LP] New inquiry (${type})`,
        text: mailBody,
      }),
    });
    if (!mailRes.ok) {
      mailWarn = true;
    }
  } catch {
    mailWarn = true;
  }

  return json(mailWarn ? { ok: true, mailWarn: true } : { ok: true }, 200);
};
