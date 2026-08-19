import type { CountryDefinition } from "../types/Country";

export const countries: CountryDefinition[] = [
  {
    id: "poland",
    name: "ポーランド",
    flagEmoji: "🇵🇱",
    flagTexture: "/assets/textures/flags/poland.webp",
    flagColors: ["#fffaf2", "#e94f64"],
    flagLayout: "horizontal",
    flagPattern: "horizontal",
    favoriteBuildingIds: ["house", "fountain"],
    unlockedBuildingIds: [],
    accentColor: "#e94f64",
  },
  {
    id: "japan",
    name: "日本",
    flagEmoji: "🇯🇵",
    flagTexture: "/assets/textures/flags/japan.webp",
    flagColors: ["#fffaf2", "#ed5a67"],
    flagLayout: "horizontal",
    flagPattern: "circle",
    favoriteBuildingIds: ["onsen", "torii"],
    unlockedBuildingIds: ["onsen", "torii"],
    accentColor: "#ed5a67",
  },
  {
    id: "italy",
    name: "イタリア",
    flagEmoji: "🇮🇹",
    flagTexture: "/assets/textures/flags/italy.webp",
    flagColors: ["#61a978", "#fffaf2", "#e56a62"],
    flagLayout: "vertical",
    flagPattern: "vertical",
    favoriteBuildingIds: ["pizza-shop"],
    unlockedBuildingIds: ["pizza-shop"],
    accentColor: "#e56a62",
  },
];

export const countriesById = Object.fromEntries(
  countries.map((country) => [country.id, country]),
) as Record<string, CountryDefinition>;

export function getCountryDefinition(countryId: string): CountryDefinition | undefined {
  return countriesById[countryId];
}
