import Link from "next/link";
import { redirect } from "next/navigation";
import { DailyIntake } from "@/components/DailyIntake";
import { MealForm } from "@/components/MealForm";
import { getCurrentUser } from "@/lib/session";
import { getMealRecords } from "@/lib/meals";
import { getFavoriteFoods } from "@/lib/favoriteFoods";
import { getMacroRecords } from "@/lib/macroRecords";
import { calculateMacros } from "@/lib/macroCalculator";
import { foodUnits, getTodayDate, isValidMealDate, mealTypes, sumNutrition, type Nutrients } from "@/lib/mealNutrition";

type Props = { searchParams: Promise<{ date?: string; error?: string; notice?: string }> };
export const metadata = { title: "식단 기록" };
export const dynamic = "force-dynamic";

// 개인 기록은 서버에서 세션을 확인하고 같은 소유자·식사일 조건으로 조회합니다.
export default async function MealsPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/meals");
  const query = await searchParams;
  const validDate = typeof query.date === "string" && isValidMealDate(query.date);
  const date = validDate ? query.date! : getTodayDate();
  const [records, favorites, calculations] = await Promise.all([
    getMealRecords(user.id, date),
    getFavoriteFoods(user.id),
    getMacroRecords(user.id),
  ]);
  const consumed = sumNutrition(records.map((record) => record.totals));
  let target: Nutrients | undefined;
  const condition = calculations[0] ?? user.bodySpec;
  if (condition) {
    try {
      const result = calculateMacros(condition);
      if (result.isFeasible) target = { calories: result.targetCalories, carbs: result.carbs, protein: result.protein, fat: result.fat };
    } catch {
      // 예전 입력 조건이 유효하지 않아도 새 식사 기록의 등록·조회는 계속 제공합니다.
    }
  }
  const display = (value: number) => value.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
  return (
    <main id="main" className="content-shell">
      {/* 인사와 중복 소개를 줄이고 기록에 필요한 음식 목록 링크만 남깁니다. */}
      <div className="page-heading heading-with-action">
        <h1>식단 기록</h1>
        <Link href="/foods" className="text-link">내 음식</Link>
      </div>
      {query.date && !validDate ? <p className="notice warning-notice" role="alert">날짜를 확인해주세요. 오늘 날짜의 기록을 표시합니다.</p> : null}
      {query.error ? <p className="notice error-notice" role="alert">{query.error === "input" ? "음식 이름, 기준량·단위, 영양정보와 먹은 양을 확인해주세요." : "식단을 저장하지 못했습니다. 다시 시도해주세요."}</p> : null}
      {query.notice ? <p className="notice info-notice" role="status">식단을 저장했습니다.</p> : null}
      {/* 날짜 조회는 읽기 전용 GET 요청이며 폼을 바꿔도 저장 기록을 수정하지 않습니다. */}
      <form action="/meals" method="get" className="meal-date-filter">
        <label htmlFor="meal-date">날짜</label>
        <input id="meal-date" name="date" type="date" min="2000-01-01" max="2100-12-31" defaultValue={date} key={date} required />
        <button className="secondary-button" type="submit">조회</button>
        <Link href="/meals" className="text-link">오늘</Link>
        <span>한국 날짜 기준</span>
      </form>
      <DailyIntake consumed={consumed} target={target} />
      <div className="meal-workspace">
        <MealForm date={date} favorites={favorites} />
        <section className="meal-records" aria-labelledby="meal-records-heading">
          <div className="section-heading"><h2 id="meal-records-heading">{date} 기록</h2><span>음식 {records.length}개</span></div>
          {/* 고정된 네 끼니를 모두 표시하므로 빈 끼니와 저장된 기록을 구분할 수 있습니다. */}
          {Object.entries(mealTypes).map(([type, label]) => {
            const meals = records.filter((record) => record.mealType === type);
            const total = sumNutrition(meals.map((record) => record.totals));
            return (
              <section key={type} className="surface-panel meal-group" aria-labelledby={`meal-group-${type}`}>
                <div className="section-heading"><h3 id={`meal-group-${type}`}>{label}</h3><span>{display(total.calories)} kcal</span></div>
                {meals.length ? <ul className="meal-record-list">{meals.map((meal) => (
                  <li key={meal.id}>
                    <div className="meal-record-name"><strong>{meal.name}</strong><span>{display(meal.amount)} {foodUnits[meal.unit]}</span></div>
                    <dl className="meal-record-nutrients">
                      <div><dt>칼로리</dt><dd>{display(meal.totals.calories)} kcal</dd></div>
                      <div><dt>탄수화물</dt><dd>{display(meal.totals.carbs)} g</dd></div>
                      <div><dt>단백질</dt><dd>{display(meal.totals.protein)} g</dd></div>
                      <div><dt>지방</dt><dd>{display(meal.totals.fat)} g</dd></div>
                    </dl>
                  </li>
                ))}</ul> : <p className="meal-empty">기록이 없습니다.</p>}
              </section>
            );
          })}
          <p className="meal-record-note">영양정보는 소수 첫째 자리까지 표시합니다.</p>
        </section>
      </div>
    </main>
  );
}
