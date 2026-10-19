import {
  Schema,
  model,
  models,
  type Model,
  type InferSchemaType,
} from "mongoose";
import { activityLevels, goals } from "@/lib/macroCalculator";

// 계산 기록은 반드시 한 사용자에게 속하며 입력과 서버 계산 결과를 함께 저장합니다.
const macroRecordSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    gender: { type: String, enum: ["male", "female"], required: true },
    age: { type: Number, required: true, min: 18, max: 100 },
    height: { type: Number, required: true, min: 100, max: 250 },
    weight: { type: Number, required: true, min: 30, max: 350 },
    activityLevel: {
      type: String,
      enum: Object.keys(activityLevels),
      required: true,
    },
    goal: { type: String, enum: Object.keys(goals), required: true },
    bmr: { type: Number, required: true },
    tdee: { type: Number, required: true },
    targetCalories: { type: Number, required: true, min: 1 },
    carbs: { type: Number, required: true, min: 0 },
    protein: { type: Number, required: true, min: 0 },
    fat: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// 내 기록 목록을 최신순으로 읽는 쿼리를 복합 인덱스로 지원합니다.
macroRecordSchema.index({ userId: 1, createdAt: -1, _id: -1 });
type MacroRecordDocument = InferSchemaType<typeof macroRecordSchema>;
export const MacroRecord: Model<MacroRecordDocument> =
  (models.MacroRecord as Model<MacroRecordDocument> | undefined) ??
  model<MacroRecordDocument>("MacroRecord", macroRecordSchema);
