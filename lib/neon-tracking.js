import { neon } from "@neondatabase/serverless";

/** Set NEON_TRACKING_ENABLED=true on Vercel to store opens/clicks/webhooks in Postgres again. */
export function isNeonTrackingEnabled() {
  return process.env.NEON_TRACKING_ENABLED === "true";
}

let sql;

export function getTrackingSql() {
  if (!isNeonTrackingEnabled()) {
    return null;
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!sql) {
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}
