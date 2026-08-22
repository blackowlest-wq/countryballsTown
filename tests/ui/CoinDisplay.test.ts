import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { CoinDisplay } from "../../src/ui/CoinDisplay";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  document.body.replaceChildren();
});

describe("CoinDisplay", () => {
  it.each([
    { coins: 38_346.1, expected: "38,346" },
    { coins: 7.999, expected: "7" },
    { coins: 12, expected: "12" },
    { coins: -0.1, expected: "0" },
  ])("$coinsを$expectedとして表示する", async ({ coins, expected }) => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(CoinDisplay, { coins })));

    expect(container.querySelector(".resource-value")?.textContent).toBe(expected);
    expect(container.querySelector(".resource-pill")?.getAttribute("aria-label"))
      .toBe(`コイン ${expected}`);

    await act(async () => root.unmount());
  });
});
