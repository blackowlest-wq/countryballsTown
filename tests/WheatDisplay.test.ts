// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { WheatDisplay } from "../src/ui/WheatDisplay";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

describe("WheatDisplay", () => {
  it("小麦の種と収穫した小麦を別々に表示する", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(WheatDisplay, {
      wheatSeeds: 9,
      wheat: 3,
    })));

    expect(container.textContent).toContain("小麦の種9");
    expect(container.textContent).toContain("小麦3");
    expect(container.firstElementChild?.getAttribute("aria-label"))
      .toBe("小麦の種 9、小麦 3");

    await act(async () => root.unmount());
    container.remove();
  });
});
