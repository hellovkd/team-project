// 음식별 기준량과 단위를 저장해 g, mL, 개, 인분 단위의 영양정보를 그대로 사용할 수 있습니다.
export type Nutrients = {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
};

export const foodUnits = { g: "g", ml: "mL", piece: "개", serving: "인분" } as const;
export type FoodInput = {
  name: string;
  baseAmount: number;
  unit: keyof typeof foodUnits;
  nutrients: Nutrients;
};
export const mealTypes = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
} as const;
export type MealInput = FoodInput & {
  amount: number;
  mealType: keyof typeof mealTypes;
  date: string;
};

// 날짜를 문자열로 저장하면 서버의 시간대와 관계없이 사용자가 선택한 식사일을 조회할 수 있습니다.
export function isValidMealDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  if (year < 2000 || year > 2100) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// 배포 서버의 UTC 날짜 대신 한국 날짜를 사용해 자정 전후의 식사일이 바뀌지 않게 합니다.
export function getTodayDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function readFoodInput(data: Pick<FormData, "get">): FoodInput {
  const text = (name: string) => {
    const value = data.get(name);
    return typeof value === "string" ? value.trim() : "";
  };
  // 빠진 영양값은 0으로 채우지 않아 실제 0g과 누락 입력을 구분합니다.
  const number = (name: string) => (text(name) ? Number(text(name)) : NaN);
  return {
    name: text("name"),
    baseAmount: number("baseAmount"),
    unit: text("unit") as FoodInput["unit"],
    nutrients: {
      calories: number("calories"),
      carbs: number("carbs"),
      protein: number("protein"),
      fat: number("fat"),
    },
  };
}

export function readMealInput(data: Pick<FormData, "get">): MealInput {
  const food = readFoodInput(data);
  const amount = data.get("amount");
  const date = data.get("date");
  const mealType = data.get("mealType");
  return {
    ...food,
    amount:
      typeof amount === "string" && amount.trim() ? Number(amount) : NaN,
    date: typeof date === "string" ? date.trim() : "",
    mealType: (typeof mealType === "string" ? mealType : "") as MealInput["mealType"],
  };
}

export function validateFoodInput(input: FoodInput): string | undefined {
  if (!input.name.trim() || input.name.trim().length > 80)
    return "음식 이름은 1~80자로 입력해주세요.";
  if (!Number.isFinite(input.baseAmount) || input.baseAmount <= 0 || input.baseAmount > 5000)
    return "영양정보의 기준량은 0 초과, 5,000 이하로 입력해주세요.";
  if (!Object.hasOwn(foodUnits, input.unit)) return "기준 단위를 선택해주세요.";
  const { calories, carbs, protein, fat } = input.nutrients;
  if ([calories, carbs, protein, fat].some((value) => !Number.isFinite(value) || value < 0 || value > 100000))
    return "기준량에 해당하는 칼로리와 탄단지를 0~100,000 범위의 숫자로 입력해주세요.";
  return undefined;
}

export function validateMealInput(input: MealInput): string | undefined {
  const foodError = validateFoodInput(input);
  if (foodError) return foodError;
  if (!Number.isFinite(input.amount) || input.amount <= 0 || input.amount > 5000)
    return "먹은 양은 0 초과, 5,000 이하로 입력해주세요.";
  if (!Object.hasOwn(mealTypes, input.mealType)) return "끼니를 선택해주세요.";
  if (!isValidMealDate(input.date)) return "식사 날짜는 2000~2100년의 실제 날짜로 입력해주세요.";
  // 직접 요청으로 극단적으로 작은 기준량을 보내도 무한대·NaN 결과를 만들지 못하게 합니다.
  const ratio = input.amount / input.baseAmount;
  if (!Number.isFinite(ratio) || Object.values(input.nutrients).some((value) => !Number.isFinite(value * ratio)))
    return "기준량과 먹은 양의 차이가 너무 큽니다. 입력한 양을 확인해주세요.";
  return undefined;
}

export function calculateMealNutrition(input: MealInput): Nutrients {
  const error = validateMealInput(input);
  if (error) throw new Error(error);
  // 저장할 섭취량은 서버에서 다시 계산합니다. 각 음식에서 반올림하면 하루 합계에 오차가 쌓입니다.
  // 기준이 200mL인 우유를 100mL 먹으면 0.5배, 1개 기준 달걀을 2개 먹으면 2배입니다.
  // 단위 변환이나 밀도를 추정하지 않고 같은 단위의 양끼리만 나눕니다.
  const ratio = input.amount / input.baseAmount;
  return {
    calories: input.nutrients.calories * ratio,
    carbs: input.nutrients.carbs * ratio,
    protein: input.nutrients.protein * ratio,
    fat: input.nutrients.fat * ratio,
  };
}

const roundDisplay = (value: number) => Math.round(value * 10) / 10;

export function sumNutrition(items: Nutrients[]): Nutrients {
  const total = items.reduce(
    (sum, item) => ({
      calories: sum.calories + item.calories,
      carbs: sum.carbs + item.carbs,
      protein: sum.protein + item.protein,
      fat: sum.fat + item.fat,
    }),
    { calories: 0, carbs: 0, protein: 0, fat: 0 },
  );
  // 하루 전체를 더한 뒤 표시값만 소수 첫째 자리로 반올림합니다.
  return {
    calories: roundDisplay(total.calories),
    carbs: roundDisplay(total.carbs),
    protein: roundDisplay(total.protein),
    fat: roundDisplay(total.fat),
  };
}

export function remainingNutrition(target: Nutrients, consumed: Nutrients): Nutrients {
  // 목표 초과를 0으로 숨기지 않고 음수로 반환해 화면에서 초과량을 구분합니다.
  return {
    calories: roundDisplay(target.calories - consumed.calories),
    carbs: roundDisplay(target.carbs - consumed.carbs),
    protein: roundDisplay(target.protein - consumed.protein),
    fat: roundDisplay(target.fat - consumed.fat),
  };
}
