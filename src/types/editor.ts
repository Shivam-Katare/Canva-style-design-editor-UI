export type PanelId =
  | "image"
  | "text"
  | "background"
  | "crop"
  | "comments"
  | null;
export type Theme = "dark" | "light";
export type LayerType = "image" | "text" | "background";
export type ExportFormat = "png" | "jpeg" | "webp";

export interface CanvasPreset {
  name: string;
  width: number;
  height: number;
}

export const CANVAS_PRESETS: CanvasPreset[] = [
  { name: "Instagram Post", width: 1080, height: 1080 },
  { name: "Instagram Story", width: 1080, height: 1920 },
  { name: "Twitter Header", width: 1500, height: 500 },
  { name: "YouTube Thumbnail", width: 1280, height: 720 },
  { name: "Facebook Cover", width: 820, height: 312 },
  { name: "Custom", width: 1080, height: 1080 },
];

export const GOOGLE_FONTS = [
  "Inter",
  "Playfair Display",
  "Space Grotesk",
  "DM Sans",
  "Syne",
  "Bebas Neue",
  "Abril Fatface",
  "Poppins",
  "Raleway",
  "Montserrat",
  "Oswald",
  "Lora",
  "Merriweather",
  "Dancing Script",
  "Pacifico",
  "Righteous",
  "Permanent Marker",
  "Lobster",
  "Comfortaa",
  "Nunito",
];

export interface LayerMeta {
  id: string;
  type: LayerType;
  name: string;
  visible: boolean;
}

export interface HistoryEntry {
  canvasJson: string;
  layers: LayerMeta[];
}

export interface ToastState {
  message: string;
  visible: boolean;
}

export interface ExportSettings {
  resolution: "original" | "2x" | "4k" | "custom";
  customWidth: number;
  customHeight: number;
  format: ExportFormat;
  quality: number;
}
