export type TaskFilterConfig = {
  storyIds?: number[];
  categoryIds?: number[];
  minReadSeconds?: number;
  extra?: Record<string, unknown>;
};

export function readTaskFilterConfig(raw?: string | null): TaskFilterConfig | null {
  if (!raw?.trim()) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const filters: TaskFilterConfig = {};
    const extra: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(value)) {
      switch (key.toLowerCase()) {
        case "storyids":
        case "categoryids": {
          const property = key.toLowerCase() === "storyids" ? "storyIds" : "categoryIds";
          if (field == null) {
            delete filters[property];
            break;
          }
          if (!Array.isArray(field) || !field.every((id) => Number.isInteger(id) && id > 0 && id <= 2_147_483_647)) return null;
          filters[property] = [...new Set<number>(field)];
          break;
        }
        case "minreadseconds":
          if (typeof field !== "number" || !Number.isInteger(field) || field < 0 || field > 2_147_483_647) return null;
          filters.minReadSeconds = field;
          break;
        default:
          Object.defineProperty(extra, key, { value: field, enumerable: true });
      }
    }
    return { ...filters, extra };
  } catch {
    return null;
  }
}

export function writeTaskFilterConfig({ storyIds, categoryIds, minReadSeconds, extra }: TaskFilterConfig) {
  const config = {
    ...extra,
    ...(storyIds !== undefined ? { storyIds } : {}),
    ...(categoryIds !== undefined ? { categoryIds } : {}),
    ...(minReadSeconds ? { minReadSeconds } : {}),
  };
  return Object.keys(config).length ? JSON.stringify(config) : null;
}
