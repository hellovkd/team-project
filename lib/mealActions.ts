"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { createMealRecord } from "@/lib/meals";
import { createFavoriteFood } from "@/lib/favoriteFoods";
import {
  getTodayDate,
  isValidMealDate,
  readFoodInput,
  readMealInput,
  validateFoodInput,
  validateMealInput,
} from "@/lib/mealNutrition";

export async function createMealAction(formData: FormData) {
  const user = await getCurrentUser();
  // 폼의 userId를 신뢰하지 않고 기존 세션 조회 함수가 확인한 계정에만 기록합니다.
  if (!user) redirect("/login?next=/meals");
  const input = readMealInput(formData);
  const date = isValidMealDate(input.date) ? input.date : getTodayDate();
  if (validateMealInput(input)) redirect(`/meals?date=${date}&error=input`);
  try {
    await createMealRecord(user.id, input);
  } catch (error) {
    // 연결 주소나 입력한 개인정보를 로그로 남기지 않고 오류 종류만 확인합니다.
    console.error("식단 저장 실패:", error instanceof Error ? error.name : "UnknownError");
    redirect(`/meals?date=${date}&error=database`);
  }
  // 저장 후 목록을 재검증하고 이동해 일일 합계에 새 식사를 반영합니다.
  revalidatePath("/meals");
  redirect(`/meals?date=${date}&notice=saved`);
}

export async function createFavoriteFoodAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/foods");
  const input = readFoodInput(formData);
  if (validateFoodInput(input)) redirect("/foods?error=input");
  try {
    await createFavoriteFood(user.id, input);
  } catch (error) {
    console.error("음식 저장 실패:", error instanceof Error ? error.name : "UnknownError");
    redirect("/foods?error=database");
  }
  // 음식 등록은 섭취 기록과 구분합니다. 식단에 추가할 때만 하루 합계에 포함됩니다.
  revalidatePath("/foods");
  revalidatePath("/meals");
  redirect("/foods?notice=saved");
}
