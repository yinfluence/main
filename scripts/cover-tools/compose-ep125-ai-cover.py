#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / "workbench" / "covers" / "EP125-ai-scene-base.png"
AVATAR = ROOT / "src" / "assets" / "yinfluence-avatar.png"
OUT = ROOT / "workbench" / "covers" / "EP125-yinfluence-cover.png"

W, H = 1280, 720
S = 2

FONT_HEITI = "/System/Library/Fonts/STHeiti Medium.ttc"
FONT_SONGTI = "/System/Library/Fonts/Supplemental/Songti.ttc"


def sc(v: int | float) -> int:
    return round(v * S)


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, sc(size))


def draw_text(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int | float, int | float],
    text: str,
    size: int,
    fill: str,
    stroke: int = 0,
    stroke_fill: str = "#050505",
    path: str = FONT_HEITI,
) -> None:
    draw.text(
        (sc(xy[0]), sc(xy[1])),
        text,
        font=font(path, size),
        fill=fill,
        stroke_width=sc(stroke),
        stroke_fill=stroke_fill,
    )


def crop_to_16x9(img: Image.Image) -> Image.Image:
    target = 16 / 9
    w, h = img.size
    current = w / h
    if current > target:
        nw = int(h * target)
        left = (w - nw) // 2
        img = img.crop((left, 0, left + nw, h))
    elif current < target:
        nh = int(w / target)
        top = (h - nh) // 2
        img = img.crop((0, top, w, top + nh))
    return img.resize((W * S, H * S), Image.Resampling.LANCZOS).convert("RGBA")


def add_title(img: Image.Image) -> None:
    d = ImageDraw.Draw(img, "RGBA")

    # Bottom headline treatment inspired by Chinese news-commentary thumbnails:
    # large title, tight labels, and no button-like padding.
    vignette = Image.new("RGBA", img.size, (0, 0, 0, 0))
    vd = ImageDraw.Draw(vignette, "RGBA")
    vd.rectangle((sc(0), sc(430), sc(1280), sc(720)), fill=(0, 0, 0, 150))
    vignette = vignette.filter(ImageFilter.GaussianBlur(sc(16)))
    img.alpha_composite(vignette)

    # Compact top brand strip.
    d.rounded_rectangle((sc(0), sc(0), sc(148), sc(46)), radius=sc(9), fill=(232, 0, 12, 245))
    d.rectangle((sc(0), sc(0), sc(136), sc(46)), fill=(232, 0, 12, 245))
    draw_text(d, (18, 7), "颖响力", 23, "#ffffff", 1, "#7b0006", FONT_SONGTI)

    # Tight news tag, then two-line click headline.
    d.rounded_rectangle((sc(52), sc(452), sc(398), sc(508)), radius=sc(5), fill=(216, 0, 12, 246))
    draw_text(d, (76, 462), "35.97亿罚单", 35, "#fff7e6", 1, "#5b0306")
    draw_text(d, (52, 514), "幽灵外卖", 92, "#ffe83b", 5, "#050505")
    draw_text(d, (52, 616), "转包黑幕", 78, "#ffffff", 5, "#050505")


def add_avatar(img: Image.Image) -> None:
    avatar = Image.open(AVATAR).convert("RGBA")
    avatar = avatar.resize((sc(96), sc(96)), Image.Resampling.LANCZOS)
    mask = Image.new("L", avatar.size, 0)
    md = ImageDraw.Draw(mask)
    md.ellipse((0, 0, avatar.size[0] - 1, avatar.size[1] - 1), fill=255)

    x, y = sc(1150), sc(594)
    d = ImageDraw.Draw(img, "RGBA")
    d.ellipse((x - sc(6), y - sc(6), x + sc(102), y + sc(102)), fill=(255, 255, 255, 255))
    d.ellipse((x - sc(1), y - sc(1), x + sc(97), y + sc(97)), outline=(12, 16, 24, 255), width=sc(2))
    clipped = Image.new("RGBA", avatar.size, (0, 0, 0, 0))
    clipped.paste(avatar, (0, 0), mask)
    img.alpha_composite(clipped, (x, y))


def add_frame(img: Image.Image) -> None:
    d = ImageDraw.Draw(img, "RGBA")
    d.line((sc(0), sc(0), sc(W), sc(0)), fill=(232, 0, 12, 255), width=sc(10))
    d.line((sc(0), sc(H - 10), sc(W), sc(H - 10)), fill=(255, 198, 20, 255), width=sc(10))


def main() -> None:
    img = crop_to_16x9(Image.open(BASE))
    add_title(img)
    add_avatar(img)
    add_frame(img)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.resize((W, H), Image.Resampling.LANCZOS).convert("RGB").save(OUT, quality=96, optimize=True)
    print(OUT)


if __name__ == "__main__":
    main()
