import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { registerAction } from "@/lib/actions";
import { authenticationConfigured } from "@/lib/config";
import { SubmitButton } from "@/components/SubmitButton";
import { BodyFields } from "@/components/BodyFields";

type Props = { searchParams: Promise<{ error?: string }> };
export const metadata = { title: "회원가입" };
const errors: Record<string, string> = {
  input:
    "이름, 이메일, 비밀번호와 신체 정보를 확인해주세요. 비밀번호는 8자 이상, UTF-8 72바이트 이하로 입력해주세요.",
  duplicate: "이미 가입된 이메일입니다. 기존 계정으로 로그인해주세요.",
  database:
    "회원가입을 처리하지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해주세요.",
};

// 계정과 신체 정보·활동량·목표를 함께 등록해 가입 후 계산기의 초기값으로 사용합니다.
export default async function RegisterPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const configured = authenticationConfigured();
  if (configured && (await auth())?.user) redirect("/");
  // 가입 입력과 검증은 유지하고 계정·신체 정보에 필요한 안내만 표시합니다.
  return (
    <main id="main" className="content-shell">
      <div className="page-heading">
        <h1>회원가입</h1>
      </div>
      {!configured ? (
        <p className="notice warning-notice" role="status">
          회원가입 연결을 준비하고 있습니다. 연결이 완료되면 정보를 등록할 수
          있어요.
        </p>
      ) : null}
      {error && errors[error] ? (
        <p className="notice error-notice" role="alert">
          {errors[error]}
        </p>
      ) : null}
      <form action={registerAction} className="register-grid">
        <section className="surface-panel registration-account">
          <div className="panel-header">
            <h2>계정 정보</h2>
          </div>
          <div className="auth-form">
            <div className="field-group">
              <label htmlFor="name">이름</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                maxLength={50}
                placeholder="이름 입력"
                required
              />
            </div>
            <div className="field-group">
              <label htmlFor="email">이메일</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                placeholder="이메일 주소 입력"
                required
              />
            </div>
            <div className="field-group">
              <label htmlFor="password">비밀번호</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                placeholder="8자 이상 입력"
                required
                aria-describedby="password-hint"
              />
              <p className="field-hint" id="password-hint">
                8자 이상, UTF-8 72바이트 이하. 한글 등은 글자당 여러 바이트를
                사용합니다.
              </p>
            </div>
          </div>
        </section>
        <section className="surface-panel registration-body">
          <div className="panel-header">
            <div>
              <h2>신체 정보와 목표</h2>
              <p>만 18세 이상 성인 기준으로 입력해주세요.</p>
            </div>
          </div>
          <BodyFields />
          <SubmitButton label="가입하고 로그인" disabled={!configured} />
          <p className="auth-switch">
            <Link href="/login">로그인</Link>
          </p>
        </section>
      </form>
    </main>
  );
}
