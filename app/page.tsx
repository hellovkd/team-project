import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

// 계산기는 계산 기록 화면으로 옮겼으므로, 로그인한 사용자는 그곳으로 이동시키고 비로그인은 가입 안내만 보여줍니다.
export default async function Home() {
  let user;
  try {
    user = await getCurrentUser();
  } catch (error) {
    console.error(
      "프로필 조회 실패:",
      error instanceof Error ? error.name : "UnknownError",
    );
  }
  if (user) redirect("/dashboard");

  return (
    <main id="main" className="content-shell">
      <div className="page-heading">
        <h1>탄단지 및 칼로리 관리</h1>
        <p>
          탄단지 계산기는 따로 사용할 수 없으며, 회원가입할 때 신체 정보와
          목표를 함께 입력해 맞춤 칼로리·탄단지를 계산합니다.
        </p>
      </div>
      <section className="surface-panel empty-state">
        <h2>회원가입 후 나만의 탄단지를 확인하세요</h2>
        <p>
          가입 시 입력한 성별, 나이, 키, 체중, 활동량, 목표로 하루 권장 섭취량이
          자동 계산되며, 가입 후에는 계산 기록 화면에서 입력 정보를 수정할 수
          있습니다.
        </p>
        <div className="meal-page-links">
          <Link className="primary-button" href="/register">
            회원가입하고 계산하기
          </Link>
          <Link className="secondary-button" href="/login">
            로그인
          </Link>
        </div>
      </section>
    </main>
  );
}
