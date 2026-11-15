"""
Generates the BuildBack logo files in assets/images/.

The logo is a gold "B" built from bricks, with one brick being set in place.
It appears alone as the app icon and leading the word "BuildBack" in the wordmark.

Usage:  python3 scripts/generate-logo.py [path/to/Inter-Black.otf]
Needs:  pip install pillow, and the free Inter font (https://rsms.me/inter/).
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

BLACK = sys.argv[1] if len(sys.argv) > 1 else '/usr/share/fonts/opentype/inter/Inter-Black.otf'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'images')

BLUE, BLUE_DEEP = (31, 59, 224), (11, 26, 140)
GOLD, GOLD_LT, GOLD_DK = (224, 180, 21), (242, 201, 53), (196, 148, 10)
INK, CREAM, BLUE_ON_DARK = (28, 23, 23), (250, 248, 243), (107, 127, 255)
SHADES = [GOLD, GOLD_LT, GOLD_DK, GOLD, GOLD_LT]


def gradient(size, top, bottom):
    im = Image.new('RGB', size, top)
    d = ImageDraw.Draw(im)
    for y in range(size[1]):
        t = y / (size[1] - 1)
        d.line([(0, y), (size[0], y)], fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return im


def brick_layout(W, H, x, y, size):
    """Lays out the brick B. Returns the letter mask, the brick layer, each row's top and the last brick's box."""
    f = ImageFont.truetype(BLACK, size)
    mask = Image.new('L', (W, H), 0)
    ImageDraw.Draw(mask).text((x, y), 'B', font=f, fill=255)
    bb = mask.getbbox()
    rows = 9
    bh_total = (bb[3] - bb[1]) / rows  # brick + mortar height
    gap = max(2, bh_total * 0.16)
    bh = bh_total - gap
    bw = bh * 2.15
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    hole, row_tops = None, []
    for r in range(rows):
        by = bb[1] + r * bh_total
        row_tops.append(by)
        off = 0 if r % 2 == 0 else -(bw + gap) / 2
        c, bx = 0, bb[0] + off
        while bx < bb[2]:
            shade = SHADES[(r * 3 + c) % len(SHADES)]
            ld.rectangle([bx, by, bx + bw, by + bh], fill=shade)
            hl = max(1, bh * 0.14)
            ld.rectangle([bx + bw * 0.06, by + bh * 0.14, bx + bw - bw * 0.06, by + bh * 0.14 + hl],
                         fill=tuple(min(255, v + 30) for v in shade))
            if r == 0:
                hole = (bx, by, bx + bw, by + bh)  # right-most brick on the top row
            bx += bw + gap
            c += 1
    return dict(font=f, mask=mask, layer=layer, row_tops=row_tops, hole=hole, gap=gap, bh=bh, bw=bw)


def clip(layer, region):
    """Keeps only the parts of `layer` inside the `region` mask."""
    out = Image.new('RGBA', layer.size, (0, 0, 0, 0))
    out.paste(layer, (0, 0), Image.composite(layer.getchannel('A'), Image.new('L', layer.size, 0), region))
    return out


def hole_box(L):
    h, gap = L['hole'], L['gap']
    return [h[0] - gap / 2, h[1] - 2, h[2] + gap, h[3] + gap / 2]


def new_brick_image(L, color):
    bw, bh = L['bw'], L['bh']
    pad = int(bh * 0.4)
    nb = Image.new('RGBA', (int(bw) + 2 * pad, int(bh) + 2 * pad), (0, 0, 0, 0))
    ImageDraw.Draw(nb).rounded_rectangle([pad, pad, pad + bw, pad + bh], radius=max(1, int(bh * 0.15)), fill=color)
    return nb, pad


def brick_B(im, x, y, size, falling=True, new_brick=CREAM, motion=(255, 255, 255)):
    """A solid 'B' (exact letter shape) cut into bricks by mortar lines; the top-right brick is being set in place."""
    L = brick_layout(im.size[0], im.size[1], x, y, size)
    letter = L['mask'].copy()
    if falling:
        ImageDraw.Draw(letter).rectangle(hole_box(L), fill=0)  # leave a gap where the last brick goes
    piece = clip(L['layer'], letter)
    im.paste(piece, (0, 0), piece)
    if falling:
        bw, bh, hole = L['bw'], L['bh'], L['hole']
        nb, _ = new_brick_image(L, new_brick)
        nb = nb.rotate(-12, resample=Image.BICUBIC, expand=True)
        nx, ny = int(hole[0] + bw * 0.25), int(hole[1] - bh * 2.9)
        im.paste(nb, (nx, ny), nb)
        d = ImageDraw.Draw(im)
        for i, dx in enumerate((0.25, 0.5, 0.75)):
            lx = nx + nb.size[0] * dx * 0.8
            d.rounded_rectangle([lx, ny + nb.size[1] + bh * 0.1, lx + bh * 0.18, ny + nb.size[1] + bh * (0.9 - i * 0.15)],
                                radius=max(1, int(bh * 0.09)), fill=motion)
    return L['font'].getlength('B')


def intro_layers(S=512, size=430):
    """Layers for the animated opening screen, all on the same transparent S x S canvas:
    one image per row of bricks, the last brick in place (gold), and the new brick (cream) in its final spot."""
    canvas = Image.new('RGBA', (S, S))
    x, y = centered_B(canvas, size, dx=-3, dy=12)
    L = brick_layout(S, S, x, y, size)
    letter = L['mask'].copy()
    ImageDraw.Draw(letter).rectangle(hole_box(L), fill=0)
    layers = {}
    tops = L['row_tops']
    step = tops[1] - tops[0]
    for r, top in enumerate(tops):
        band = Image.new('L', (S, S), 0)
        ImageDraw.Draw(band).rectangle([0, top - L['gap'] / 2, S, top + step - L['gap'] / 2], fill=255)
        row_region = Image.composite(letter, Image.new('L', (S, S), 0), band)
        layers[f'row-{r}'] = clip(L['layer'], row_region)
    last = Image.new('L', (S, S), 0)
    ImageDraw.Draw(last).rectangle(hole_box(L), fill=255)
    layers['last-brick'] = clip(L['layer'], Image.composite(L['mask'], Image.new('L', (S, S), 0), last))
    nb, pad = new_brick_image(L, CREAM)
    new = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    new.paste(nb, (int(L['hole'][0]) - pad, int(L['hole'][1]) - pad), nb)
    layers['new-brick'] = new
    return layers


def centered_B(im, size, dx=-10, dy=30):
    f = ImageFont.truetype(BLACK, size)
    bb = ImageDraw.Draw(im).textbbox((0, 0), 'B', font=f)
    x = (im.size[0] - (bb[2] - bb[0])) // 2 - bb[0] + dx
    y = (im.size[1] - (bb[3] - bb[1])) // 2 - bb[1] + dy
    return x, y


def app_icon(S=1024):
    """Full-bleed square; iOS and Android round the corners themselves."""
    im = gradient((S, S), BLUE_DEEP, BLUE)
    brick_B(im, *centered_B(im, 860), 860)
    return im


def mark(S=1024, size=560, motion=(255, 255, 255)):
    """The brick B alone on a transparent background (splash screen, Android foreground)."""
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    brick_B(im, *centered_B(im, size, dx=-6, dy=24), size, motion=motion)
    return im


def wordmark(dark=False):
    """'BuildBack' with the brick B, on a transparent background."""
    W, H, size = 2000, 480, 300
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    f = ImageFont.truetype(BLACK, size)
    x, y = 40, 70
    accent = CREAM if dark else BLUE
    adv = brick_B(im, x, y, size, new_brick=accent, motion=accent)
    d = ImageDraw.Draw(im)
    d.text((x + adv, y), 'uild', font=f, fill=CREAM if dark else INK)
    d.text((x + adv + f.getlength('uild'), y), 'Back', font=f, fill=BLUE_ON_DARK if dark else BLUE)
    return im.crop(im.getbbox())


def monochrome(S=1024):
    """Android themed-icon layer: a plain white B silhouette."""
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    f = ImageFont.truetype(BLACK, 560)
    ImageDraw.Draw(im).text(centered_B(im, 560, dx=0, dy=10), 'B', font=f, fill=(255, 255, 255, 255))
    return im


if __name__ == '__main__':
    icon = app_icon()
    icon.save(os.path.join(OUT, 'icon.png'))
    icon.resize((48, 48), Image.LANCZOS).save(os.path.join(OUT, 'favicon.png'))
    mark().save(os.path.join(OUT, 'android-icon-foreground.png'))
    gradient((1024, 1024), BLUE_DEEP, BLUE).save(os.path.join(OUT, 'android-icon-background.png'))
    monochrome().save(os.path.join(OUT, 'android-icon-monochrome.png'))
    mark(size=760).save(os.path.join(OUT, 'splash-icon.png'))
    wordmark().save(os.path.join(OUT, 'wordmark.png'))
    wordmark(dark=True).save(os.path.join(OUT, 'wordmark-dark.png'))
    intro_dir = os.path.join(OUT, 'intro')
    os.makedirs(intro_dir, exist_ok=True)
    for name, img in intro_layers().items():
        img.save(os.path.join(intro_dir, f'{name}.png'), optimize=True)
    print('Logo files written to', os.path.normpath(OUT))
