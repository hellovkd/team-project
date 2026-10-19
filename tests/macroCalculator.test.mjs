import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculateMacros,
  validateMacroInput,
  readMacroInput,
  activityLevels,
  macroShares,
} from "../lib/macroCalculator.ts";
import {
  normalizeEmail,
  validEmail,
  validPassword,
  safeReturnTo,
} from "../lib/authValidation.ts";

const male = {
  gender: "male",
  age: 25,
  height: 175,
  weight: 70,
  activityLevel: "moderate",
  goal: "maintain",
};

// 알려진 수치로 중간값 반올림 없이 계산한 최종 정수 결과를 검증합니다.
test("남성 유지: Mifflin–St Jeor, TDEE, 탄단지", () => {
  const result = calculateMacros(male);
  assert.deepEqual(
    [
      result.bmr,
      result.tdee,
      result.targetCalories,
      result.carbs,
      result.protein,
      result.fat,
    ],
    [1674, 2594, 2594, 346, 140, 72],
  );
  assert.equal(result.isFeasible, true);
  assert.deepEqual(result.warnings, []);
});

test("여성 BMR과 light 활동 계수", () => {
  const result = calculateMacros({
    ...male,
    gender: "female",
    age: 30,
    height: 165,
    weight: 60,
    activityLevel: "light",
  });
  assert.equal(result.bmr, 1320);
  assert.equal(result.tdee, 1815);
});

test("모든 활동량 계수 적용", () => {
  for (const [activityLevel, { factor }] of Object.entries(activityLevels)) {
    assert.equal(
      calculateMacros({ ...male, activityLevel }).tdee,
      Math.round(1673.75 * factor),
    );
  }
});

test("감량은 -500, 벌크업은 +400 및 단백질 2.2 g/kg", () => {
  const diet = calculateMacros({ ...male, goal: "diet" });
  const bulk = calculateMacros({ ...male, goal: "bulk" });
  assert.deepEqual(
    [diet.targetCalories, diet.protein, diet.carbs, diet.fat],
    [2094, 140, 253, 58],
  );
  assert.deepEqual(
    [bulk.targetCalories, bulk.protein, bulk.carbs, bulk.fat],
    [2994, 154, 407, 83],
  );
});

test("낮은 열량은 경고하되 수식을 임의로 1200 또는 1500으로 바꾸지 않음", () => {
  const female = calculateMacros({
    ...male,
    gender: "female",
    age: 40,
    weight: 50,
    height: 160,
    activityLevel: "sedentary",
    goal: "diet",
  });
  assert.equal(female.targetCalories, 867);
  assert.match(female.warnings[0], /1,200/);
  const olderMale = calculateMacros({
    ...male,
    age: 60,
    weight: 55,
    height: 160,
    activityLevel: "sedentary",
    goal: "diet",
  });
  assert.equal(olderMale.targetCalories, 1006);
  assert.match(olderMale.warnings[0], /1,500/);
});

test("불가능한 배분은 음수 탄수화물을 권장 식단으로 취급하지 않음", () => {
  const result = calculateMacros({
    ...male,
    gender: "female",
    age: 100,
    height: 100,
    weight: 30,
    activityLevel: "sedentary",
    goal: "diet",
  });
  assert.equal(result.isFeasible, false);
  assert.ok(result.carbs < 0);
  assert.equal(result.warnings.length, 2);
  assert.deepEqual(macroShares(result), [0, 0, 0]);
});

test("부적절한 범위, NaN, Infinity, prototype 키를 서버 검증으로 거부", () => {
  for (const patch of [
    { age: 17 },
    { age: 25.5 },
    { height: 0 },
    { weight: NaN },
    { weight: Infinity },
    { gender: "other" },
    { activityLevel: "__proto__" },
    { goal: "constructor" },
  ]) {
    assert.ok(Object.keys(validateMacroInput({ ...male, ...patch })).length);
    assert.throws(() => calculateMacros({ ...male, ...patch }));
  }
});

test("표시한 정수 g의 비율 합계는 100%", () => {
  for (const goal of ["diet", "maintain", "bulk"]) {
    const shares = macroShares(calculateMacros({ ...male, goal }));
    assert.equal(
      shares.reduce((sum, value) => sum + value, 0),
      100,
    );
    assert.ok(shares.every(Number.isInteger));
  }
});

test("누락 필드와 파일 입력을 정상 숫자로 해석하지 않음", () => {
  const form = new FormData();
  for (const [key, value] of Object.entries(male)) form.set(key, String(value));
  assert.deepEqual(readMacroInput(form), male);
  form.delete("age");
  assert.ok(Number.isNaN(readMacroInput(form).age));
  form.set("age", new Blob(["25"]), "age.txt");
  assert.ok(Number.isNaN(readMacroInput(form).age));
});

// 비밀번호가 bcrypt의 바이트 제한에서 잘리거나 로그인 이동 URL이 외부로 바뀌지 않게 검증합니다.
test("이메일 정규화와 비밀번호 UTF-8 바이트 제한", () => {
  assert.equal(normalizeEmail(" Name@Example.COM "), "name@example.com");
  assert.equal(validEmail("bad-email"), false);
  assert.equal(validPassword("12345678"), true);
  assert.equal(validPassword("가".repeat(24)), true);
  assert.equal(validPassword("가".repeat(25)), false);
  assert.equal(validPassword("x".repeat(73)), false);
});

test("로그인 후 이동은 등록한 내부 경로만 허용", () => {
  for (const path of ["/", "/dashboard", "/meals", "/foods"])
    assert.equal(safeReturnTo(path), path);
  for (const url of [
    "//evil.example",
    "https://evil.example",
    "/\\evil.example",
    undefined,
  ])
    assert.equal(safeReturnTo(url), "/dashboard");
});
