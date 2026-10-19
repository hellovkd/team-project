import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { loginAction } from "@/lib/actions";
import { authenticationConfigured } from "@/lib/config";
import { safeReturnTo } from "@/lib/authValidation";
import { SubmitButton } from "@/components/SubmitButton";

type Props = {
  searchParams: Promise<{ error?: string; notice?: string; next?: string }>;
};
export const metadata = { title: "로그인" };

// searchParams로 오류를 표시하고 form action에 로그인 액션을 연결합니다.
export default async function LoginPage({ searchParams }: Props) {
  const { error, notice, next: nextValue } = await searchParams;
  const next = safeReturnTo(nextValue);
  const configured = authenticationConfigured();
  if (configured && (await auth())?.user) redirect(next);
  // 로그인 기능과 상태 안내는 유지하고 장식용 소개 문구를 줄여 폼을 바로 보여줍니다.
  return (
    <main id="main" className="content-shell auth-shell">
      <div className="page-heading">
        <h1 id="login-heading">로그인</h1>
      </div>
      <section
        className="surface-panel auth-panel"
        aria-labelledby="login-heading"
      >
        {notice === "save" ? (
          <p className="notice info-notice">
            계산은 누구나 할 수 있어요. 결과를 저장하려면 로그인해주세요.
          </p>
        ) : null}
        {notice === "registered" ? (
          <p className="notice info-notice">
            회원가입이 완료되었습니다. 이메일과 비밀번호로 로그인해주세요.
          </p>
        ) : null}
        {!configured || error === "config" ? (
          <p className="notice warning-notice" role="status">
            로그인 연결을 준비하고 있습니다. 지금은{" "}
            <Link className="text-link" href="/">
              계산기
            </Link>
            를 이용할 수 있어요.
          </p>
        ) : null}
        {error && error !== "config" ? (
          <p className="notice error-notice" role="alert">
            {error === "database"
              ? "로그인 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요."
              : "이메일 또는 비밀번호가 올바르지 않습니다."}
          </p>
        ) : null}
        <form action={loginAction} className="auth-form">
          <input type="hidden" name="next" value={next} />
          <div className="field-group">
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="이메일 주소 입력"
              maxLength={254}
              required
            />
          </div>
          <div className="field-group">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              minLength={8}
              maxLength={72}
              placeholder="비밀번호 입력"
              required
            />
          </div>
          <SubmitButton label="로그인" disabled={!configured} />
        </form>
        <p className="auth-switch">
          <Link href="/register">회원가입</Link>
        </p>
      </section>
      <Link href="/" className="back-link">
        계산기
      </Link>
    </main>
  );
}
