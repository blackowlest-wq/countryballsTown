// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { MilkDisplay } from "../src/ui/MilkDisplay";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

describe("MilkDisplay", () => {
  it("右上の資源欄には牛乳だけを表示する", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(MilkDisplay, { milk: 2 })));

    expect(container.textContent).toContain("牛乳2");
    expect(container.textContent).not.toContain("小麦");
    expect(container.firstElementChild?.getAttribute("aria-label")).toBe("牛乳 2");

    await act(async () => root.unmount());
    container.remove();
  });
});
