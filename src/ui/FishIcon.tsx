import type { FishType } from "../game/types/Fish";

interface FishIconProps {
  fishType: FishType;
}

export function FishIcon({ fishType }: FishIconProps): JSX.Element {
  return (
    <svg
      className={`fish-icon-visual fish-icon-${fishType}`}
      viewBox="0 0 64 48"
      aria-hidden="true"
      focusable="false"
      data-fish-type={fishType}
    >
      {renderFish(fishType)}
    </svg>
  );
}

function renderFish(fishType: FishType): JSX.Element {
  switch (fishType) {
    case "mackerel":
      return <Mackerel />;
    case "sea-bream":
      return <SeaBream />;
    case "tuna":
      return <Tuna />;
    case "sardine":
      return <Sardine />;
  }
}

function Sardine(): JSX.Element {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 24c7-10 20-14 35-8 5 2 9 5 12 8-3 3-7 6-12 8-15 6-28 2-35-8Z" fill="#71b5cb" stroke="#397b91" strokeWidth="2" />
      <path d="m50 24 12-10v20L50 24Z" fill="#4f96ad" stroke="#397b91" strokeWidth="2" />
      <path d="M18 17c7 4 15 5 24 3M16 29c8-3 16-4 25-2" fill="none" stroke="#d9f0f1" strokeWidth="2" />
      <path d="m27 13-2-5 7 5M30 35l-2 5 7-5" fill="#5d9eaf" stroke="#397b91" strokeWidth="1.5" />
      <circle cx="17" cy="21" r="2" fill="#243f4a" />
      <path d="M14 24c2 3 4 4 7 4" fill="none" stroke="#397b91" strokeWidth="1.5" />
    </g>
  );
}

function Mackerel(): JSX.Element {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 25c7-11 21-15 37-9 5 2 9 5 12 9-3 4-7 7-12 9-16 6-30 2-37-9Z" fill="#b8d2d5" stroke="#487d88" strokeWidth="2" />
      <path d="m50 25 12-10v20L50 25Z" fill="#6e9ea7" stroke="#487d88" strokeWidth="2" />
      <path d="M13 17c8 3 17 4 27 2M11 22c9 2 18 2 29 0M11 28c10-1 19-1 29 1M14 33c8-3 17-3 26-1" fill="none" stroke="#386773" strokeWidth="2.3" />
      <path d="m27 14-2-6 7 5M31 36l-2 5 8-6" fill="#789fa5" stroke="#487d88" strokeWidth="1.5" />
      <path d="M38 17c4 2 7 5 10 8" fill="none" stroke="#e9f4f1" strokeWidth="2" />
      <circle cx="16" cy="22" r="2" fill="#233d45" />
      <path d="M13 25c2 3 5 4 8 4" fill="none" stroke="#487d88" strokeWidth="1.5" />
    </g>
  );
}

function SeaBream(): JSX.Element {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 25c6-12 18-17 32-13 7 2 12 7 16 13-4 6-9 11-16 13-14 4-26-1-32-13Z" fill="#e98978" stroke="#a94f50" strokeWidth="2" />
      <path d="m50 25 12-11v22L50 25Z" fill="#d66e67" stroke="#a94f50" strokeWidth="2" />
      <path d="m22 14 1-8 4 7 4-9 3 9 6-6-1 10" fill="#e27468" stroke="#a94f50" strokeWidth="1.5" />
      <path d="m24 36 2 7 5-8M34 38l3 6 3-8" fill="#d66e67" stroke="#a94f50" strokeWidth="1.5" />
      <path d="M25 15c-1 5-1 17 1 22M32 13c-1 7-1 20 1 25M39 15c-1 6 0 17 2 21" fill="none" stroke="#c75f5c" strokeWidth="1.8" />
      <path d="M42 20c4 2 6 4 8 7" fill="none" stroke="#ffd2bd" strokeWidth="2" />
      <circle cx="17" cy="22" r="2" fill="#3d3030" />
      <path d="M14 25c2 3 5 4 8 4" fill="none" stroke="#a94f50" strokeWidth="1.5" />
    </g>
  );
}

function Tuna(): JSX.Element {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 25c8-9 20-14 35-11 7 1 12 5 16 11-4 6-9 10-16 11-15 3-27-2-35-11Z" fill="#3f88aa" stroke="#285f7d" strokeWidth="2" />
      <path d="m50 25 12-12v24L50 25Z" fill="#367797" stroke="#285f7d" strokeWidth="2" />
      <path d="M24 15c7 2 14 4 21 4M21 35c8-2 15-3 23-2" fill="none" stroke="#9ed1d8" strokeWidth="2" />
      <path d="m29 14-1-6 7 5M33 36l-2 5 8-6" fill="#337795" stroke="#285f7d" strokeWidth="1.5" />
      <circle cx="16" cy="23" r="2" fill="#203845" />
      <path d="M13 26c2 3 5 4 8 4" fill="none" stroke="#285f7d" strokeWidth="1.5" />
    </g>
  );
}
