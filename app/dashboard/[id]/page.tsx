import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getMacroRecord } from "@/lib/macroRecords";
import { calculateMacros, activityLevels, goals } from "@/lib/macroCalculator";
import { MacroResult } from "@/components/MacroResult";

type Props = { params: Promise<{ id: string }> };
export const metadata = { title: "계산 결과" };

// 경로의 ID와 세션 소유자로 기록을 조회하며 찾을 수 없으면 404를 반환합니다.
export default async function RecordDetail({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");
  const { id } = await params;
  const record = await getMacroRecord(user.id, id);
  if (!record) notFound();
  const result = {
    ...calculateMacros(record),
    bmr: record.bmr,
    tdee: record.tdee,
    targetCalories: record.targetCalories,
    carbs: record.carbs,
    protein: record.protein,
    fat: record.fat,
  };
  return (
    <main id="main" className="content-shell">
      <Link className="back-link" href="/dashboard">
        계산 기록
      </Link>
      <div className="page-heading">
        <h1>계산 결과</h1>
        {/* 저장 시점은 결과를 구분하는 정보이므로 소개 문구를 없애도 기본 메타 정보로 유지합니다. */}
        <p>
          <time dateTime={record.createdAt}>
            {new Date(record.createdAt).toLocaleString("ko-KR", {
              timeZone: "Asia/Seoul",
              dateStyle: "long",
              timeStyle: "short",
            })}
          </time>{" "}
          저장
        </p>
      </div>
      <div className="detail-grid">
        <section className="surface-panel detail-specs">
          <h2>계산에 사용한 정보</h2>
          <dl>
            {[
              ["성별", record.gender === "male" ? "남성" : "여성"],
              ["나이", `${record.age}세`],
              ["키", `${record.height} cm`],
              ["체중", `${record.weight} kg`],
              ["활동량", activityLevels[record.activityLevel].label],
              ["목표", goals[record.goal].label],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section
          className="surface-panel results-panel"
          aria-label="저장한 계산 결과"
        >
          <MacroResult input={record} result={result} />
        </section>
      </div>
    </main>
  );
}
