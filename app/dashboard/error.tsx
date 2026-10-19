"use client";

import Link from "next/link";

// 조회 장애를 빈 기록으로 숨기지 않으며, 설치된 Next.js 문서의 retry로 데이터를 다시 요청합니다.
export default function DashboardError({ retry }: { retry: () => void }) {
  return (
    <main id="main" className="content-shell">
      <div className="page-heading">
        <h1>계산 기록</h1>
      </div>
      <section className="surface-panel empty-state">
        <h2>기록을 불러오지 못했습니다.</h2>
        <p>연결 상태를 확인한 뒤 다시 시도해주세요.</p>
        <button className="secondary-button" onClick={retry}>
          다시 시도하기
        </button>
        <Link href="/" className="text-link">
          계산기로 돌아가기
        </Link>
      </section>
    </main>
  );
}
