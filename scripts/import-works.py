#!/usr/bin/env python3
"""Compress source photos into images/works and write js/works.js."""

from __future__ import annotations

import json
import re
import shutil
import unicodedata
from pathlib import Path

from PIL import Image, ImageOps

SRC_ROOT = Path("/Users/rustamahatov/Downloads/Polesh.pro/projects foto")
RES_ROOT = SRC_ROOT / "Жилый объекты"
COM_ROOT = SRC_ROOT / "Нежилые объекты"
DEST_ROOT = Path("/Users/rustamahatov/Desktop/Polesh/images/works")
JS_OUT = Path("/Users/rustamahatov/Desktop/Polesh/js/works.js")
MAX_EDGE = 1800
JPEG_QUALITY = 80

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}

ROOM_MAP = [
    (("гостиная",), "living", "Гостиная", "Living room"),
    (("ванная",), "bath", "Ванная", "Bathroom"),
    (("прихожая",), "entry", "Прихожая", "Entrance"),
    (("санузел при спальне",), "ensuite", "Санузел при спальне", "Ensuite"),
    (("санузел гостев",), "guest-wc", "Гостевой санузел", "Guest WC"),
    (("спальня гостев",), "guest-bed", "Гостевая спальня", "Guest bedroom"),
    (("спальня 3",), "bedroom-3", "Спальня, 3 этаж", "Third-floor bedroom"),
    (("спальня",), "bedroom", "Спальня", "Bedroom"),
    (("кабинет",), "study", "Кабинет", "Study"),
    (("детская",), "nursery", "Детская", "Children’s room"),
    (("санузел",), "wc", "Санузел", "WC"),
]


def nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s)


def fold(s: str) -> str:
    return nfc(s).lower()


def natural_key(name: str) -> list:
    parts = re.split(r"(\d+)", nfc(name))
    return [int(p) if p.isdigit() else p.lower() for p in parts]


def find_child(parent: Path, *needles: str) -> Path | None:
    if not parent.exists():
        return None
    for child in parent.iterdir():
        if child.name.startswith("."):
            continue
        name = fold(child.name)
        if all(fold(n) in name for n in needles):
            return child
    return None


def iter_images(folder: Path) -> list[Path]:
    files = [
        p
        for p in folder.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXT and not p.name.startswith(".")
    ]
    return sorted(files, key=lambda p: natural_key(p.name))


def collect_grouped(folder: Path) -> list[tuple[str | None, Path]]:
    """Return (room_id_or_None, image_path) in reading order."""
    items: list[tuple[str | None, Path]] = []
    for img in iter_images(folder):
        items.append((None, img))

    subdirs = [d for d in folder.iterdir() if d.is_dir() and not d.name.startswith(".")]
    subdirs.sort(key=lambda p: natural_key(p.name))
    for sub in subdirs:
        room_id = match_room(sub.name)
        for img in iter_images(sub):
            items.append((room_id, img))
    return items


def match_room(name: str) -> str:
    folded = fold(name)
    for needles, room_id, *_ in ROOM_MAP:
        if all(n in folded for n in needles):
            return room_id
    slug = re.sub(r"[^a-z0-9]+", "-", folded).strip("-") or "room"
    return slug[:40]


def save_jpeg(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)
        if im.mode in ("RGBA", "LA", "P"):
            rgba = im.convert("RGBA")
            bg = Image.new("RGB", rgba.size, (244, 240, 232))
            bg.paste(rgba, mask=rgba.split()[-1])
            im = bg
        else:
            im = im.convert("RGB")
        im.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
        im.save(dest, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)


def import_project(work_id: str, source: Path) -> list[dict]:
    dest_dir = DEST_ROOT / work_id
    if dest_dir.exists():
        shutil.rmtree(dest_dir)
    dest_dir.mkdir(parents=True)

    grouped = collect_grouped(source)
    if not grouped:
        raise SystemExit(f"No images in {source}")

    images = []
    counters: dict[str, int] = {}
    for room_id, src in grouped:
        key = room_id or "_"
        counters[key] = counters.get(key, 0) + 1
        n = counters[key]
        if room_id:
            rel = f"{room_id}/{n:02d}.jpg"
        else:
            rel = f"{n:02d}.jpg"
        dest = dest_dir / rel
        save_jpeg(src, dest)
        images.append({"src": f"images/works/{work_id}/{rel}", "room": room_id})
        print(f"  {src.name} -> {rel}")
    return images


# Custom cinematic pages keep their own HTML; catalog still lists them.
WORKS = [
    {
        "id": "sosnovy-bor",
        "type": "residential",
        "match": (RES_ROOT, ("соснов",)),
        "custom": False,
        "title_ru": "Загородный дом «Сосновый Бор»",
        "title_en": "Country House “Sosnovy Bor”",
        "tag_ru": "Частный интерьер",
        "tag_en": "Private interior",
        "place_ru": "КП «Сосновый Бор»",
        "place_en": "Sosnovy Bor",
        "card_ru": "Загородный дом среди сосен: спокойный свет, дерево и собранный бытовой сценарий.",
        "card_en": "A country house among pines — quiet light, timber and a gathered daily ritual.",
    },
    {
        "id": "ogni",
        "type": "residential",
        "match": (RES_ROOT, ("огни",)),
        "custom": False,
        "title_ru": "Апартаменты «Огни»",
        "title_en": "Apartments “Ogni”",
        "tag_ru": "Частный интерьер",
        "tag_en": "Private interior",
        "place_ru": "Апартаменты",
        "place_en": "Apartments",
        "card_ru": "Гостиная, спальня и санузел в одной тёплой палитре — городская квартира как тихий отель.",
        "card_en": "Living room, bedroom and bath in one warm palette — a city apartment with hotel calm.",
    },
    {
        "id": "artdeco",
        "type": "residential",
        "match": None,
        "custom": True,
        "page": "projects/artdeco.html",
        "cover": "images/previews/artdeco.jpg",
        "title_ru": "Особняк Артдеко",
        "title_en": "Art Deco Mansion",
        "tag_ru": "Частный интерьер",
        "tag_en": "Private interior",
        "place_ru": "Москва",
        "place_en": "Moscow",
        "card_ru": "Столовая, кабинет и ванные — единый жест арт-деко: мрамор, хрусталь и мягкое золото.",
        "card_en": "Dining, study and baths in one Art Deco gesture — marble, crystal and soft gold.",
    },
    {
        "id": "renaissance",
        "type": "residential",
        "match": None,
        "custom": True,
        "page": "projects/renaissance.html",
        "cover": "images/previews/renaissance.jpg",
        "title_ru": "Загородный дом «Ренессанс»",
        "title_en": "Country House “Renaissance”",
        "tag_ru": "Частный интерьер",
        "tag_en": "Private interior",
        "place_ru": "КП «Ренессанс»",
        "place_en": "Renaissance community",
        "card_ru": "Гостиная и ванная в единой палитре: тёплое дерево, камень и спокойный свет.",
        "card_en": "Living room and bath in one palette: warm timber, stone and quiet light.",
    },
    {
        "id": "kompozitorov",
        "type": "residential",
        "match": (RES_ROOT, ("композитор",)),
        "custom": False,
        "title_ru": "Квартира в ЖК «Резиденции композиторов»",
        "title_en": "Residence of Composers Apartment",
        "tag_ru": "Частный интерьер",
        "tag_en": "Private interior",
        "place_ru": "Москва",
        "place_en": "Moscow",
        "card_ru": "Клубный дом: сдержанная геометрия, тактильные поверхности и вечерний свет.",
        "card_en": "A club house apartment — restrained geometry, tactile surfaces and evening light.",
    },
    {
        "id": "zarechnaya",
        "type": "residential",
        "match": (RES_ROOT, ("заречн",)),
        "custom": False,
        "title_ru": "Загородный дом «Заречная»",
        "title_en": "Country House “Zarechnaya”",
        "tag_ru": "Частный интерьер",
        "tag_en": "Private interior",
        "place_ru": "КП «Заречная»",
        "place_en": "Zarechnaya",
        "card_ru": "Загородный ритм: широкие проёмы, мягкая мебель и свет, который ведёт через дом.",
        "card_en": "A country rhythm — wide openings, soft furniture and light that leads through the house.",
    },
    {
        "id": "knyazhichi",
        "type": "residential",
        "match": (RES_ROOT, ("княжичи",)),
        "custom": False,
        "title_ru": "Таунхаус КП «Княжичи»",
        "title_en": "Townhouse “Knyazhichi”",
        "tag_ru": "Частный интерьер",
        "tag_en": "Private interior",
        "place_ru": "КП «Княжичи»",
        "place_en": "Knyazhichi",
        "card_ru": "Таунхаус с собранной вертикалью: лестница, гостиная и приватные этажи как один жест.",
        "card_en": "A townhouse in one vertical gesture — stair, living floor and private levels.",
    },
    {
        "id": "petersburg",
        "type": "residential",
        "match": (RES_ROOT, ("санкт",)),
        "custom": False,
        "title_ru": "Таунхаус в Санкт-Петербурге",
        "title_en": "Townhouse in Saint Petersburg",
        "tag_ru": "Частный интерьер",
        "tag_en": "Private interior",
        "place_ru": "Санкт-Петербург",
        "place_en": "Saint Petersburg",
        "card_ru": "Петербургский таунхаус: гостиная, кабинет, детская и спальни в спокойной северной палитре.",
        "card_en": "A Petersburg townhouse — living room, study, nursery and bedrooms in a northern palette.",
    },
    {
        "id": "podmoskovye",
        "type": "residential",
        "match": (RES_ROOT, ("подмосков",)),
        "custom": False,
        "title_ru": "Загородный дом в Подмосковье",
        "title_en": "Country House in the Moscow Region",
        "tag_ru": "Частный интерьер",
        "tag_en": "Private interior",
        "place_ru": "Подмосковье",
        "place_en": "Moscow Region",
        "card_ru": "Гостиная, прихожая и спальни — загородный дом с ясной планировочной логикой.",
        "card_en": "Living room, entrance and bedrooms — a country house with clear planning logic.",
    },
    {
        "id": "lobby",
        "type": "commercial",
        "match": None,
        "custom": True,
        "page": "projects/lobby.html",
        "cover": "images/previews/lobby.jpg",
        "title_ru": "Лобби бутик-отеля",
        "title_en": "Boutique Hotel Lobby",
        "tag_ru": "Общественное пространство",
        "tag_en": "Public space",
        "place_ru": "Бутик-отель",
        "place_en": "Boutique hotel",
        "card_ru": "Волнообразный деревянный потолок, живые стены и сценарий встречи гостя.",
        "card_en": "A wave-like timber ceiling, living walls and a guest journey from the door.",
    },
    {
        "id": "hotel-hall",
        "type": "commercial",
        "match": (COM_ROOT, ("гостев", "холл")),
        "hotel_parent": True,
        "custom": False,
        "title_ru": "Гостевой холл бутик-отеля",
        "title_en": "Boutique Hotel Guest Hall",
        "tag_ru": "Общественное пространство",
        "tag_en": "Public space",
        "place_ru": "Бутик-отель",
        "place_en": "Boutique hotel",
        "card_ru": "Промежуточное пространство между лобби и номерами — свет, материал, пауза.",
        "card_en": "The in-between of lobby and rooms — light, material, a pause.",
    },
    {
        "id": "hotel-floors",
        "type": "commercial",
        "match": (COM_ROOT, ("холл", "этаж")),
        "hotel_parent": True,
        "custom": False,
        "title_ru": "Холл 2–4 этажей",
        "title_en": "Floors 2–4 Hall",
        "tag_ru": "Общественное пространство",
        "tag_en": "Public space",
        "place_ru": "Бутик-отель",
        "place_en": "Boutique hotel",
        "card_ru": "Вертикальные холлы этажей: навигация, камерный свет и повторяющийся ритм.",
        "card_en": "Vertical floor halls — wayfinding, intimate light and a repeating rhythm.",
    },
    {
        "id": "travelers-club",
        "type": "commercial",
        "match": (COM_ROOT, ("путешествен",)),
        "hotel_parent": True,
        "custom": False,
        "title_ru": "Кабинет «Клуб путешественников»",
        "title_en": "Travellers’ Club Study",
        "tag_ru": "Общественное пространство",
        "tag_en": "Public space",
        "place_ru": "Бутик-отель",
        "place_en": "Boutique hotel",
        "card_ru": "Кабинет-клуб: дерево, книги и атмосфера частного путешествия.",
        "card_en": "A club study — timber, books and the mood of a private journey.",
    },
    {
        "id": "ostrov",
        "type": "commercial",
        "match": None,
        "custom": True,
        "page": "projects/ostrov.html",
        "cover": "images/previews/ostrov.jpg",
        "title_ru": "Номер «Остров»",
        "title_en": "Hotel Ostrov Suite",
        "tag_ru": "Гостевой номер",
        "tag_en": "Guest room",
        "place_ru": "Бутик-отель",
        "place_en": "Boutique hotel",
        "card_ru": "Тихая suite-композиция: камень, кожа, ротанг и мягкий свет лесного вида.",
        "card_en": "A quiet suite: stone, leather, rattan and soft forest light.",
    },
    {
        "id": "sputnik",
        "type": "commercial",
        "match": None,
        "custom": True,
        "page": "projects/sputnik.html",
        "cover": "images/previews/sputnik.jpg",
        "title_ru": "Номер «Спутник»",
        "title_en": "Hotel Sputnik Room",
        "tag_ru": "Гостевой номер",
        "tag_en": "Guest room",
        "place_ru": "Бутик-отель",
        "place_en": "Boutique hotel",
        "card_ru": "Ретро-футуризм mid-century: тёплое дерево и культурный жест эпохи.",
        "card_en": "Mid-century retro-futurism: warm timber and a cultural gesture.",
    },
    {
        "id": "eco",
        "type": "commercial",
        "match": None,
        "custom": True,
        "page": "projects/eco.html",
        "cover": "images/previews/eco.jpg",
        "title_ru": "Номер «Эко»",
        "title_en": "Hotel Eco Room",
        "tag_ru": "Гостевой номер",
        "tag_en": "Guest room",
        "place_ru": "Бутик-отель",
        "place_en": "Boutique hotel",
        "card_ru": "Биофильный номер: живая стена, натуральные фактуры и графитовый фон.",
        "card_en": "A biophilic room: living wall, natural textures and a graphite backdrop.",
    },
    {
        "id": "gagarin",
        "type": "commercial",
        "match": (COM_ROOT, ("гагарин",)),
        "hotel_parent": True,
        "custom": False,
        "title_ru": "Номер «Гагарин»",
        "title_en": "Hotel Gagarin Room",
        "tag_ru": "Гостевой номер",
        "tag_en": "Guest room",
        "place_ru": "Бутик-отель",
        "place_en": "Boutique hotel",
        "card_ru": "Номер с космической романтикой: свет, круглые мотивы и собранный mid-century жест.",
        "card_en": "A room of space-age romance — light, circular motifs and a mid-century gesture.",
    },
    {
        "id": "orbita",
        "type": "commercial",
        "match": (COM_ROOT, ("орбита",)),
        "hotel_parent": True,
        "custom": False,
        "title_ru": "Номер «Орбита»",
        "title_en": "Hotel Orbita Room",
        "tag_ru": "Гостевой номер",
        "tag_en": "Guest room",
        "place_ru": "Бутик-отель",
        "place_en": "Boutique hotel",
        "card_ru": "Орбитальный номер: плотный цвет, характерная мебель и ночной сценарий.",
        "card_en": "An orbital room — dense colour, character furniture and a night-time script.",
    },
    {
        "id": "luna",
        "type": "commercial",
        "match": (COM_ROOT, ("луна",)),
        "hotel_parent": True,
        "custom": False,
        "title_ru": "Номер «Луна»",
        "title_en": "Hotel Luna Room",
        "tag_ru": "Гостевой номер",
        "tag_en": "Guest room",
        "place_ru": "Бутик-отель",
        "place_en": "Boutique hotel",
        "card_ru": "Лунный номер: серебро, мягкая тень и приглушённый ночной свет.",
        "card_en": "A lunar room — silver, soft shadow and muted night light.",
    },
    {
        "id": "indostan",
        "type": "commercial",
        "match": (COM_ROOT, ("индостан",)),
        "hotel_parent": True,
        "custom": False,
        "title_ru": "Номер «Индостан»",
        "title_en": "Hotel Indostan Room",
        "tag_ru": "Гостевой номер",
        "tag_en": "Guest room",
        "place_ru": "Бутик-отель",
        "place_en": "Boutique hotel",
        "card_ru": "Индостан: насыщенный орнамент, тёплое дерево и текстиль дальнего путешествия.",
        "card_en": "Indostan — rich ornament, warm timber and textiles of a long journey.",
    },
    {
        "id": "africa",
        "type": "commercial",
        "match": (COM_ROOT, ("африка",)),
        "hotel_parent": True,
        "custom": False,
        "title_ru": "Номер «Африка»",
        "title_en": "Hotel Africa Room",
        "tag_ru": "Гостевой номер",
        "tag_en": "Guest room",
        "place_ru": "Бутик-отель",
        "place_en": "Boutique hotel",
        "card_ru": "Африканский номер: земляные тона, плетёные фактуры и тёплый вечерний свет.",
        "card_en": "An African room — earthen tones, woven textures and warm evening light.",
    },
]


def hotel_root() -> Path:
    hotel = find_child(COM_ROOT, "бутик")
    if not hotel:
        raise SystemExit("Boutique hotel folder not found")
    return hotel


def resolve_source(spec: dict) -> Path | None:
    match = spec.get("match")
    if not match:
        return None
    parent, needles = match
    if spec.get("hotel_parent"):
        parent = hotel_root()
    found = find_child(parent, *needles)
    if not found:
        raise SystemExit(f"Source not found for {spec['id']}: {needles} in {parent}")
    return found


def rooms_from_images(images: list[dict]) -> list[dict]:
    seen: list[str] = []
    for img in images:
        rid = img.get("room")
        if rid and rid not in seen:
            seen.append(rid)
    lookup = {room_id: (ru, en) for needles, room_id, ru, en in ROOM_MAP}
    rooms = []
    for rid in seen:
        ru, en = lookup.get(rid, (rid, rid))
        rooms.append({"id": rid, "title_ru": ru, "title_en": en})
    return rooms


def main() -> None:
    DEST_ROOT.mkdir(parents=True, exist_ok=True)
    catalog = []

    for spec in WORKS:
        print(f"\n=== {spec['id']} ===")
        entry = {
            "id": spec["id"],
            "type": spec["type"],
            "custom": bool(spec.get("custom")),
            "page": spec.get("page") or f"projects/{spec['id']}.html",
            "title_ru": spec["title_ru"],
            "title_en": spec["title_en"],
            "tag_ru": spec["tag_ru"],
            "tag_en": spec["tag_en"],
            "place_ru": spec["place_ru"],
            "place_en": spec["place_en"],
            "card_ru": spec["card_ru"],
            "card_en": spec["card_en"],
        }

        if spec.get("custom"):
            entry["cover"] = spec["cover"]
            entry["images"] = []
            entry["rooms"] = []
            catalog.append(entry)
            print("  (existing cinematic page)")
            continue

        source = resolve_source(spec)
        print(f"  from: {source}")
        images = import_project(spec["id"], source)
        entry["images"] = images
        entry["cover"] = images[0]["src"]
        entry["rooms"] = rooms_from_images(images)
        catalog.append(entry)
        print(f"  {len(images)} images")

    JS_OUT.write_text(
        "/** Auto-generated by scripts/import-works.py — do not edit by hand. */\n"
        "window.POLESH_WORKS = "
        + json.dumps(catalog, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )
    print(f"\nWrote {JS_OUT} ({len(catalog)} works)")


if __name__ == "__main__":
    main()
