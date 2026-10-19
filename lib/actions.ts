"use server";

import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { createUser } from "@/lib/users";
import { getCurrentUser } from "@/lib/session";
import { createMacroRecord } from "@/lib/macroRecords";
import {
  readMacroInput,
  validateMacroInput,
  calculateMacros,
  type MacroInput,
  type MacroResult,
  type MacroFieldErrors,
} from "@/lib/macroCalculator";
import {
  normalizeEmail,
  validEmail,
  validPassword,
  safeReturnTo,
} from "@/lib/authValidation";
import { authenticationConfigured } from "@/lib/config";

export type CalculationResponse = {
  input?: MacroInput;
  result?: MacroResult;
  error?: string;
  fieldErrors?: MacroFieldErrors;
};

// 검증한 계산 결과를 반환해 클라이언트가 입력 오류와 결과를 상태에 반영하게 합니다.
export async function calculateMacroAction(
  formData: FormData,
): Promise<CalculationResponse> {
  const input = readMacroInput(formData);
  const fieldErrors = validateMacroInput(input);
  if (Object.keys(fieldErrors).length)
    return { error: "입력한 정보를 확인해주세요.", fieldErrors };
  return { input, result: calculateMacros(input) };
}

export async function saveMacroRecordAction(formData: FormData) {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    redirect("/?error=save");
  }
  if (!user) redirect("/login?notice=save&next=/");
  const input = readMacroInput(formData);
  if (Object.keys(validateMacroInput(input)).length) redirect("/?error=input");
  if (!calculateMacros(input).isFeasible) redirect("/?error=infeasible");
  let record;
  try {
    record = await createMacroRecord(user.id, input);
  } catch (error) {
    console.error(
      "기록 저장 실패:",
      error instanceof Error ? error.name : "UnknownError",
    );
    redirect("/?error=save");
  }
  // 저장 후 목록을 재검증하고 상세 화면으로 이동해 새 기록을 확인하게 합니다.
  revalidatePath("/dashboard");
  redirect(`/dashboard/${record.id}`);
}

export async function registerAction(formData: FormData) {
  if (!authenticationConfigured()) redirect("/register?error=config");
  const name = String(formData.get("name") ?? "").trim();
  const email = normalizeEmail(formData.get("email"));
  const password = formData.get("password");
  const bodySpec = readMacroInput(formData);
  if (
    !name ||
    name.length > 50 ||
    !validEmail(email) ||
    !validPassword(password) ||
    Object.keys(validateMacroInput(bodySpec)).length
  )
    redirect("/register?error=input");
  try {
    // 계정을 DB에 저장한 뒤 Credentials로 로그인합니다.
    await createUser({ name, email, password, bodySpec });
  } catch (error) {
    const duplicate =
      error instanceof Error &&
      (error.message === "이미 가입된 이메일입니다." ||
        ("code" in error && error.code === 11000));
    redirect(`/register?error=${duplicate ? "duplicate" : "database"}`);
  }
  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) redirect("/login?notice=registered");
    throw error;
  }
}

export async function loginAction(formData: FormData) {
  const next = safeReturnTo(formData.get("next"));
  if (!authenticationConfigured())
    redirect(`/login?error=config&next=${encodeURIComponent(next)}`);
  const email = normalizeEmail(formData.get("email"));
  const password = formData.get("password");
  if (!validEmail(email) || !validPassword(password))
    redirect(`/login?error=credentials&next=${encodeURIComponent(next)}`);
  try {
    await signIn("credentials", { email, password, redirectTo: next });
  } catch (error) {
    if (error instanceof AuthError)
      redirect(
        `/login?error=${error.type === "CredentialsSignin" ? "credentials" : "database"}&next=${encodeURIComponent(next)}`,
      );
    throw error;
  }
}

// Auth.js signOut으로 세션을 해제하고 계산기로 이동합니다.
export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
