import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { activityLevels, goals } from "@/lib/macroCalculator";

// 회원가입 때 입력한 정보를 저장합니다. 계산기는 저장 기록이 있으면 그 최신 조건을 우선합니다.
const bodySpecSchema = new Schema(
  {
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
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    // 비밀번호를 해시로 저장하고 일반 조회에서 제외해 인증 이외의 조회에 노출하지 않습니다.
    passwordHash: { type: String, required: true, select: false },
    latestBodySpec: { type: bodySpecSchema },
  },
  { timestamps: true },
);

type UserDocument = InferSchemaType<typeof userSchema>;
// 개발 중 재로딩 시 이미 생성한 모델을 재사용해 중복 등록을 막습니다.
export const User: Model<UserDocument> =
  (models.User as Model<UserDocument> | undefined) ??
  model<UserDocument>("User", userSchema);
