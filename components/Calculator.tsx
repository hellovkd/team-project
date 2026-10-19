"use client";

import Link from "next/link";
import { useState } from "react";
import { BodyFields } from "@/components/BodyFields";
import { MacroResult } from "@/components/MacroResult";
import { SubmitButton } from "@/components/SubmitButton";
import {
  calculateMacroAction,
  saveMacroRecordAction,
  type CalculationResponse,
} from "@/lib/actions";
import type { MacroInput } from "@/lib/macroCalculator";

export function Calculator({
  initial,
  signedIn,
}: {
  initial?: MacroInput;
  signedIn: boolean;
}) {
  const [state, setState] = useState<CalculationResponse>({});
  // 서버 액션의 반환값을 useState에 반영해 결과와 입력 오류를 같은 화면에 표시합니다.
  async function handleCalculate(formData: FormData) {
    try {
      setState(await calculateMacroAction(formData));
    } catch {
      setState({
        error: "계산 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.",
      });
    }
  }
  // 입력과 결과만 나란히 보여주며 계산·저장 액션과 검증 흐름은 그대로 유지합니다.
  return (
    <div className="calculator-grid">
      <section
        className="surface-panel input-panel"
        aria-labelledby="input-heading"
      >
        <div className="panel-header">
          <div>
            <h2 id="input-heading">신체 정보</h2>
            {initial ? <p>가입 정보 또는 최근 저장한 조건을 불러왔습니다.</p> : null}
          </div>
        </div>
        <form action={handleCalculate}>
          <BodyFields initial={initial} errors={state.fieldErrors} />
          {state.error ? (
            <p className="notice error-notice" role="alert">
              {state.error}
            </p>
          ) : null}
          <SubmitButton label="계산하기" />
        </form>
      </section>
      <section
        className="surface-panel results-panel"
        aria-label="탄단지 계산 결과"
        aria-live="polite"
      >
        {state.result && state.input ? (
          <>
            <MacroResult result={state.result} input={state.input} />
            <div className="result-actions">
              {state.result.isFeasible ? (
                signedIn ? (
                  <form action={saveMacroRecordAction}>
                    {Object.entries(state.input).map(([name, value]) => (
                      <input
                        key={name}
                        type="hidden"
                        name={name}
                        value={value}
                      />
                    ))}
                    <SubmitButton label="결과 저장하기" />
                  </form>
                ) : (
                  <Link
                    className="primary-button"
                    href="/login?notice=save&next=/"
                  >
                    결과 저장하기
                  </Link>
                )
              ) : null}
              <p>결과는 마지막으로 계산한 입력값을 기준으로 합니다.</p>
            </div>
          </>
        ) : (
          <div className="result-placeholder">
            <h2>계산 결과</h2>
            <p>정보를 입력하고 계산하기를 눌러주세요.</p>
          </div>
        )}
      </section>
    </div>
  );
}
