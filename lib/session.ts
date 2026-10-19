import { auth } from "@/auth";
import { getUserByEmail } from "@/lib/users";
import { authenticationConfigured } from "@/lib/config";

// Auth.js 세션의 이메일로 DB 계정을 조회해 기록의 소유자를 확인합니다.
export async function getCurrentUser() {
  if (!authenticationConfigured()) return undefined;
  const session = await auth();
  if (!session?.user?.email) return undefined;
  return getUserByEmail(session.user.email);
}
