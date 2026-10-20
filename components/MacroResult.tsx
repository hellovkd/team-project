import {
  macroShares,
  type MacroResult as Result,
  type MacroInput,
  goals,
  activityLevels,
} from "@/lib/macroCalculator";

// 계산기와 기록 상세에서 필수 수치·경고·열량 비율만 같은 형식으로 표시합니다.
export function MacroResult({
  input,
  result,
}: {
  input: MacroInput;
  result: Result;
}) {
  const shares = macroShares(result);
  const macros = [
    {
      key: "carbs",
      name: "탄수화물",
      grams: result.carbs,
      share: shares[0],
    },
    {
      key: "protein",
      name: "단백질",
      grams: result.protein,
      share: shares[1],
    },
    {
      key: "fat",
      name: "지방",
      grams: result.fat,
      share: shares[2],
    },
  ];
  return (
    <div className="macro-result">
      <div className="result-heading">
        <div>
          <h2>계산 결과</h2>
          <p>
            {goals[input.goal].label} · {input.weight} kg ·{" "}
            {activityLevels[input.activityLevel].label}
          </p>
        </div>
      </div>
      <div className="calorie-answer">
        <span>목표 칼로리</span>
        <div>
          <strong>{result.targetCalories.toLocaleString("ko-KR")}</strong>
          <span>kcal</span>
        </div>
      </div>
      <dl className="energy-metrics">
        <div>
          <dt>
            기초대사량 <abbr title="Basal Metabolic Rate">BMR</abbr>
          </dt>
          <dd>
            {result.bmr.toLocaleString("ko-KR")}
            <span>kcal</span>
          </dd>
        </div>
        <div>
          <dt>
            일일 에너지 소비량{" "}
            <abbr title="Total Daily Energy Expenditure">TDEE</abbr>
          </dt>
          <dd>
            {result.tdee.toLocaleString("ko-KR")}
            <span>kcal</span>
          </dd>
        </div>
      </dl>
      {result.warnings.map((warning) => (
        <p className="notice warning-notice" role="alert" key={warning}>
          {warning}
        </p>
      ))}
      {result.isFeasible ? (
        <div className="macro-distribution">
          <div className="section-heading">
            <h3>탄단지 섭취량</h3>
          </div>
          {macros.map((macro) => (
            <div className={`macro-row ${macro.key}`} key={macro.key}>
              <div className="macro-row-label">
                <span>{macro.name}</span>
                <span className="macro-amount">
                  <strong>{macro.grams}</strong> g <small>{macro.share}%</small>
                </span>
              </div>
              <div
                className="macro-track"
                role="progressbar"
                aria-label={`${macro.name} 열량 비율`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={macro.share}
              >
                <span style={{ width: `${macro.share}%` }} />
              </div>
            </div>
          ))}
          <p className="rounding-note">
            모든 소수점 섭취량은 반올림한 기준입니다.
          </p>
        </div>
      ) : (
        <p className="empty-message">
          이 조건에서는 탄단지 배분을 제공할 수 없습니다. 입력값과 목표를
          조정해주세요.
        </p>
      )}
    </div>
  );
}
