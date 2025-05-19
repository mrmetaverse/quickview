# quickview

A modern, drag-and-drop 3D and 360° viewer for the web, built with Next.js, React Three Fiber, and Vercel.

## Features

- **Drag and drop** or select to upload:
  - 360° images (equirectangular, skyboxes)
  - 3D models (GLTF/GLB, OBJ, FBX, STL, DAE, 3DS)
  - Videos (MP4, WebM, MOV, AVI, MKV, INSV)
  - ZIP files containing a GLTF/GLB and all referenced textures/buffers (full PBR and mesh support)
- **Instant preview** of 360° images, skyboxes, and 3D models
- **Physically correct reflective floor** (toggleable)
- **Background controls**:
  - Room (HDRI environment)
  - Solid color
  - Gradient (top/bottom color)
  - No background (black)
- **Responsive, full-window UI**
- **No server upload**: all processing is in-browser
- **Works with Insta360 and other 360° camera images/videos**
- **Supports PBR materials, textures, and mesh skins**
- **Modern, minimal UI**

## Usage

1. **Run locally:**
   ```bash
   npm install
   npm run dev
   # Open http://localhost:3000
   ```
2. **Upload or drag-and-drop** your 3D model, 360 image, or video anywhere in the window.
3. **For GLTF/GLB with textures:**
   - Zip the model and all referenced textures/buffers together, then drag the ZIP into the window.
   - The viewer will extract and load the model with full PBR/texture support.
4. **Change background** using the dropdown in the top-right.
5. **Toggle the reflective floor** with the checkbox.

## Tech Stack
- Next.js (App Router, TypeScript, Tailwind CSS)
- React Three Fiber & Drei
- Three.js
- JSZip (for ZIP extraction)

## Roadmap / TODO
- Draco-compressed mesh support
- More background presets
- Model transform/scale/position controls
- Mobile UI improvements
- Export/share snapshot

---

MIT License
