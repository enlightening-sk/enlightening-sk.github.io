import { createHash } from "node:crypto";

export const DEFAULT_OPT_IN_COUNTRIES = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH",
] as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
const FIVE_MINUTES = 5 * 60 * 1000;

export type LeadMeta = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  fbclid: string | null;
  fbp: string | null;
  fbc: string | null;
  eventId: string | null;
  marketingConsent: boolean;
};

export type CapiConfig = {
  metaPixelId: string;
  metaCapiAccessToken: string;
  metaGraphVersion: string;
  metaTestEventCode: string;
};

export type CapiLead = {
  marketingConsent: boolean;
  eventId: string | null;
  email: string;
  name: string;
  ip: string;
  userAgent: string | null;
  fbp: string | null;
  fbc: string | null;
};

export function parseOptInCountries(raw: string | undefined): Set<string> {
  if (raw === undefined || raw.trim() === "") return new Set(DEFAULT_OPT_IN_COUNTRIES);
  const codes = raw
    .split(",")
    .map((part) => part.trim().toUpperCase())
    .filter((part) => /^[A-Z]{2}$/.test(part));
  return new Set(codes);
}

export function consentModeForCountry(
  countryHeader: string | undefined,
  optIn: ReadonlySet<string>,
): "opt_in" | "opt_out" {
  const code = (countryHeader ?? "").trim().toUpperCase();
  if (code === "" || code === "XX") return "opt_in";
  return optIn.has(code) ? "opt_in" : "opt_out";
}

export function funnelPixelTag(pixelId: string, consentMode: "opt_in" | "opt_out"): string | null {
  if (!/^\d{1,32}$/.test(pixelId)) return null;
  const json = JSON.stringify({ pixelId, consentMode }).replace(/</g, "\\u003c");
  return `<script>window.FUNNEL_PIXEL=${json};</script>`;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function nameParts(name: string): { fn: string; ln?: string } {
  const trimmed = name.trim().toLowerCase().replace(/\s+/g, " ");
  const parts = trimmed.split(" ");
  if (parts.length === 2 && parts[0] && parts[1]) return { fn: parts[0], ln: parts[1] };
  return { fn: trimmed };
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function clip(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/[\u0000-\u001F\u007F]/g, "");
  if (!cleaned) return null;
  return cleaned.slice(0, max);
}

function eventIdOf(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!UUID.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

function seenAt(value: unknown, now: number): number | null {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) return null;
  if (value < 1_000_000_000_000) return null;
  if (value > now + FIVE_MINUTES) return null;
  if (now - value > NINETY_DAYS) return null;
  return value;
}

function composeFbc(fbclid: string, seen: number): string | null {
  const built = `fb.1.${seen}.${fbclid}`;
  return built.length <= 512 ? built : null;
}

export function readLeadMeta(body: Record<string, unknown>, now = Date.now()): LeadMeta {
  const fbclid = clip(body.fbclid, 512);
  let fbc = clip(body.fbc, 512);
  if (!fbc && fbclid) {
    const seen = seenAt(body.fbclid_ts, now);
    if (seen !== null) fbc = composeFbc(fbclid, seen);
  }
  return {
    utmSource: clip(body.utm_source, 200),
    utmMedium: clip(body.utm_medium, 200),
    utmCampaign: clip(body.utm_campaign, 200),
    utmContent: clip(body.utm_content, 200),
    utmTerm: clip(body.utm_term, 200),
    fbclid,
    fbp: clip(body.fbp, 255),
    fbc,
    eventId: eventIdOf(body.event_id),
    marketingConsent: body.marketing_consent === true,
  };
}

export async function sendLeadEvent(config: CapiConfig, input: CapiLead): Promise<void> {
  if (!input.marketingConsent || !config.metaCapiAccessToken || !input.eventId) return;
  if (!/^\d{1,32}$/.test(config.metaPixelId)) {
    throw new Error("CAPI skipped: META_PIXEL_ID is missing");
  }
  if (!/^v\d+\.\d+$/.test(config.metaGraphVersion)) {
    throw new Error("CAPI skipped: META_GRAPH_VERSION is invalid");
  }

  const userData: Record<string, string | string[]> = {
    em: [sha256(normalizeEmail(input.email))],
  };
  const names = nameParts(input.name);
  userData.fn = [sha256(names.fn)];
  if (names.ln) userData.ln = [sha256(names.ln)];
  if (input.ip && input.ip !== "unknown") userData.client_ip_address = input.ip;
  const userAgent = input.userAgent?.replace(/[\r\n]+/g, " ").trim();
  if (userAgent) userData.client_user_agent = userAgent;
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        event_source_url: "https://enlightening.sk/software/contact/",
        user_data: userData,
      },
    ],
  };
  if (config.metaTestEventCode) body.test_event_code = config.metaTestEventCode;

  const url = new URL(
    `https://graph.facebook.com/${config.metaGraphVersion}/${config.metaPixelId}/events`,
  );
  url.searchParams.set("access_token", config.metaCapiAccessToken);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error("CAPI request failed");
  }
  if (!response.ok) throw new Error(`CAPI responded ${response.status}`);
}
