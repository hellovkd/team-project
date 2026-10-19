import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getMacroRecords } from "@/lib/macroRecords";
import { goals } from "@/lib/macroCalculator";

export const metadata = { title: "계산 기록" };
// 빌드 때 설정이 비어 있어도 로그인 안내를 정적 저장하지 않고 매 요청에서 세션을 확인합니다.
export const dynamic = "force-dynamic";

// 서버에서 사용자를 확인하고 개인 기록을 조회해 목록과 상세 링크를 표시합니다.
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");
  const records = await getMacroRecords(user.id);
  const latest = records[0];
  const oldest = records.at(-1);
  const change =
    latest && oldest && records.length > 1
      ? Number((latest.weight - oldest.weight).toFixed(1))
      : null;
  return (
    <main id="main" className="content-shell">
      <div className="page-heading heading-with-action">
        <h1>계산 기록</h1>
        <Link href="/" className="secondary-button">
          새로 계산하기
        </Link>
      </div>
      <dl className="dashboard-summary surface-panel">
        <div>
          <dt>최근 저장 체중</dt>
          <dd>
            {latest ? latest.weight : "—"}
            <span>kg</span>
          </dd>
        </div>
        <div>
          <dt>최근 목표 칼로리</dt>
          <dd>
            {latest ? latest.targetCalories.toLocaleString("ko-KR") : "—"}
            <span>kcal</span>
          </dd>
          {latest ? <p>{goals[latest.goal].label}</p> : null}
        </div>
        <div>
          <dt>표시 기간 체중 변화</dt>
          <dd>
            {change === null ? "—" : `${change > 0 ? "+" : ""}${change}`}
            <span>kg</span>
          </dd>
          <p>
            {records.length > 1
              ? `표시된 ${records.length}개 기록의 처음과 최근 비교`
              : "기록 2개부터 비교합니다"}
          </p>
        </div>
      </dl>
      {/* 날짜와 모든 수치를 같은 행에서 비교하도록 카드 대신 표를 쓰며 조회·상세 이동은 유지합니다. */}
      <section className="records-section" aria-labelledby="records-heading">
        <div className="section-heading">
          <h2 id="records-heading">저장한 계산</h2>
          <span>최근 100개 중 {records.length}개</span>
        </div>
        {records.length ? (
          <table className="record-table">
            <thead>
              <tr>
                <th scope="col">저장일</th>
                <th scope="col">목표</th>
                <th scope="col">체중 (kg)</th>
                <th scope="col">목표 칼로리 (kcal)</th>
                <th scope="col">탄수화물 (g)</th>
                <th scope="col">단백질 (g)</th>
                <th scope="col">지방 (g)</th>
                <th scope="col">상세</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>
                    <time dateTime={record.createdAt}>
                      {new Date(record.createdAt).toLocaleString("ko-KR", {
                        timeZone: "Asia/Seoul",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </time>
                  </td>
                  <td>{goals[record.goal].label}</td>
                  <td>{record.weight}</td>
                  <td>{record.targetCalories.toLocaleString("ko-KR")}</td>
                  <td>{record.carbs}</td>
                  <td>{record.protein}</td>
                  <td>{record.fat}</td>
                  <td>
                    <Link className="text-link" href={`/dashboard/${record.id}`}>
                      보기
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state surface-panel">
            <p>저장한 계산 기록이 없습니다.</p>
            <Link href="/" className="text-link">
              계산기
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
