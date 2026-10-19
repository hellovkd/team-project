import Link from "next/link";
import { redirect } from "next/navigation";
import { FoodFields } from "@/components/FoodFields";
import { SubmitButton } from "@/components/SubmitButton";
import { getCurrentUser } from "@/lib/session";
import { getFavoriteFoods } from "@/lib/favoriteFoods";
import { createFavoriteFoodAction } from "@/lib/mealActions";
import { foodUnits } from "@/lib/mealNutrition";

type Props = { searchParams: Promise<{ error?: string; notice?: string }> };
export const metadata = { title: "내 음식" };
export const dynamic = "force-dynamic";

// 음식의 기준량·단위와 영양정보를 함께 저장하고 본인 음식 목록을 조회합니다.
export default async function FoodsPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/foods");
  const { error, notice } = await searchParams;
  const foods = await getFavoriteFoods(user.id);
  const display = (value: number) => value.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
  return (
    <main id="main" className="content-shell">
      {/* 제목과 식단 연결만 두어 음식 등록·목록에 바로 집중할 수 있게 합니다. */}
      <div className="page-heading heading-with-action">
        <h1>내 음식</h1>
        <Link href="/meals" className="text-link">식단 기록</Link>
      </div>
      {error ? <p className="notice error-notice" role="alert">{error === "input" ? "음식 이름, 기준량·단위와 영양정보를 확인해주세요." : "음식을 저장하지 못했습니다. 다시 시도해주세요."}</p> : null}
      {notice ? <p className="notice info-notice" role="status">음식을 저장했습니다.</p> : null}
      <div className="food-workspace">
        <section className="surface-panel food-form-panel" aria-labelledby="food-form-heading">
          <div className="panel-header"><h2 id="food-form-heading">음식 등록</h2></div>
          <form action={createFavoriteFoodAction} className="food-form"><FoodFields /><SubmitButton label="음식 저장" /></form>
          <p className="food-save-note">음식 저장 후 식단 기록에 먹은 양을 입력해야 섭취량에 반영됩니다.</p>
        </section>
        <section className="food-list-section" aria-labelledby="food-list-heading">
          <div className="section-heading"><h2 id="food-list-heading">저장한 음식</h2><span>{foods.length}개</span></div>
          {foods.length ? <ul className="food-list">{foods.map((food) => (
            <li key={food.id} className="surface-panel food-card">
              <div className="food-card-heading"><h3>{food.name}</h3><span>{display(food.baseAmount)} {foodUnits[food.unit]} 기준</span></div>
              <dl className="meal-record-nutrients">
                <div><dt>칼로리</dt><dd>{display(food.nutrients.calories)} kcal</dd></div>
                <div><dt>탄수화물</dt><dd>{display(food.nutrients.carbs)} g</dd></div>
                <div><dt>단백질</dt><dd>{display(food.nutrients.protein)} g</dd></div>
                <div><dt>지방</dt><dd>{display(food.nutrients.fat)} g</dd></div>
              </dl>
            </li>
          ))}</ul> : <div className="surface-panel empty-state"><p>저장한 음식이 없습니다.</p></div>}
        </section>
      </div>
    </main>
  );
}
