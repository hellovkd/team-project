import { connectDB } from "@/lib/mongodb";
import {
  calculateMealNutrition,
  isValidMealDate,
  validateMealInput,
  type MealInput,
  type Nutrients,
} from "@/lib/mealNutrition";
import { MealRecord as MealRecordModel } from "@/models/MealRecord";

export type SavedMealRecord = MealInput & {
  id: string;
  totals: Nutrients;
  createdAt: string;
};

type MealRecordDocument = MealInput & {
  _id: unknown;
  totals: Nutrients;
  createdAt: Date;
};

// 화면에서 필요한 값만 명시해 Mongoose 문서와 소유자 정보를 직접 노출하지 않습니다.
function toMealRecord(doc: MealRecordDocument): SavedMealRecord {
  return {
    id: String(doc._id),
    name: doc.name,
    baseAmount: doc.baseAmount,
    unit: doc.unit,
    nutrients: {
      calories: doc.nutrients.calories,
      carbs: doc.nutrients.carbs,
      protein: doc.nutrients.protein,
      fat: doc.nutrients.fat,
    },
    amount: doc.amount,
    mealType: doc.mealType,
    date: doc.date,
    totals: {
      calories: doc.totals.calories,
      carbs: doc.totals.carbs,
      protein: doc.totals.protein,
      fat: doc.totals.fat,
    },
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function getMealRecords(
  userId: string,
  date: string,
): Promise<SavedMealRecord[]> {
  if (!isValidMealDate(date))
    throw new Error("식단을 조회할 날짜를 올바르게 선택해주세요.");
  await connectDB();
  // 소유자·날짜 조건으로 조회하며 하루 합계가 누락되지 않도록 개수를 제한하지 않습니다.
  const docs = await MealRecordModel.find({ userId, date })
    .sort({ createdAt: -1, _id: -1 })
    .lean();
  return docs.map((doc) => toMealRecord(doc as MealRecordDocument));
}

export async function createMealRecord(
  userId: string,
  input: MealInput,
): Promise<SavedMealRecord> {
  const error = validateMealInput(input);
  if (error) throw new Error(error);
  // 합계는 전달받지 않고 검증한 기준량 대비 같은 단위로 먹은 양의 비율로 서버에서 다시 계산합니다.
  const totals = calculateMealNutrition(input);
  await connectDB();
  // 클라이언트가 임의의 userId나 totals 필드를 보내도 저장되지 않도록 허용한 값만 직접 매핑합니다.
  const doc = await MealRecordModel.create({
    userId,
    name: input.name.trim(),
    baseAmount: input.baseAmount,
    unit: input.unit,
    nutrients: {
      calories: input.nutrients.calories,
      carbs: input.nutrients.carbs,
      protein: input.nutrients.protein,
      fat: input.nutrients.fat,
    },
    amount: input.amount,
    mealType: input.mealType,
    date: input.date,
    totals: {
      calories: totals.calories,
      carbs: totals.carbs,
      protein: totals.protein,
      fat: totals.fat,
    },
  });
  return toMealRecord(doc as unknown as MealRecordDocument);
}
