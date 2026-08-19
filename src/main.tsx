import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { CharacterShowcase } from "./dev/CharacterShowcase";
import { MotionShowcase } from "./dev/MotionShowcase";
import { PizzaShopShowcase } from "./dev/PizzaShopShowcase";
import { ShopVisitorShowcase } from "./dev/ShopVisitorShowcase";
import "./styles/global.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element was not found.");

const showcase = new URLSearchParams(window.location.search).get("showcase");

createRoot(root).render(
  <StrictMode>
    {showcase === "characters" ? (
      <CharacterShowcase />
    ) : showcase === "motions" ? (
      <MotionShowcase />
    ) : showcase === "pizza-shop" ? (
      <PizzaShopShowcase />
    ) : showcase === "shop-visitors" ? (
      <ShopVisitorShowcase />
    ) : (
      <App />
    )}
  </StrictMode>,
);
