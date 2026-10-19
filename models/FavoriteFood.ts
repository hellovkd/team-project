import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

// 즐겨찾기는 식품에 표시된 기준량·단위의 영양값을 보관하고 실제 먹은 양은 식단에서 입력합니다.
const nutrientsSchema = new Schema(
  {
    calories: { type: Number, required: true, min: 0, max: 100000, validate: Number.isFinite },
    carbs: { type: Number, required: true, min: 0, max: 100000, validate: Number.isFinite },
    protein: { type: Number, required: true, min: 0, max: 100000, validate: Number.isFinite },
    fat: { type: Number, required: true, min: 0, max: 100000, validate: Number.isFinite },
  },
  { _id: false },
);

const favoriteFoodSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    baseAmount: {
      type: Number,
      required: true,
      max: 5000,
      validate: {
        validator: (value: number) => Number.isFinite(value) && value > 0,
        message: "영양정보 기준량은 0 초과, 5,000 이하로 입력해주세요.",
      },
    },
    // g·ml 외에도 한 개와 1회분의 표시값을 그대로 저장할 수 있습니다.
    unit: { type: String, enum: ["g", "ml", "piece", "serving"], required: true },
    nutrients: { type: nutrientsSchema, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// 사용자 조건을 항상 포함하는 목록 조회를 지원하며 같은 이름의 서로 다른 식품도 저장할 수 있습니다.
favoriteFoodSchema.index({ userId: 1, createdAt: -1, _id: -1 });
type FavoriteFoodDocument = InferSchemaType<typeof favoriteFoodSchema>;
// 이미 생성한 모델을 재사용해 개발 서버의 모델 중복 등록 오류를 막습니다.
export const FavoriteFood: Model<FavoriteFoodDocument> =
  (models.FavoriteFood as Model<FavoriteFoodDocument> | undefined) ??
  model<FavoriteFoodDocument>("FavoriteFood", favoriteFoodSchema);
