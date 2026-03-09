import { sql } from "bun";

export const db = { query: sql };

export async function initDb() {
  const schema = await Bun.file(
    new URL("../../migrations/001_initial_schema.sql", import.meta.url)
  ).text();
  await sql`${schema}`;
}
