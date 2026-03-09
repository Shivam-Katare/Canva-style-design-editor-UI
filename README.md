# Pixframe — Collaborative Design Editor

A real-time collaborative design editor built with React, Fabric.js, Zustand, and Velt for seamless multi-user canvas collaboration — think Canva with live presence, synced canvas state, and inline comments.

---

**Built with:** [Velt SDK](https://velt.dev) · [Velt CRDT](https://docs.velt.dev) · [Fabric.js](https://fabricjs.com) · [Zustand](https://zustand-demo.pmnd.rs) · [React](https://react.dev) · [Vite](https://vitejs.dev) · [Tailwind CSS](https://tailwindcss.com)

---

## Features

### Core Canvas

- **Fabric.js powered canvas** — full object model with move, scale, rotate, and flip
- **Canvas presets** — Instagram Post, Instagram Story, Twitter Header, YouTube Thumbnail, Facebook Cover, or custom size
- **Zoom controls** — zoom in/out with the toolbar or keyboard shortcuts
- **Dark / Light theme** — toggle between modes; synced with Velt's dark mode API

### Layer System

- **Image layers** — upload via drag-and-drop or file picker; HEIC/HEIF auto-converted
- **Text layers** — inline editing with 20+ Google Fonts, size, weight, italic, underline, alignment, letter spacing, line height, and color
- **Background** — solid color swatches, custom hex picker, preset gradients, custom gradient builder with 8 angle presets, repeating SVG patterns (dots, grid, diagonal, crosshatch, waves, triangles, hexagons, noise), or a full-canvas background image
- **Crop** — free or aspect-ratio locked (1:1, 4:3, 16:9, 3:4, 9:16) cropping for image layers
- **Layer panel** — reorder layers via drag-and-drop, toggle visibility, delete, rename

### Undo / Redo

- Up to 50-step undo/redo history
- Keyboard shortcuts: `Ctrl+Z` / `Ctrl+Shift+Z`

### Export

- Export canvas as **PNG**, **JPEG**, or **WebP**
- Configurable export quality and scale (1×, 2×, 3×)

### Collaboration (Velt)

- **Live Presence** — see other users' avatars and cursors on the canvas in real time
- **CRDT Canvas Sync** — every canvas change (objects, backgrounds, layer order, visibility) is synced conflict-free to all peers via `useVeltCrdtStore`
- **Comments** — click anywhere on the canvas to leave a pinned comment; comment sidebar for a full overview
- **Notifications** — bell icon notifies users of new comments and activity
- **User switcher** — switch between hardcoded users (Rick Sanchez / Morty Smith) from the top bar to simulate multi-user sessions

---

## Velt Integration

Velt makes real-time collaboration drop-in simple. The entire collaboration stack — presence, comments, notifications, and live state sync — was wired up in minutes using the [Velt plugin](https://docs.velt.dev/get-started/plugins).

### How it works

**1. Provider setup**

```tsx
<VeltProvider apiKey={VITE_VELT_API_KEY}>
  <FabricProvider>
    <AppContent />
  </FabricProvider>
</VeltProvider>
```

**2. User identification & document context**

```ts
await client.identify(currentUser);
await client.setDocument("pixframe-collaborative-canvas", {
  documentName: "Pixframe Design",
});
```

**3. CRDT canvas sync — the single hook that keeps every peer in sync**

```ts
const { value, update } = useVeltCrdtStore<string>({
  id: "pixframe-canvas-state",
  type: "text",
  initialValue: "",
});
```

Every canvas mutation serialises the Fabric canvas to JSON and pushes it into the CRDT store. Peers receive the update, deserialise it, and reload their canvas — all conflict-free via Yjs under the hood.

**4. Presence & Comments — just drop in the components**

```tsx
<VeltComments shadowDom={false} />
<VeltCommentsSidebar shadowDom={false} />
```

That's it. No backend, no websocket boilerplate.

---

## Project Structure

```
pixframe/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── src/
│   ├── App.tsx                        # VeltProvider, FabricProvider, user switcher
│   ├── index.tsx                      # React entry point
│   ├── index.css                      # Global styles
│   ├── components/
│   │   ├── TopBar.tsx                 # Toolbar — undo/redo, zoom, canvas preset, user switcher, export
│   │   ├── LeftSidebar.tsx            # Icon bar — switch between panels
│   │   ├── CanvasArea.tsx             # Fabric canvas + CRDT wiring + VeltCursor
│   │   ├── LayersPanel.tsx            # Right panel — layer list, reorder, visibility, delete
│   │   ├── ExportModal.tsx            # Export dialog — format, quality, scale
│   │   ├── Toast.tsx                  # Ephemeral notifications
│   │   └── panels/
│   │       ├── TextPanel.tsx          # Font family, size, weight, style, color, spacing
│   │       ├── ImagePanel.tsx         # Upload, opacity, flip, replace
│   │       ├── BackgroundPanel.tsx    # Solid, gradient, image, pattern backgrounds
│   │       ├── CropPanel.tsx          # Aspect-ratio crop controls
│   │       └── CommentsPanel.tsx      # Velt comment mode toggle
│   ├── contexts/
│   │   ├── FabricContext.tsx          # Shared canvas ref + CRDT push refs
│   │   └── EditorContext.tsx
│   ├── hooks/
│   │   └── useCollaborativeEditor.ts  # CRDT ↔ Fabric bridge (push + apply snapshot)
│   ├── store/
│   │   └── editorStore.ts             # Zustand — layers, history, theme, export settings
│   └── types/
│       ├── editor.ts                  # Layer types, canvas presets, Google Fonts list
│       └── user.ts                    # User type for Velt identity
└── .env                               # VITE_VELT_API_KEY
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Velt API key from the [Velt Dashboard](https://console.velt.dev)

### Installation

```bash
git clone https://github.com/Studio1HQ/Canva-style-design-editor-UI.git
cd Canva-style-design-editor-UI
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_VELT_API_KEY=your_velt_api_key_here
```

### Run the Dev Server

```bash
npm run dev
```

Open your browser at `http://localhost:5173`

---

## Testing Real-Time Collaboration

1. Open **two browser windows** (or use an incognito window alongside your main browser)
2. Navigate to `http://localhost:5173` in both
3. Switch users using the avatar dropdown in the top bar:
   - **Window A** — keep as Rick Sanchez (default)
   - **Window B** — switch to Morty Smith
4. Test real-time features:
   - Add an image or text in one window → it appears in the other
   - Move, resize, or rotate an object → positions sync live
   - Change font, color, or background → updates reflect instantly
   - Toggle layer visibility or reorder layers → synced across peers
   - Click the comment icon and drop a comment pin → visible to both users
   - Watch the presence avatars and cursor dots track each user

---

## User Switching

Click the avatar in the top-right corner of the top bar to switch between:

| User         | Email                  |
| ------------ | ---------------------- |
| Rick Sanchez | rick@rickandmorty.com  |
| Morty Smith  | morty@rickandmorty.com |

---

## Keyboard Shortcuts

| Shortcut               | Action                   |
| ---------------------- | ------------------------ |
| `Ctrl+Z`               | Undo                     |
| `Ctrl+Shift+Z`         | Redo                     |
| `Delete` / `Backspace` | Delete selected layer    |
| `Ctrl+D`               | Duplicate selected layer |

---

## Technologies

| Library                           | Purpose                                            |
| --------------------------------- | -------------------------------------------------- |
| React 18                          | UI framework                                       |
| Vite 5                            | Build tool & dev server                            |
| TypeScript                        | Type safety                                        |
| Fabric.js 7                       | Canvas engine — objects, transforms, serialisation |
| Velt SDK (`@veltdev/react`)       | Presence, comments, notifications                  |
| Velt CRDT (`@veltdev/crdt-react`) | Conflict-free canvas state sync (Yjs)              |
| Zustand                           | Global editor state — layers, history, theme       |
| Tailwind CSS                      | Utility-first styling                              |
| react-colorful                    | Hex color pickers                                  |
| @dnd-kit                          | Drag-and-drop layer reordering                     |
| jsPDF                             | PDF export                                         |
| heic2any                          | HEIC/HEIF image conversion                         |
| lucide-react                      | Icons                                              |

---

## Architecture

### State Management

Zustand (`editorStore`) owns all editor state:

- Active canvas size and zoom level
- `LayerMeta[]` — the ordered list of layers with id, type, name, visibility
- Undo/redo history stack (up to 50 entries)
- Active panel, export settings, toast state, theme

### Real-Time Collaboration

`useCollaborativeEditor` (in `hooks/`) bridges Fabric.js and the Velt CRDT store:

- **Push**: On any canvas mutation, serialise with `canvas.toObject(["data"])` and push `{ json, layers, canvasSize }` to the CRDT store (debounced 150ms for continuous changes like dragging; immediate for discrete actions like delete)
- **Apply**: When the CRDT store delivers a remote snapshot, set `isRemoteUpdate = true`, call `canvas.loadFromJSON`, restore layer visibility, and update Zustand — then clear the flag after two animation frames so React effects don't echo the change back

### Component Hierarchy

```
VeltProvider
  └── FabricProvider
        └── AppContent
              ├── VeltComments          ← comment pins over the whole canvas
              ├── VeltCommentsSidebar   ← slide-in sidebar
              ├── TopBar                ← undo/redo, zoom, preset, user switcher, export
              ├── LeftSidebar           ← panel switcher (Text, Image, Background, Crop, Comments)
              ├── CanvasArea            ← Fabric canvas + VeltCursor + CRDT hook
              │     └── useCollaborativeEditor
              ├── LayersPanel           ← layer list, drag-to-reorder, visibility, delete
              ├── ExportModal
              └── Toast
```