const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True for a well-formed id. Check before placing a value from a URL in a database filter. */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}
