# 2x AI upscale with Real-ESRGAN (x2plus) via spandrel, tiled to keep memory low.
# Usage: upscale.py <model.pth> <in_image> <out_image>
import sys, cv2, numpy as np, torch
from spandrel import ModelLoader

model_path, src, dst = sys.argv[1:4]
dev = 'mps' if torch.backends.mps.is_available() else 'cpu'
model = ModelLoader().load_from_file(model_path).to(dev).eval()
scale = model.scale

img = cv2.imread(src)[:, :, ::-1].astype(np.float32) / 255  # RGB 0..1
H, W = img.shape[:2]
out = np.zeros((H * scale, W * scale, 3), np.float32)
weight = np.zeros((H * scale, W * scale, 1), np.float32)
T, PAD = 384, 24
ramp = lambda n: np.minimum(np.minimum(np.arange(n) + 1, n - np.arange(n)), PAD * scale).astype(np.float32)
with torch.no_grad():
    for y in range(0, H, T):
        for x in range(0, W, T):
            y0, x0 = max(0, y - PAD), max(0, x - PAD)
            y1, x1 = min(H, y + T + PAD), min(W, x + T + PAD)
            tile = torch.from_numpy(np.ascontiguousarray(img[y0:y1, x0:x1].transpose(2, 0, 1)))[None].to(dev)
            res = model(tile).clamp(0, 1)[0].permute(1, 2, 0).cpu().numpy()
            wy, wx = ramp(res.shape[0]), ramp(res.shape[1])
            w = (wy[:, None] * wx[None, :])[..., None]
            out[y0 * scale:y1 * scale, x0 * scale:x1 * scale] += res * w
            weight[y0 * scale:y1 * scale, x0 * scale:x1 * scale] += w
            print(f'tile {y},{x}', flush=True)
out /= np.maximum(weight, 1e-6)
out = out[:, :, ::-1] * 255
# keep some of the original photographic texture so it does not look painted
lanczos = cv2.resize(cv2.imread(src), (W * scale, H * scale), interpolation=cv2.INTER_LANCZOS4).astype(np.float32)
mix = 0.78 * out + 0.22 * lanczos
mix += np.random.default_rng(1).normal(0, 1.8, mix.shape)  # fine film grain
cv2.imwrite(dst, np.clip(mix, 0, 255).astype(np.uint8))
print('upscaled', mix.shape, 'on', dev)
