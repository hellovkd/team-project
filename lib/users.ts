import bcrypt from "bcryptjs";
import { User } from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import {
  normalizeEmail,
  validEmail,
  validPassword,
} from "@/lib/authValidation";
import { validateMacroInput, type MacroInput } from "@/lib/macroCalculator";

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  bodySpec: MacroInput;
}) {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  if (
    !name ||
    name.length > 50 ||
    !validEmail(email) ||
    !validPassword(input.password)
  )
    throw new Error("회원 정보를 확인해주세요.");
  if (Object.keys(validateMacroInput(input.bodySpec)).length)
    throw new Error("신체 정보와 활동량, 목표를 확인해주세요.");
  await connectDB();
  const existing = await User.findOne({ email });
  if (existing) throw new Error("이미 가입된 이메일입니다.");
  // 비밀번호를 bcrypt.hash로 해싱한 뒤 계정을 생성해 평문 비밀번호가 저장되지 않게 합니다.
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
    latestBodySpec: input.bodySpec,
  });
  return { id: String(user._id), name: user.name, email: user.email };
}

export async function getUserByEmail(email: string) {
  await connectDB();
  const user = await User.findOne({ email: normalizeEmail(email) }).lean();
  if (!user) return undefined;
  // DB의 해시와 내부 문서를 직접 전달하지 않고 화면에 필요한 값만 변환합니다.
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    bodySpec: user.latestBodySpec
      ? {
          gender: user.latestBodySpec.gender as MacroInput["gender"],
          age: user.latestBodySpec.age,
          height: user.latestBodySpec.height,
          weight: user.latestBodySpec.weight,
          activityLevel: user.latestBodySpec
            .activityLevel as MacroInput["activityLevel"],
          goal: user.latestBodySpec.goal as MacroInput["goal"],
        }
      : undefined,
  };
}

export async function verifyCredentials(
  emailValue: unknown,
  password: unknown,
) {
  const email = normalizeEmail(emailValue);
  if (!validEmail(email) || !validPassword(password)) return null;
  await connectDB();
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) return null;
  // bcrypt.compare는 저장된 salt를 사용해 비밀번호를 검증하며 해시를 복호화하지 않습니다.
  if (!(await bcrypt.compare(password, user.passwordHash))) return null;
  return { id: String(user._id), name: user.name, email: user.email };
}
