"use client";

import { useState } from "react";
import { foodUnits, type FoodInput } from "@/lib/mealNutrition";

export type FoodFieldValues = {
  name: string;
  baseAmount: string;
  unit: FoodInput["unit"];
  calories: string;
  carbs: string;
  protein: string;
  fat: string;
};

// 숫자를 문자열로 관리하면 입력 중 빈 칸과 실제 0g을 구분할 수 있습니다.
export const emptyFoodFields: FoodFieldValues = {
  name: "",
  baseAmount: "100",
  unit: "g",
  calories: "",
  carbs: "",
  protein: "",
  fat: "",
};

// 기준량과 단위를 함께 입력받아 제품의 1개·200mL 등 실제 영양성분표를 그대로 사용할 수 있습니다.
export function FoodFields({
  values,
  onChange,
  idPrefix = "food",
}: {
  values?: FoodFieldValues;
  onChange?: (values: FoodFieldValues) => void;
  idPrefix?: string;
}) {
  const [localValues, setLocalValues] = useState(emptyFoodFields);
  const fields = values ?? localValues;
  const update = <K extends keyof FoodFieldValues>(name: K, value: FoodFieldValues[K]) => {
    const next = { ...fields, [name]: value };
    if (onChange) onChange(next);
    else setLocalValues(next);
  };

  return (
    <div className="food-fields">
      <div className="field-group">
        <label htmlFor={`${idPrefix}-name`}>음식 이름</label>
        <input
          id={`${idPrefix}-name`}
          name="name"
          value={fields.name}
          onChange={(event) => update("name", event.target.value)}
          maxLength={80}
          placeholder="예: 현미밥"
          required
        />
      </div>
      <div className="food-basis-fields">
        <div className="field-group">
          <label htmlFor={`${idPrefix}-base-amount`}>영양정보의 기준량</label>
          <input id={`${idPrefix}-base-amount`} name="baseAmount" type="number" min={0.001} max={5000} step="any" value={fields.baseAmount} onChange={(event) => update("baseAmount", event.target.value)} required />
        </div>
        <div className="field-group">
          <label htmlFor={`${idPrefix}-unit`}>기준 단위</label>
          <select id={`${idPrefix}-unit`} name="unit" value={fields.unit} onChange={(event) => update("unit", event.target.value as FoodInput["unit"])}>
            {Object.entries(foodUnits).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </div>
      {/* 긴 예시 대신 기준량 안내만 두고, 각 영양소의 단위는 입력란 옆에 유지합니다. */}
      <fieldset className="field-group">
        <legend>영양정보</legend>
        <p className="field-hint" id={`${idPrefix}-nutrition-hint`}>
          기준량에 해당하는 영양정보를 입력하세요.
        </p>
        <div className="food-nutrient-fields">
          {[
            { key: "calories" as const, label: "칼로리", unit: "kcal" },
            { key: "carbs" as const, label: "탄수화물", unit: "g" },
            { key: "protein" as const, label: "단백질", unit: "g" },
            { key: "fat" as const, label: "지방", unit: "g" },
          ].map((field) => (
            <div className="field-group" key={field.key}>
              <label htmlFor={`${idPrefix}-${field.key}`}>{field.label}</label>
              <div className="input-with-unit">
                <input
                  id={`${idPrefix}-${field.key}`}
                  name={field.key}
                  type="number"
                  min={0}
                  max={100000}
                  step="any"
                  value={fields[field.key]}
                  onChange={(event) => update(field.key, event.target.value)}
                  aria-describedby={`${idPrefix}-nutrition-hint`}
                  placeholder="0"
                  required
                />
                <span>{field.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
