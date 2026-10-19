import Link from "next/link";
import { auth } from "@/auth";
import { logoutAction } from "@/lib/actions";
import { authenticationConfigured } from "@/lib/config";

// 공통 메뉴를 표시하고 세션 유무에 따라 로그인·로그아웃 메뉴를 구분합니다.
export async function SiteHeader() {
  const session = authenticationConfigured() ? await auth() : null;

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/">
          탄단지
        </Link>
        <nav className="header-navigation" aria-label="주 메뉴">
          <Link href="/">계산기</Link>
          <Link href="/dashboard">계산 기록</Link>
          {/* 수업 헤더와 같은 일반 링크로 음식 등록과 끼니별 기록 화면을 연결합니다. */}
          <Link href="/meals">식단 기록</Link>
          <Link href="/foods">내 음식</Link>
          {session?.user ? (
            <>
              <span className="account-name">{session.user.name}님</span>
              <form action={logoutAction}>
                <button className="secondary-button" type="submit">
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/register">회원가입</Link>
              <Link className="secondary-button" href="/login">
                로그인
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
