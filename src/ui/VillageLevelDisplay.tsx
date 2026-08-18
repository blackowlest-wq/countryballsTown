interface VillageLevelDisplayProps {
  level: number;
}

export function VillageLevelDisplay({ level }: VillageLevelDisplayProps): JSX.Element {
  return (
    <div className="level-card">
      <div className="level-badge">{level}</div>
      <div>
        <p className="eyebrow">WORLD SMALL VILLAGE</p>
        <p className="level-title">ちいさな村</p>
        <p className="level-subtitle">Village Lv.{level}</p>
      </div>
    </div>
  );
}
