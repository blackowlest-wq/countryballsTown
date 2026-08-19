import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { CharacterShowcase } from "./dev/CharacterShowcase";
import { MotionShowcase } from "./dev/MotionShowcase";
import "./styles/global.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element was not found.");

const isCharacterShowcase =
  new URLSearchParams(window.location.search).get("showcase") === "characters";
const isMotionShowcase =
  new URLSearchParams(window.location.search).get("showcase") === "motions";

createRoot(root).render(
  <StrictMode>
    {isCharacterShowcase ? <CharacterShowcase /> : isMotionShowcase ? <MotionShowcase /> : <App />}
  </StrictMode>,
);
