import { connectDB } from "@/lib/mongodb";
import { MacroRecord as MacroRecordModel } from "@/models/MacroRecord";
import { calculateMacros, type MacroInput } from "@/lib/macroCalculator";

export type SavedMacroRecord = MacroInput & {
  id: string;
  bmr: number;
  tdee: number;
  targetCalories: number;
  carbs: number;
  protein: number;
  fat: number;
  createdAt: string;
};

type RecordDocument = Omit<SavedMacroRecord, "id" | "createdAt"> & {
  _id: unknown;
  createdAt: Date;
};

// Mongoose 문서를 직렬화 가능한 화면용 객체로 바꿔 내부 필드를 직접 전달하지 않습니다.
function toRecord(doc: RecordDocument): SavedMacroRecord {
  return {
    id: String(doc._id),
    gender: doc.gender,
    age: doc.age,
    height: doc.height,
    weight: doc.weight,
    activityLevel: doc.activityLevel,
    goal: doc.goal,
    bmr: doc.bmr,
    tdee: doc.tdee,
    targetCalories: doc.targetCalories,
    carbs: doc.carbs,
    protein: doc.protein,
    fat: doc.fat,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function getMacroRecords(
  userId: string,
): Promise<SavedMacroRecord[]> {
  await connectDB();
  // 소유자 조건으로 개인 기록을 분리하고 최신순의 일반 객체로 조회합니다.
  const docs = await MacroRecordModel.find({ userId })
    .sort({ createdAt: -1, _id: -1 })
    .limit(100)
    .lean();
  return docs.map((doc) => toRecord(doc as RecordDocument));
}

export async function getMacroRecord(
  userId: string,
  id: string,
): Promise<SavedMacroRecord | undefined> {
  if (!/^[a-f\d]{24}$/i.test(id)) return undefined;
  await connectDB();
  // 상세 조회도 ID와 소유자를 함께 확인해 타인의 기록 URL로 접근해도 보이지 않게 합니다.
  const doc = await MacroRecordModel.findOne({ _id: id, userId }).lean();
  return doc ? toRecord(doc as RecordDocument) : undefined;
}

export async function createMacroRecord(userId: string, input: MacroInput) {
  // 클라이언트가 결과값을 변조하더라도 저장 전에 서버가 입력으로부터 다시 계산합니다.
  const result = calculateMacros(input);
  if (!result.isFeasible)
    throw new Error("이 조건의 결과는 저장할 수 없습니다.");
  await connectDB();
  const doc = await MacroRecordModel.create({
    userId,
    ...input,
    bmr: result.bmr,
    tdee: result.tdee,
    targetCalories: result.targetCalories,
    carbs: result.carbs,
    protein: result.protein,
    fat: result.fat,
  });
  return toRecord(doc as unknown as RecordDocument);
}
