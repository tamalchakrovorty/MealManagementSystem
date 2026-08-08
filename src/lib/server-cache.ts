import { unstable_cache, revalidateTag } from "next/cache";

export async function cachedQuery<T>(
  cb: () => Promise<T>,
  keyParts: string[],
  options: { revalidate?: number | false; tags?: string[] }
): Promise<T> {
  const cached = unstable_cache(cb, keyParts, options);
  return cached();
}

export function invalidateTag(tag: string, profile: string = "max") {
  revalidateTag(tag, profile);
}

export function invalidateTags(tags: string[], profile: string = "max") {
  tags.forEach((tag) => revalidateTag(tag, profile));
}