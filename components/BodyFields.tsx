"use client";

import { useState } from "react";
import {
  activityLevels,
  goals,
  type MacroInput,
  type MacroFieldErrors,
} from "@/lib/macroCalculator";

// 회원가입과 계산기는 같은 필드를 재사용하고 일반 라디오와 useState로 선택값을 유지합니다.
export function BodyFields({
  initial,
  errors = {},
}: {
  initial?: MacroInput;
  errors?: MacroFieldErrors;
}) {
  const [values, setValues] = useState({
    gender: initial?.gender ?? "male",
    age: initial ? String(initial.age) : "",
    height: initial ? String(initial.height) : "",
    weight: initial ? String(initial.weight) : "",
    activityLevel: initial?.activityLevel ?? "light",
    goal: initial?.goal ?? "maintain",
  });
  const update = (name: keyof typeof values, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));
  return (
    <div className="body-fields">
      <fieldset className="field-group">
        <legend>성별</legend>
        <div className="radio-options">
          {[
            { value: "male", label: "남성" },
            { value: "female", label: "여성" },
          ].map((option) => (
            <label key={option.value}>
              <input
                type="radio"
                name="gender"
                value={option.value}
                checked={values.gender === option.value}
                onChange={() => update("gender", option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
        {errors.gender ? <p className="field-error">{errors.gender}</p> : null}
      </fieldset>
      <div className="body-number-grid">
        {[
          {
            name: "age" as const,
            label: "나이",
            unit: "세",
            min: 18,
            max: 100,
            step: 1,
            placeholder: "나이",
          },
          {
            name: "height" as const,
            label: "키",
            unit: "cm",
            min: 100,
            max: 250,
            step: 0.1,
            placeholder: "키",
          },
          {
            name: "weight" as const,
            label: "체중",
            unit: "kg",
            min: 30,
            max: 350,
            step: 0.1,
            placeholder: "체중",
          },
        ].map((field) => (
          <div className="field-group" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            <div className="input-with-unit">
              <input
                id={field.name}
                name={field.name}
                type="number"
                min={field.min}
                max={field.max}
                step={field.step}
                value={values[field.name]}
                onChange={(event) => update(field.name, event.target.value)}
                placeholder={field.placeholder}
                required
                aria-invalid={Boolean(errors[field.name])}
                aria-describedby={
                  errors[field.name] ? `${field.name}-error` : undefined
                }
              />
              <span>{field.unit}</span>
            </div>
            {errors[field.name] ? (
              <p className="field-error" id={`${field.name}-error`}>
                {errors[field.name]}
              </p>
            ) : null}
          </div>
        ))}
      </div>
      <div className="field-group">
        <label htmlFor="activityLevel">평소 활동량</label>
        <select
          id="activityLevel"
          name="activityLevel"
          value={values.activityLevel}
          onChange={(event) => update("activityLevel", event.target.value)}
          required
          aria-invalid={Boolean(errors.activityLevel)}
        >
          {Object.entries(activityLevels).map(([key, item]) => (
            <option key={key} value={key}>
              {item.label} · {item.detail}
            </option>
          ))}
        </select>
        {errors.activityLevel ? (
          <p className="field-error">{errors.activityLevel}</p>
        ) : null}
      </div>
      <fieldset className="field-group goal-field">
        <legend>나의 목표</legend>
        <div className="radio-options">
          {Object.entries(goals).map(([key, item]) => (
            <label key={key}>
              <input
                type="radio"
                name="goal"
                value={key}
                checked={values.goal === key}
                onChange={() => update("goal", key)}
              />
              {item.label}
            </label>
          ))}
        </div>
        {errors.goal ? <p className="field-error">{errors.goal}</p> : null}
      </fieldset>
    </div>
  );
}
