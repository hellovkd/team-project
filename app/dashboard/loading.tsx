// 장식용 뼈대 카드 대신 조회 중이라는 상태만 간단하게 안내합니다.
export default function Loading() {
  return (
    <main id="main" className="content-shell" aria-busy="true">
      <div className="page-heading">
        <h1>계산 기록</h1>
        <p role="status">저장한 계산을 불러오는 중입니다…</p>
      </div>
    </main>
  );
}
