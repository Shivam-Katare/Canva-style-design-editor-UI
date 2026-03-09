import { useEffect, useState } from "react";
import {
  VeltProvider,
  useVeltClient,
  VeltComments,
  VeltCommentsSidebar,
} from "@veltdev/react";
import { FabricProvider } from "./contexts/FabricContext";
import { useEditorStore } from "./store/editorStore";
import { TopBar } from "./components/TopBar";
import { LeftSidebar } from "./components/LeftSidebar";
import { CanvasArea } from "./components/CanvasArea";
import { LayersPanel } from "./components/LayersPanel";
import { ExportModal } from "./components/ExportModal";
import { Toast } from "./components/Toast";
import { User } from "./types/user";

const staticUsers: User[] = [
  {
    userId: "user-1",
    name: "Rick Sanchez",
    email: "rick@rickandmorty.com",
    photoUrl: "https://rickandmortyapi.com/api/character/avatar/1.jpeg",
    organizationId: "org-pixframe",
  },
  {
    userId: "user-2",
    name: "Morty Smith",
    email: "morty@rickandmorty.com",
    photoUrl: "https://rickandmortyapi.com/api/character/avatar/2.jpeg",
    organizationId: "org-pixframe",
  },
];

function AppContent({
  currentUser,
  onSwitchUser,
}: {
  currentUser: User;
  onSwitchUser: (user: User) => void;
}) {
  const { client } = useVeltClient();
  const { theme, setTheme } = useEditorStore();

  useEffect(() => {
    // Apply dark theme class on mount
    setTheme("dark");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!client || !currentUser) return;
      try {
        await client.identify(currentUser);
        await client.setDocument("pixframe-collaborative-canvas", {
          documentName: "Pixframe Design",
        });
      } catch (e) {
        console.error("Velt init error:", e);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, currentUser]);

  // Sync Velt components with the app's dark/light theme
  useEffect(() => {
    if (!client) return;
    client.setDarkMode(theme === "dark");
  }, [client, theme]);

  return (
    <div
      className={`w-full h-screen flex flex-col overflow-hidden select-none ${
        theme === "dark" ? "bg-[#111114]" : "bg-white"
      }`}
    >
      {/* Velt comment pins render over the whole app */}
      <VeltComments shadowDom={false}/>
      <VeltCommentsSidebar shadowDom={false} />

      <TopBar
        currentUser={currentUser}
        staticUsers={staticUsers}
        onSwitchUser={onSwitchUser}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left icon bar + expandable panels */}
        <LeftSidebar />

        {/* Main canvas stage (contains VeltCursor) */}
        <CanvasArea />

        {/* Right layers panel */}
        <LayersPanel />
      </div>

      <ExportModal />
      <Toast />
    </div>
  );
}

export function App() {
  const apiKey = import.meta.env.VITE_VELT_API_KEY;
  const [currentUser, setCurrentUser] = useState<User>(staticUsers[0]);

  useEffect(() => {
    const stored = localStorage.getItem("pixframe-current-user");
    if (stored) {
      const found = staticUsers.find((u) => u.userId === stored);
      if (found) setCurrentUser(found);
    }
  }, []);

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("pixframe-current-user", user.userId);
  };

  return (
    <VeltProvider apiKey={apiKey}>
      <FabricProvider>
        <AppContent currentUser={currentUser} onSwitchUser={handleSwitchUser} />
      </FabricProvider>
    </VeltProvider>
  );
}
