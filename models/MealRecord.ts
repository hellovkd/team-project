import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

// 기준량의 영양 정보는 식품 표시값을 보관하며 음수·무한대와 지나치게 큰 입력을 허용하지 않습니다.
const nutrientsSchema = new Schema(
  {
    calories: { type: Number, required: true, min: 0, max: 100000, validate: Number.isFinite },
    carbs: { type: Number, required: true, min: 0, max: 100000, validate: Number.isFinite },
    protein: { type: Number, required: true, min: 0, max: 100000, validate: Number.isFinite },
    fat: { type: Number, required: true, min: 0, max: 100000, validate: Number.isFinite },
  },
  { _id: false },
);

// 합계는 기준량보다 많이 먹으면 커지므로 입력 상한 대신 유한한 비음수만 허용합니다.
const totalsSchema = new Schema(
  {
    calories: { type: Number, required: true, min: 0, validate: Number.isFinite },
    carbs: { type: Number, required: true, min: 0, validate: Number.isFinite },
    protein: { type: Number, required: true, min: 0, validate: Number.isFinite },
    fat: { type: Number, required: true, min: 0, validate: Number.isFinite },
  },
  { _id: false },
);

// 한 끼에 여러 음식을 입력할 수 있도록 음식 한 개의 섭취량을 기록 한 건으로 보관합니다.
const mealRecordSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    // 기준량·단위·영양값을 함께 남겨 즐겨찾기와 관계없이 당시 식품 표시 기준을 유지합니다.
    baseAmount: {
      type: Number,
      required: true,
      max: 5000,
      validate: {
        validator: (value: number) => Number.isFinite(value) && value > 0,
        message: "영양정보 기준량은 0 초과, 5,000 이하로 입력해주세요.",
      },
    },
    unit: { type: String, enum: ["g", "ml", "piece", "serving"], required: true },
    nutrients: { type: nutrientsSchema, required: true },
    amount: {
      type: Number,
      required: true,
      max: 5000,
      validate: {
        validator: (value: number) => Number.isFinite(value) && value > 0,
        message: "먹은 양은 기준과 같은 단위로 0 초과, 5,000 이하로 입력해주세요.",
      },
    },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      required: true,
    },
    // 날짜는 브라우저에서 고른 달력 날짜 그대로 저장해 UTC 변환으로 하루가 바뀌는 일을 막습니다.
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    totals: { type: totalsSchema, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// 개인별 하루 식단을 최신 입력순으로 조회하는 조건에 맞춰 인덱스를 둡니다.
mealRecordSchema.index({ userId: 1, date: 1, createdAt: -1, _id: -1 });
type MealRecordDocument = InferSchemaType<typeof mealRecordSchema>;
// 개발 중 재로딩 시 이미 만들어진 모델을 재사용해 중복 등록을 막습니다.
export const MealRecord: Model<MealRecordDocument> =
  (models.MealRecord as Model<MealRecordDocument> | undefined) ??
  model<MealRecordDocument>("MealRecord", mealRecordSchema);
