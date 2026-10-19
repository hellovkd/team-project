import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateMealNutrition,
  getTodayDate,
  isValidMealDate,
  readFoodInput,
  readMealInput,
  remainingNutrition,
  sumNutrition,
  validateFoodInput,
  validateMealInput,
} from "../lib/mealNutrition.ts";

// 실제 식품의 영양값을 주장하는 자료가 아니라 비례 계산을 확인하기 위한 고정 테스트 값입니다.
const meal = {
  name: "테스트 음식",
  baseAmount: 100,
  unit: "g",
  nutrients: { calories: 192, carbs: 20, protein: 10, fat: 8 },
  amount: 150,
  mealType: "breakfast",
  date: "2026-10-20",
};

test("음식별 기준량과 단위에 따라 먹은 양을 비례 계산", () => {
  assert.deepEqual(calculateMealNutrition(meal), { calories: 288, carbs: 30, protein: 15, fat: 12 });
  for (const unit of ["ml", "piece", "serving"]) {
    const input = { ...meal, baseAmount: 2, amount: 1, unit };
    assert.deepEqual(calculateMealNutrition(input), { calories: 96, carbs: 10, protein: 5, fat: 4 });
  }
});

test("여러 끼니의 섭취 합계와 목표 대비 잔여량", () => {
  const other = calculateMealNutrition({
    ...meal,
    nutrients: { calories: 121, carbs: 25, protein: 3, fat: 1 },
    amount: 200,
    mealType: "lunch",
  });
  const consumed = sumNutrition([calculateMealNutrition(meal), other]);
  assert.deepEqual(consumed, { calories: 530, carbs: 80, protein: 21, fat: 14 });
  assert.deepEqual(
    remainingNutrition({ calories: 2594, carbs: 346, protein: 140, fat: 72 }, consumed),
    { calories: 2064, carbs: 266, protein: 119, fat: 58 },
  );
});

test("음식마다 반올림하지 않고 하루 합산 후 표시값만 반올림", () => {
  const small = calculateMealNutrition({
    ...meal,
    nutrients: { calories: 1, carbs: 1, protein: 1, fat: 1 },
    amount: 16.5,
  });
  assert.equal(small.carbs, 0.165);
  assert.equal(sumNutrition([small, small, small]).carbs, 0.5);
});

test("빈 식단은 0, 목표 초과는 음수로 보존", () => {
  const zero = { calories: 0, carbs: 0, protein: 0, fat: 0 };
  assert.deepEqual(sumNutrition([]), zero);
  assert.deepEqual(remainingNutrition(zero, meal.nutrients), { calories: -192, carbs: -20, protein: -10, fat: -8 });
});

test("실제 달력 날짜와 한국 자정 경계", () => {
  for (const date of ["2026-02-29", "2026-13-01", "2026-04-31", "2026-1-1", "", "2101-01-01"])
    assert.equal(isValidMealDate(date), false);
  assert.equal(isValidMealDate("2028-02-29"), true);
  assert.equal(getTodayDate(new Date("2026-10-19T14:59:59Z")), "2026-10-19");
  assert.equal(getTodayDate(new Date("2026-10-19T15:00:00Z")), "2026-10-20");
});

test("기준량·단위·먹은 양과 영양정보 누락 및 변조 거부", () => {
  assert.equal(validateMealInput(meal), undefined);
  assert.equal(validateMealInput({ ...meal, amount: 0.5 }), undefined);
  assert.equal(validateFoodInput({ ...meal, nutrients: { calories: 0, carbs: 0, protein: 0, fat: 0 } }), undefined);
  for (const patch of [
    { baseAmount: 0 }, { baseAmount: Infinity }, { baseAmount: Number.MIN_VALUE }, { unit: "__proto__" },
    { amount: -1 }, { amount: 0 }, { amount: NaN }, { amount: 5001 },
    { mealType: "constructor" }, { date: "2026-02-29" },
    { nutrients: { ...meal.nutrients, carbs: -1 } },
  ]) {
    assert.ok(validateMealInput({ ...meal, ...patch }));
    assert.throws(() => calculateMealNutrition({ ...meal, ...patch }));
  }
  const data = new FormData();
  for (const [key, value] of Object.entries({ ...meal, ...meal.nutrients }))
    if (key !== "nutrients") data.set(key, String(value));
  assert.deepEqual(readMealInput(data), meal);
  data.delete("calories");
  assert.ok(validateFoodInput(readFoodInput(data)));
  data.set("calories", new Blob(["192"]), "calories.txt");
  assert.ok(Number.isNaN(readFoodInput(data).nutrients.calories));
});
