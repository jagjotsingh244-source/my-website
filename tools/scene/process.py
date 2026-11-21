import cv2, numpy as np, sys, os
work, photo_path, out_dir = sys.argv[1], sys.argv[2], sys.argv[3]
im = cv2.imread(os.path.join(work, 'source.jpg'))
H, W = im.shape[:2]
rng = np.random.default_rng(3)
lum = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32)

# ---------- 1. remove baked-in name, menu and LO-FI button ----------
mask = np.zeros((H, W), np.uint8)
bg = cv2.GaussianBlur(lum, (0, 0), 6)
for (x0, y0, x1, y1) in [(18, 30, 328, 66), (1512, 28, 2148, 70)]:
    sub = (lum[y0:y1, x0:x1] - bg[y0:y1, x0:x1]) > 18
    sub |= lum[y0:y1, x0:x1] > 170
    mask[y0:y1, x0:x1][sub] = 255
mask = cv2.dilate(mask, np.ones((5, 5), np.uint8), iterations=2)
cv2.rectangle(mask, (1984, 1138), (2144, 1199), 255, -1)  # LO-FI pill
clean = cv2.inpaint(im, mask, 7, cv2.INPAINT_TELEA)

# ---------- 2. remove the blue poster (smooth wall fill + grain) ----------
poster = np.array([[1884, 74], [2172, 74], [2172, 590], [1880, 590]], np.int32)
pm = np.zeros((H, W), np.uint8)
cv2.fillPoly(pm, [poster], 255)
small = cv2.resize(clean, (W // 8, H // 8), interpolation=cv2.INTER_AREA)
small_m = cv2.resize(pm, (W // 8, H // 8), interpolation=cv2.INTER_NEAREST)
small_m = cv2.dilate(small_m, np.ones((3, 3), np.uint8))
filled = cv2.inpaint(small, small_m, 9, cv2.INPAINT_NS)
filled = cv2.GaussianBlur(cv2.resize(filled, (W, H), interpolation=cv2.INTER_CUBIC), (0, 0), 6)
grain = rng.normal(0, 3.2, (H, W, 1)).astype(np.float32)
filled = np.clip(filled.astype(np.float32) + grain, 0, 255)
pm_soft = cv2.GaussianBlur(pm.astype(np.float32) / 255, (0, 0), 3)[..., None]
clean = (clean * (1 - pm_soft) + filled * pm_soft).astype(np.uint8)
wall_light = cv2.GaussianBlur(filled, (0, 0), 25)  # local wall colour, for lighting the frame

# ---------- 3. framed photo ----------
FW, FH = 600, 790  # frame drawn flat at high resolution, then warped onto the wall
frame = np.zeros((FH, FW, 3), np.float32)
frame[:] = (28, 34, 42)  # dark walnut (BGR)
border, mat = 34, 58
frame[border:FH - border, border:FW - border] = (196, 214, 226)  # warm off-white mat
# photo opening
px0, py0, px1, py1 = border + mat, border + mat, FW - border - mat, FH - border - mat - 18
ph = cv2.imread(photo_path)
tw, th = px1 - px0, py1 - py0
s = max(tw / ph.shape[1], th / ph.shape[0])
ph = cv2.resize(ph, (int(ph.shape[1] * s + 1), int(ph.shape[0] * s + 1)), interpolation=cv2.INTER_AREA)
ox, oy = (ph.shape[1] - tw) // 2, max(0, int((ph.shape[0] - th) * 0.25))
frame[py0:py1, px0:px1] = ph[oy:oy + th, ox:ox + tw]
# mat bevel + frame bevel
cv2.rectangle(frame, (px0 - 3, py0 - 3), (px1 + 2, py1 + 2), (225, 236, 242), 3)
cv2.rectangle(frame, (2, 2), (FW - 3, FH - 3), (52, 62, 74), 4)
cv2.line(frame, (border, border), (FW - border, border), (14, 17, 22), 5)
cv2.line(frame, (border, border), (border, FH - border), (14, 17, 22), 5)
# glass: soft diagonal reflection
yy, xx = np.mgrid[0:FH, 0:FW].astype(np.float32)
band = np.exp(-((xx * 0.8 - yy * 0.6 - 60) / 70) ** 2) * 0.10
frame = frame * (1 - band[..., None]) + 255 * band[..., None]

dst = np.float32([[1897, 106], [2150, 109], [2146, 444], [1891, 441]])
src = np.float32([[0, 0], [FW, 0], [FW, FH], [0, FH]])
M = cv2.getPerspectiveTransform(src, dst)
warped = cv2.warpPerspective(frame, M, (W, H), flags=cv2.INTER_AREA)
fmask = cv2.warpPerspective(np.ones((FH, FW), np.float32), M, (W, H), flags=cv2.INTER_LINEAR)

# light the frame like the wall around it (assumed wall albedo ~ warm beige)
wall_albedo = np.array([150, 178, 205], np.float32)
light = np.clip(wall_light / wall_albedo, 0, 1.6)
lit = warped / 255 * light * 255
# soften to the image's look + matching grain
lit = cv2.GaussianBlur(lit, (0, 0), 0.7) + rng.normal(0, 2.5, (H, W, 1))

# drop shadow on the wall
shadow = cv2.warpPerspective(np.ones((FH, FW), np.float32), cv2.getPerspectiveTransform(src, dst + np.float32([9, 13])), (W, H))
shadow = cv2.GaussianBlur(shadow, (0, 0), 9) * 0.5
out = clean.astype(np.float32) * (1 - shadow[..., None])
fm = fmask[..., None]
out = out * (1 - fm) + lit * fm
out = np.clip(out, 0, 255).astype(np.uint8)
cv2.imwrite(os.path.join(out_dir, 'room.jpg'), out, [cv2.IMWRITE_JPEG_QUALITY, 92])

# ---------- 4. effect mask: R = window glass, G = fairy lights, B = city lights ----------
glass = np.zeros((H, W), np.uint8)
for r in [(372, 0, 922, 150), (1012, 0, 1500, 150), (372, 208, 922, 722), (1012, 208, 1503, 722)]:
    cv2.rectangle(glass, r[:2], r[2:], 255, -1)
for r in [(752, 478, 1352, 845), (1338, 552, 1820, 1216), (878, 268, 1038, 478), (1500, 0, 1620, 720)]:
    cv2.rectangle(glass, r[:2], r[2:], 0, -1)
cv2.fillPoly(glass, [np.array([[388, 470], [612, 470], [640, 668], [370, 668]], np.int32)], 0)  # lamp shade
hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
leaves = (hsv[..., 0] > 25) & (hsv[..., 0] < 90) & (hsv[..., 1] > 55) & (hsv[..., 2] > 35)
leaves = cv2.dilate(leaves.astype(np.uint8) * 255, np.ones((7, 7), np.uint8)) > 0
glass[leaves] = 0
glass = cv2.GaussianBlur(glass, (0, 0), 3)

olum = cv2.cvtColor(out, cv2.COLOR_BGR2GRAY).astype(np.float32)
spots = ((olum - cv2.GaussianBlur(olum, (0, 0), 9)) > 38) & (olum > 175)
spots = cv2.dilate(spots.astype(np.uint8) * 255, np.ones((3, 3), np.uint8))
region_fairy = np.zeros((H, W), np.uint8)
region_fairy[0:205, 0:1720] = 255
region_fairy[0:720, 270:345] = 255
region_fairy[0:720, 1595:1700] = 255
fairy = cv2.bitwise_and(spots, region_fairy)
city = cv2.bitwise_and(spots, cv2.threshold(glass, 128, 255, cv2.THRESH_BINARY)[1])
city[0:205] = 0
fairy = cv2.GaussianBlur(fairy, (0, 0), 2.5)
city = cv2.GaussianBlur(city, (0, 0), 2)
fx = cv2.merge([city, fairy, glass])  # BGR -> stored as RGB = (glass, fairy, city)
cv2.imwrite(os.path.join(out_dir, 'room-fx.png'), fx)

# ---------- 5. desktop wallpaper from the rainy city in the window ----------
crop = im[215:600, 1015:1495]
wp = cv2.resize(crop, (1920, 1080), interpolation=cv2.INTER_CUBIC)
wp = cv2.GaussianBlur(wp, (0, 0), 28).astype(np.float32)
# bokeh: enlarge bright points into soft discs
pts = cv2.resize(((cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) > 150) * 255).astype(np.uint8), (1920, 1080))
bok = cv2.GaussianBlur(cv2.dilate(pts, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31))).astype(np.float32), (0, 0), 10)
warm = np.array([110, 175, 255], np.float32)
wp = wp * 1.15 + (bok[..., None] / 255) * warm * 0.55
gy = np.linspace(0, 1, 1080, dtype=np.float32)[:, None, None]
wp = wp * (0.75 + 0.35 * gy) + np.array([28, 14, 4], np.float32) * (1 - gy)  # deeper navy at the top
wp += rng.normal(0, 2, wp.shape)
cv2.imwrite(os.path.join(out_dir, 'wallpaper.jpg'), np.clip(wp, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 88])
print('done', out.shape)
