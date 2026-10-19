// 서버 계산, 입력 폼, DB 스키마가 동일한 선택값을 사용하도록 한곳에 정의합니다.
export const activityLevels = {
  sedentary: {
    label: "거의 운동하지 않음",
    detail: "대부분 앉아서 생활",
    factor: 1.2,
  },
  light: { label: "가벼운 운동", detail: "주 1–3회", factor: 1.375 },
  moderate: { label: "보통 운동", detail: "주 3–5회", factor: 1.55 },
  active: { label: "적극적인 운동", detail: "주 6–7회", factor: 1.725 },
  very_active: {
    label: "매우 격렬한 운동",
    detail: "운동선수 수준",
    factor: 1.9,
  },
} as const;

export const goals = {
  diet: {
    label: "체지방 감량",
    detail: "유지 열량에서 −500 kcal",
    adjustment: -500,
  },
  maintain: {
    label: "체중 유지",
    detail: "현재 에너지 균형 유지",
    adjustment: 0,
  },
  bulk: {
    label: "근육량 증가",
    detail: "유지 열량에서 +400 kcal",
    adjustment: 400,
  },
} as const;

export type MacroInput = {
  gender: "male" | "female";
  age: number;
  height: number;
  weight: number;
  activityLevel: keyof typeof activityLevels;
  goal: keyof typeof goals;
};

export type MacroResult = {
  bmr: number;
  tdee: number;
  targetCalories: number;
  carbs: number;
  protein: number;
  fat: number;
  warnings: string[];
  isFeasible: boolean;
};

export type MacroFieldErrors = Partial<Record<keyof MacroInput, string>>;

// 입력 범위는 성인용 계산기의 지원 범위이며 생리학적 정상 범위를 뜻하지 않습니다.
export function validateMacroInput(input: MacroInput): MacroFieldErrors {
  const errors: MacroFieldErrors = {};
  if (input.gender !== "male" && input.gender !== "female")
    errors.gender = "계산에 사용할 성별을 선택해주세요.";
  if (!Number.isInteger(input.age) || input.age < 18 || input.age > 100)
    errors.age = "나이는 만 18~100세의 정수로 입력해주세요.";
  if (
    !Number.isFinite(input.height) ||
    input.height < 100 ||
    input.height > 250
  )
    errors.height = "키는 100~250 cm로 입력해주세요.";
  if (!Number.isFinite(input.weight) || input.weight < 30 || input.weight > 350)
    errors.weight = "체중은 30~350 kg으로 입력해주세요.";
  if (!Object.hasOwn(activityLevels, input.activityLevel))
    errors.activityLevel = "활동량을 선택해주세요.";
  if (!Object.hasOwn(goals, input.goal)) errors.goal = "목표를 선택해주세요.";
  return errors;
}

// 외부 요청에서 누락된 숫자나 파일이 전달되어도 0으로 오인하지 않도록 파싱합니다.
export function readMacroInput(data: Pick<FormData, "get">): MacroInput {
  const text = (key: string) => {
    const value = data.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  const number = (key: string) => (text(key) ? Number(text(key)) : NaN);
  return {
    gender: text("gender") as MacroInput["gender"],
    age: number("age"),
    height: number("height"),
    weight: number("weight"),
    activityLevel: text("activityLevel") as MacroInput["activityLevel"],
    goal: text("goal") as MacroInput["goal"],
  };
}

export function calculateMacros(input: MacroInput): MacroResult {
  const errors = validateMacroInput(input);
  if (Object.keys(errors).length)
    throw new Error(Object.values(errors).join(" "));

  // 중간 계산에서 반올림하지 않아 BMR의 오차가 TDEE와 목표 열량으로 누적되지 않습니다.
  const bmr =
    10 * input.weight +
    6.25 * input.height -
    5 * input.age +
    (input.gender === "male" ? 5 : -161);
  const tdee = bmr * activityLevels[input.activityLevel].factor;
  const targetCalories = tdee + goals[input.goal].adjustment;
  const protein = input.weight * (input.goal === "bulk" ? 2.2 : 2);
  const fat = (targetCalories * 0.25) / 9;
  const carbs = (targetCalories - protein * 4 - fat * 9) / 4;

  const warnings: string[] = [];
  const minimum = input.gender === "female" ? 1200 : 1500;
  // 낮은 목표 열량의 임계값은 경고에만 사용하고 계산 결과를 임의로 보정하지 않습니다.
  if (targetCalories < minimum)
    warnings.push(
      `계산된 목표 열량이 ${minimum.toLocaleString("ko-KR")} kcal 미만입니다. 과도한 섭취 제한을 피하고 전문가와 목표를 상의해주세요.`,
    );
  const isFeasible = targetCalories > 0 && carbs >= 0;
  if (!isFeasible)
    warnings.push(
      "이 조건에서는 단백질과 지방을 배정한 뒤 남는 열량이 부족합니다. 이 결과를 식단으로 사용하지 말고 목표와 입력값을 다시 확인해주세요.",
    );

  // 최종 결과만 Math.round로 정수화합니다. 각 g의 합산 열량에는 반올림 차이가 생길 수 있습니다.
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    carbs: Math.round(carbs),
    protein: Math.round(protein),
    fat: Math.round(fat),
    warnings,
    isFeasible,
  };
}

// 화면에 실제 표시한 정수 g를 기준으로 비율을 계산하고 최대 나머지 방식으로 합계를 100에 맞춥니다.
export function macroShares(
  result: Pick<MacroResult, "carbs" | "protein" | "fat">,
) {
  const calories = [result.carbs * 4, result.protein * 4, result.fat * 9];
  const total = calories.reduce((sum, value) => sum + value, 0);
  if (total <= 0 || calories.some((value) => value < 0)) return [0, 0, 0];
  const raw = calories.map((value) => (value / total) * 100);
  const shares = raw.map(Math.floor);
  const order = raw
    .map((value, index) => ({ index, remainder: value - shares[index] }))
    .sort((a, b) => b.remainder - a.remainder);
  const remaining = 100 - shares.reduce((sum, value) => sum + value, 0);
  for (let index = 0; index < remaining; index++) shares[order[index].index]++;
  return shares;
}
