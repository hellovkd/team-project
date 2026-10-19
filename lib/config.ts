// 설정 상태만 UI로 전달하고 비밀키나 연결 문자열 자체는 클라이언트에 노출하지 않습니다.
export function authenticationConfigured() {
  return Boolean(
    process.env.AUTH_SECRET?.trim() && process.env.MONGODB_URI?.trim(),
  );
}
