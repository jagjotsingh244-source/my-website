# Jagjot Singh — Portfolio

An interactive portfolio: a cosy rainy-night room where clicking the iMac zooms into a desktop with my projects, resume and contact info.

Live: https://jagjotsingh244-source.github.io/my-website/

Built with React, a small WebGL shader (rain on the window, twinkling lights) and Vite. Deployed on Vercel and GitHub Pages.

## Update the content

All text, projects and resume entries live in [`src/data/content.js`](src/data/content.js).
The framed photo on the wall is part of the room image; see [`tools/scene`](tools/scene) to change it.

To offer a resume download, add `public/resume.pdf` and set `resumePdf: 'resume.pdf'`.

## Run locally

```bash
npm install
npm run dev
```

Pushing to `main` redeploys the site automatically.

## Credits

Room artwork based on the scene from [felixrieseberg.com](https://felixrieseberg.com), used with the owner's permission.
