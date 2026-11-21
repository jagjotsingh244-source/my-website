# Scene image tools

The room is a single pre-rendered image. These scripts produce the files in `public/scene/`:

- `process.py`: removes the baked-in text and the poster, composites the framed photo onto the wall,
  and builds `room-fx.png` (where the rain, fairy-light and city-light effects appear).
- `wallpaper.py`: makes the desktop wallpaper (bokeh city lights) from the finished room image.

To change the photo in the frame, replace `photo.jpg` and run (needs Python with `opencv-python-headless` and `numpy`):

```bash
mkdir -p /tmp/scene && cp tools/scene/source.jpg /tmp/scene/source.jpg
python tools/scene/process.py /tmp/scene tools/scene/photo.jpg public/scene
python tools/scene/wallpaper.py public/scene/room.jpg public/scene/wallpaper.jpg
```
