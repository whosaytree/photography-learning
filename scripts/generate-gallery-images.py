from pathlib import Path
from PIL import Image, ImageOps, ImageStat
import sys


ROOT = Path(__file__).resolve().parents[1]
ARCHIVE_ROOT = ROOT / "data" / "archive"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
VARIANTS = (
    {"name": "thumb.jpg", "max_size": 480, "quality": 72},
    {"name": "preview.jpg", "max_size": 1600, "quality": 82},
)


def main():
    if not ARCHIVE_ROOT.exists():
        print(f"Archive root not found: {ARCHIVE_ROOT}", file=sys.stderr)
        return 1

    generated = 0
    skipped = 0
    missing = 0

    for archive_dir in sorted(path for path in ARCHIVE_ROOT.iterdir() if path.is_dir()):
        source = find_source_image(archive_dir)
        if source is None:
            missing += 1
            continue

        source_mtime = source.stat().st_mtime
        for variant in VARIANTS:
            output = archive_dir / variant["name"]
            if is_fresh(output, source_mtime):
                skipped += 1
                continue

            generate_variant(source, output, variant["max_size"], variant["quality"])
            generated += 1

    print(f"Generated {generated} gallery images. Skipped {skipped}. Missing originals {missing}.")
    return 0


def find_source_image(archive_dir):
    for path in sorted(archive_dir.iterdir()):
        if path.is_file() and path.stem.lower() == "original" and path.suffix.lower() in IMAGE_EXTENSIONS:
            return path
    return None


def is_fresh(output, source_mtime):
    if not output.exists() or output.stat().st_mtime < source_mtime:
        return False
    return not is_nearly_black(output)


def is_nearly_black(path):
    try:
        with Image.open(path) as image:
            tiny = image.convert("RGB").resize((1, 1))
            return max(ImageStat.Stat(tiny).mean) < 2
    except Exception:
        return False


def generate_variant(source, output, max_size, quality):
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image)
        image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        image = to_rgb(image)
        image.save(output, "JPEG", quality=quality, optimize=True)


def to_rgb(image):
    if image.mode == "RGB":
        return image
    if image.mode in ("RGBA", "LA"):
        background = Image.new("RGB", image.size, "white")
        background.paste(image, mask=image.getchannel("A"))
        return background
    return image.convert("RGB")


if __name__ == "__main__":
    raise SystemExit(main())
