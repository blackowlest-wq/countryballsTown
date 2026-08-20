// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { ProduceDisplay } from "../src/ui/ProduceDisplay";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

describe("ProduceDisplay", () => {
  it("小麦の種・小麦・牛乳を別々に表示する", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(ProduceDisplay, {
      wheatSeeds: 9,
      wheat: 3,
      milk: 2,
    })));

    expect(container.textContent).toContain("小麦の種9");
    expect(container.textContent).toContain("小麦3");
    expect(container.textContent).toContain("牛乳2");
    expect(container.firstElementChild?.getAttribute("aria-label"))
      .toBe("小麦の種 9、小麦 3、牛乳 2");

    await act(async () => root.unmount());
    container.remove();
  });
});
