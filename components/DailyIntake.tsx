import { remainingNutrition, type Nutrients } from "@/lib/mealNutrition";

// 목표와 섭취량의 차이를 그대로 표시해 초과한 영양소를 남은 양 0으로 숨기지 않습니다.
export function DailyIntake({ target, consumed }: { target?: Nutrients; consumed: Nutrients }) {
  const remaining = target ? remainingNutrition(target, consumed) : undefined;
  const display = (value: number) => value.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
  return (
    <section className="surface-panel intake-panel" aria-labelledby="intake-heading">
      {/* 계산기 이동은 공통 메뉴에 맡기고 이 영역에는 섭취량 비교만 표시합니다. */}
      <div className="section-heading"><h2 id="intake-heading">하루 섭취량</h2></div>
      <div className="intake-grid">
        {[
          { key: "calories" as const, label: "칼로리", unit: "kcal" },
          { key: "carbs" as const, label: "탄수화물", unit: "g" },
          { key: "protein" as const, label: "단백질", unit: "g" },
          { key: "fat" as const, label: "지방", unit: "g" },
        ].map(({ key, label, unit }) => {
          const goal = target?.[key];
          const rest = remaining?.[key];
          const over = rest !== undefined && rest < 0;
          const percentage = goal && goal > 0 ? Math.min(100, consumed[key] / goal * 100) : 0;
          return (
            <div className={`intake-metric${over ? " intake-over" : ""}`} key={key}>
              <h3>{label}</h3>
              <p className="intake-consumed"><strong>{display(consumed[key])}</strong><span>{unit} 섭취</span></p>
              <dl>
                <div><dt>현재 목표</dt><dd>{goal === undefined ? "—" : `${display(goal)} ${unit}`}</dd></div>
                <div><dt>{over ? "초과" : "남음"}</dt><dd className={over ? "intake-over-value" : undefined}>{rest === undefined ? "—" : `${display(Math.abs(rest))} ${unit}`}</dd></div>
              </dl>
              {goal !== undefined && goal > 0 ? (
                <div className="intake-track" role="progressbar" aria-label={`${label} 목표 대비 섭취량`} aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(consumed[key], goal)} aria-valuetext={`${display(consumed[key])}${unit} 섭취, 목표 ${display(goal)}${unit}${over ? `, ${display(Math.abs(rest!))}${unit} 초과` : ""}`}>
                  <span style={{ width: `${percentage}%` }} />
                </div>
              ) : <div className="intake-track" aria-hidden="true" />}
            </div>
          );
        })}
      </div>
      {!target ? <p className="intake-note">비교할 목표가 없습니다. 계산기에서 목표를 확인해주세요.</p> : null}
      <p className="intake-note">선택한 날의 섭취량을 현재 목표(최근 저장한 조건 또는 가입 정보)와 비교합니다.</p>
    </section>
  );
}
