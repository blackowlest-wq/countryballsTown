import { getCountryDefinition } from "../game/data/countries";
import { getResidentRequestDefinition } from "../game/data/residentRequests";
import { useGameStore } from "../store/gameStore";
import { formatCoinAmount } from "../utils/coinFormatting";

export function ResidentRequestCard(): JSX.Element | null {
  const activeRequest = useGameStore((store) => store.game.activeResidentRequest);
  if (!activeRequest) return null;

  const definition = getResidentRequestDefinition(activeRequest.definitionId);
  if (!definition) return null;
  const country = getCountryDefinition(definition.countryId);
  const progressPercent = Math.min(
    100,
    (activeRequest.progress / definition.goal.target) * 100,
  );
  const progressDisplay = formatCoinAmount(activeRequest.progress);
  const rewardDisplay = formatCoinAmount(definition.rewardCoins);
  const targetDisplay = definition.goal.type === "earn-coins"
    ? formatCoinAmount(definition.goal.target)
    : definition.goal.target;

  return (
    <section className="request-card" aria-label={`${country?.name ?? "住民"}のお願い`}>
      <div className="request-speaker">
        <span
          className={`request-flag request-flag-${country?.id ?? "default"}`}
          role="img"
          aria-label={`${country?.name ?? "住民"}の国旗`}
        />
        <div>
          <p className="request-label">{country?.name ?? "住民"}のお願い</p>
          <p className="request-message">「{definition.message}」</p>
        </div>
      </div>
      <div className="request-progress-row">
        <span>{definition.goal.progressLabel}</span>
        <strong>{progressDisplay}/{targetDisplay}</strong>
        <span className="request-reward">✦ +{rewardDisplay}</span>
      </div>
      <div className="request-progress-track" aria-hidden="true">
        <span style={{ width: `${progressPercent}%` }} />
      </div>
    </section>
  );
}
