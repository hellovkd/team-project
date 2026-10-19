"use client";

import { useState } from "react";
import { FoodFields, emptyFoodFields, type FoodFieldValues } from "@/components/FoodFields";
import { SubmitButton } from "@/components/SubmitButton";
import { createMealAction } from "@/lib/mealActions";
import type { SavedFavoriteFood } from "@/lib/favoriteFoods";
import {
  calculateMealNutrition,
  foodUnits,
  mealTypes,
  validateMealInput,
  type MealInput,
} from "@/lib/mealNutrition";

// useState로 저장한 음식을 입력란에 채우며 실제 저장은 Server Action에서 처리합니다.
export function MealForm({ date, favorites }: { date: string; favorites: SavedFavoriteFood[] }) {
  const [fields, setFields] = useState<FoodFieldValues>(emptyFoodFields);
  const [amount, setAmount] = useState("100");
  const [mealType, setMealType] = useState<MealInput["mealType"]>("breakfast");
  const [favoriteId, setFavoriteId] = useState("");

  function selectFavorite(id: string) {
    setFavoriteId(id);
    const food = favorites.find((item) => item.id === id);
    setFields(food ? {
      name: food.name,
      baseAmount: String(food.baseAmount),
      unit: food.unit,
      calories: String(food.nutrients.calories),
      carbs: String(food.nutrients.carbs),
      protein: String(food.nutrients.protein),
      fat: String(food.nutrients.fat),
    } : emptyFoodFields);
    // 음식마다 1개·200mL 등 기준이 다르므로 불러올 때 먹은 양도 그 기준량으로 맞춥니다.
    setAmount(food ? String(food.baseAmount) : "100");
  }

  const input: MealInput = {
    name: fields.name,
    baseAmount: fields.baseAmount.trim() ? Number(fields.baseAmount) : NaN,
    unit: fields.unit,
    nutrients: {
      calories: fields.calories.trim() ? Number(fields.calories) : NaN,
      carbs: fields.carbs.trim() ? Number(fields.carbs) : NaN,
      protein: fields.protein.trim() ? Number(fields.protein) : NaN,
      fat: fields.fat.trim() ? Number(fields.fat) : NaN,
    },
    amount: amount.trim() ? Number(amount) : NaN,
    mealType,
    date,
  };
  // 미리보기와 저장이 같은 순수 함수를 사용하고, 실제 DB 저장 때 서버가 다시 검증·계산합니다.
  const preview = validateMealInput(input) ? undefined : calculateMealNutrition(input);
  const display = (value: number) => value.toLocaleString("ko-KR", { maximumFractionDigits: 1 });

  return (
    <section className="surface-panel meal-form-panel" aria-labelledby="meal-form-heading">
      {/* 날짜는 페이지 필터에서 보여주므로 이 폼은 기록 입력에 필요한 제목만 둡니다. */}
      <div className="panel-header"><h2 id="meal-form-heading">음식 기록</h2></div>
      <form action={createMealAction} className="meal-form">
        <input type="hidden" name="date" value={date} />
        <div className="meal-select-fields">
          <div className="field-group">
            <label htmlFor="meal-type">끼니</label>
            <select id="meal-type" name="mealType" value={mealType} onChange={(event) => setMealType(event.target.value as MealInput["mealType"])}>
              {Object.entries(mealTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="field-group">
            <label htmlFor="meal-favorite">저장한 음식</label>
            <select id="meal-favorite" value={favoriteId} onChange={(event) => selectFavorite(event.target.value)}>
              <option value="">직접 입력</option>
              {favorites.map((food) => <option key={food.id} value={food.id}>{food.name}</option>)}
            </select>
          </div>
        </div>
        <FoodFields
          values={fields}
          onChange={(next) => { setFields(next); setFavoriteId(""); }}
          idPrefix="meal-food"
        />
        <div className="field-group">
          <label htmlFor="meal-amount">먹은 양</label>
          <div className="input-with-unit">
            <input id="meal-amount" name="amount" type="number" min={0.001} max={5000} step="any" value={amount} onChange={(event) => setAmount(event.target.value)} required />
            <span>{foodUnits[fields.unit]}</span>
          </div>
          <p className="field-hint">먹은 양도 기준과 같은 단위({foodUnits[fields.unit]})로 입력하세요.</p>
        </div>
        {/* 실시간 계산은 그대로 유지하고 결과와 단위만 간결하게 표시합니다. */}
        <div className="meal-preview" aria-live="polite">
          <p>섭취 영양정보</p>
          {preview ? (
            <dl className="meal-preview-values">
              <div><dt>칼로리</dt><dd>{display(preview.calories)} <span>kcal</span></dd></div>
              <div><dt>탄수화물</dt><dd>{display(preview.carbs)} <span>g</span></dd></div>
              <div><dt>단백질</dt><dd>{display(preview.protein)} <span>g</span></dd></div>
              <div><dt>지방</dt><dd>{display(preview.fat)} <span>g</span></dd></div>
            </dl>
          ) : <p className="field-hint">음식과 먹은 양을 입력하면 표시됩니다.</p>}
        </div>
        <SubmitButton label="기록 저장" />
      </form>
    </section>
  );
}
