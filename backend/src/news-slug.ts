import Sanscript from "@indic-transliteration/sanscript";

// The package's CommonJS runtime exports t directly; its default declaration
// is interpreted as a nested module by NodeNext. Keep that interop local.
const transliterator = Sanscript as unknown as {
  t(text: string, from: string, to: string, options: {syncope: boolean}): string;
};

/** Romanized URL text only: never use this to replace a title or description. */
export function newsSlug(value: string, maxLength = 180): string {
  const roman = value.normalize("NFKC").replace(/[\u0900-\u097f]+/gu, word => {
    let text = transliterator.t(word, "devanagari", "iast", {syncope: true});
    // Retain the pronunciation of sh/ch and nasal vowels before removing accents.
    text = text.replace(/[śṣ]/g, "sh").replace(/ch/g, "chh").replace(/c(?!h)/g, "ch")
      .replace(/[ṃṁ]/g, "n").replace(/ṛ/g, "ri");
    // Hindi normally drops the final inherent vowel, but not an explicit आ.
    if (/[क-हक़-य़]$/u.test(word) && !/्[यव]$/u.test(word)) text = text.replace(/a$/, "");
    return text;
  });
  return roman.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, maxLength).replace(/-+$/g, "");
}
