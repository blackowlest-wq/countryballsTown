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
    favoriteBuildingIds: ["onsen", "torii", "cherry-tree", "rice-shop", "fish-shop"],
    unlockedBuildingIds: ["onsen", "torii", "rice-shop", "fish-shop"],
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
  {
    id: "china",
    name: "中国",
    flagEmoji: "🇨🇳",
    flagTexture: "/assets/textures/flags/china.webp",
    flagColors: ["#d40000", "#ffde00"],
    flagLayout: "horizontal",
    flagPattern: "circle",
    favoriteBuildingIds: ["chinese-restaurant", "great-wall"],
    unlockedBuildingIds: ["chinese-restaurant", "great-wall"],
    accentColor: "#d40000",
  },
  {
    id: "usa",
    name: "アメリカ",
    flagEmoji: "🇺🇸",
    flagTexture: "/assets/textures/flags/usa.webp",
    flagColors: ["#b22234", "#fffaf2", "#3c3b6e"],
    flagLayout: "horizontal",
    flagPattern: "canton-stripes",
    favoriteBuildingIds: ["burger-shop", "statue-of-liberty"],
    unlockedBuildingIds: ["burger-shop", "statue-of-liberty"],
    accentColor: "#3c3b6e",
  },
];

export const countriesById = Object.fromEntries(
  countries.map((country) => [country.id, country]),
) as Record<string, CountryDefinition>;

export function getCountryDefinition(countryId: string): CountryDefinition | undefined {
  return countriesById[countryId];
}
