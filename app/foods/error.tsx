"use client";

import Link from "next/link";

// 실제 조회 장애는 전용 오류 화면에서 알리고 retry로 재조회할 기회를 제공합니다.
export default function FoodsError({ retry }: { retry: () => void }) {
  return (
    <main id="main" className="content-shell">
      <div className="page-heading"><h1>내 음식</h1></div>
      <section className="surface-panel empty-state">
        <h2>저장한 음식을 불러오지 못했습니다.</h2>
        <p>연결 상태를 확인한 뒤 다시 시도해주세요.</p>
        <button className="secondary-button" onClick={retry}>다시 시도하기</button>
        <Link href="/meals" className="text-link">식사 기록으로 돌아가기</Link>
      </section>
    </main>
  );
}
