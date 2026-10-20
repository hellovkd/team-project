import { BodyFields } from "@/components/BodyFields";
import { MacroResult } from "@/components/MacroResult";
import { SubmitButton } from "@/components/SubmitButton";
import { saveMacroRecordAction } from "@/lib/actions";
import { calculateMacros, type MacroInput } from "@/lib/macroCalculator";

// 별도 클라이언트 계산 상태를 두지 않고 교수님 프로젝트처럼 form action으로 입력을 수정·저장합니다.
export function Calculator({ initial }: { initial?: MacroInput }) {
  const result = initial ? calculateMacros(initial) : undefined;
  return (
    <div className="calculator-grid">
      <section
        className="surface-panel input-panel"
        aria-labelledby="input-heading"
      >
        <div className="panel-header">
          <div>
            <h2 id="input-heading">신체 정보 및 목표 수정</h2>
            <p>
              회원가입 시 입력한 정보(또는 최근 수정한 조건)입니다. 값을 바꾸고
              저장하면 목표 칼로리와 탄단지가 다시 계산됩니다.
            </p>
          </div>
        </div>
        <form action={saveMacroRecordAction}>
          <BodyFields
            key={initial ? JSON.stringify(initial) : "empty"}
            initial={initial}
          />
          <SubmitButton label="입력 정보 수정" />
        </form>
      </section>
      <section
        className="surface-panel results-panel"
        aria-label="내 탄단지 계산 결과"
      >
        {initial && result ? (
          <>
            <MacroResult result={result} input={initial} />
            <div className="result-actions">
              <p>수정한 결과는 아래 기록과 식단 기록의 목표치에 함께 반영됩니다.</p>
            </div>
          </>
        ) : (
          <div className="result-placeholder">
            <h2>계산 결과</h2>
            <p>왼쪽에서 신체 정보와 목표를 입력해 저장해주세요.</p>
          </div>
        )}
      </section>
    </div>
  );
}
