export function slugifyTitle(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("hi-IN")
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180)
    .replace(/-+$/g, "");
}
