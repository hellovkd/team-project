"use client";

import Link from "next/link";

// 설치된 Next.js 문서의 retry로 실패한 서버 조회를 다시 실행하고 빈 기록으로 숨기지 않습니다.
export default function MealsError({ retry }: { retry: () => void }) {
  return (
    <main id="main" className="content-shell">
      <div className="page-heading"><h1>식단 기록</h1></div>
      <section className="surface-panel empty-state">
        <h2>식사 기록을 불러오지 못했습니다.</h2>
        <p>연결 상태를 확인한 뒤 다시 시도해주세요.</p>
        <button className="secondary-button" onClick={retry}>다시 시도하기</button>
        <Link href="/" className="text-link">계산기로 돌아가기</Link>
      </section>
    </main>
  );
}
