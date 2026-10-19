import { connectDB } from "@/lib/mongodb";
import { validateFoodInput, type FoodInput } from "@/lib/mealNutrition";
import { FavoriteFood as FavoriteFoodModel } from "@/models/FavoriteFood";

export type SavedFavoriteFood = FoodInput & {
  id: string;
  createdAt: string;
};

type FavoriteFoodDocument = FoodInput & {
  _id: unknown;
  createdAt: Date;
};

// 화면에서는 식품 입력에 재사용할 값만 받아야 하므로 DB 소유자와 내부 문서 필드는 반환하지 않습니다.
function toFavoriteFood(doc: FavoriteFoodDocument): SavedFavoriteFood {
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
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function getFavoriteFoods(
  userId: string,
): Promise<SavedFavoriteFood[]> {
  await connectDB();
  // 소유자 조건으로 본인 식품 전체를 조회하고 최신순의 일반 객체로 반환합니다.
  const docs = await FavoriteFoodModel.find({ userId })
    .sort({ createdAt: -1, _id: -1 })
    .lean();
  return docs.map((doc) => toFavoriteFood(doc as FavoriteFoodDocument));
}

export async function createFavoriteFood(
  userId: string,
  input: FoodInput,
): Promise<SavedFavoriteFood> {
  const error = validateFoodInput(input);
  if (error) throw new Error(error);
  await connectDB();
  // 허용한 식품 필드만 저장해 폼의 추가 필드로 소유자나 내부 데이터를 덮어쓰지 못하게 합니다.
  const doc = await FavoriteFoodModel.create({
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
  });
  return toFavoriteFood(doc as unknown as FavoriteFoodDocument);
}
