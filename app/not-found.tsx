import Link from "next/link";

// 잘못된 주소와 존재하지 않거나 소유하지 않은 기록에는 같은 404 화면을 보여줍니다.
export default function NotFound() {
  return (
    <main id="main" className="content-shell">
      <div className="empty-state surface-panel">
        <p className="page-context">404</p>
        <h1>페이지를 찾을 수 없어요.</h1>
        <p>주소를 확인하거나 계산기에서 다시 시작해주세요.</p>
        <Link className="text-link" href="/">
          계산기로 돌아가기
        </Link>
      </div>
    </main>
  );
}
