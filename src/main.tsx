import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { CharacterShowcase } from "./dev/CharacterShowcase";
import "./styles/global.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element was not found.");

const isCharacterShowcase =
  new URLSearchParams(window.location.search).get("showcase") === "characters";

createRoot(root).render(
  <StrictMode>
    {isCharacterShowcase ? <CharacterShowcase /> : <App />}
  </StrictMode>,
);
