import secrets
import unicodedata

def slugify_title(value: str, max_length: int = 180) -> str:
    normalized = unicodedata.normalize("NFKC", value).casefold()
    parts: list[str] = []
    for character in normalized:
        if unicodedata.category(character)[0] in {"L", "M", "N"}:
            parts.append(character)
        elif parts and parts[-1] != "-":
            parts.append("-")
    return "".join(parts).strip("-")[:max_length].strip("-") or secrets.token_hex(4)
