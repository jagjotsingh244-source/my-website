import cv2, numpy as np, sys
src, out = sys.argv[1], sys.argv[2]
im = cv2.imread(src)
rng = np.random.default_rng(7)
W, H = 1920, 1080
crop = im[215:470, 1015:1495]
base = cv2.resize(crop, (W, H), interpolation=cv2.INTER_CUBIC).astype(np.float32)
base = cv2.GaussianBlur(base, (0, 0), 45)
gy = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
navy = np.array([42, 22, 12], np.float32)       # BGR deep night blue
amber = np.array([40, 90, 150], np.float32)     # warm city glow
base = base * 0.55 + navy * (1 - gy) * 0.9 + amber * gy ** 2 * 0.55

# bokeh from the real city lights
g = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY).astype(np.float32)
spots = ((g - cv2.GaussianBlur(g, (0, 0), 6)) > 30) & (g > 150)
n, lab, stats, cent = cv2.connectedComponentsWithStats(spots.astype(np.uint8))
layer = np.zeros((H, W, 3), np.float32)
sx, sy = W / crop.shape[1], H / crop.shape[0]
def disc(cx, cy, r, col, a):
    tmp = np.zeros((H, W), np.float32)
    cv2.circle(tmp, (int(cx), int(cy)), int(r), 1.0, -1, cv2.LINE_AA)
    tmp = cv2.GaussianBlur(tmp, (0, 0), max(2, r * 0.12))
    layer[:] += tmp[..., None] * col * a
for i in range(1, n):
    x, y = cent[i]
    col = crop[int(y), int(x)].astype(np.float32)
    col = col / max(col.max(), 1) * 255
    r = 14 + rng.random() * 34 + stats[i, cv2.CC_STAT_AREA] * 0.6
    disc(x * sx, y * sy, min(r, 70), col, 0.22 + rng.random() * 0.25)
# a few extra warm out-of-focus lights low in the frame
for _ in range(26):
    disc(rng.random() * W, H * (0.55 + rng.random() * 0.45), 20 + rng.random() * 50,
         np.array([80, 170, 255], np.float32), 0.10 + rng.random() * 0.15)
img = base + layer
# gentle vignette + grain
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
v = 1 - 0.35 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
img = img * v[..., None] + rng.normal(0, 1.6, img.shape)
cv2.imwrite(out, np.clip(img, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 88])
