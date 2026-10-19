import { Calculator } from "@/components/Calculator";
import { getCurrentUser } from "@/lib/session";
import { getMacroRecords } from "@/lib/macroRecords";

type Props = { searchParams: Promise<{ error?: string }> };

// 서버 컴포넌트에서 DB 정보를 읽고 입력과 결과 UI만 클라이언트로 분리합니다.
export default async function Home({ searchParams }: Props) {
  const { error } = await searchParams;
  let user;
  let initial;
  let profileError = false;
  try {
    user = await getCurrentUser();
    if (user) {
      const [latest] = await getMacroRecords(user.id);
      // 가입 시 신체 정보를 기본으로 사용하고 저장 이력이 있으면 최신 기록의 조건을 사용합니다.
      initial = latest ?? user.bodySpec;
    }
  } catch (error) {
    console.error(
      "프로필 조회 실패:",
      error instanceof Error ? error.name : "UnknownError",
    );
    profileError = true;
  }
  return (
    <main id="main" className="content-shell">
      {/* 인사말 대신 화면의 목적만 짧게 표시하고 바로 계산 폼으로 이어집니다. */}
      <div className="page-heading"><h1>탄단지 계산기</h1></div>
      {error ? (
        <p className="notice error-notice" role="alert">
          {error === "save"
            ? "기록을 저장하지 못했습니다. 연결 상태를 확인하고 다시 시도해주세요."
            : "입력값과 목표를 확인한 뒤 다시 계산해주세요."}
        </p>
      ) : null}
      {profileError ? (
        <p className="notice warning-notice" role="alert">
          회원 정보를 불러오지 못했습니다. 직접 입력해 계산할 수 있습니다.
        </p>
      ) : null}
      <Calculator initial={initial} signedIn={Boolean(user)} />
      <p className="form-note">성인용 추정값이며 실제 필요량과 다를 수 있습니다.</p>
    </main>
  );
}
