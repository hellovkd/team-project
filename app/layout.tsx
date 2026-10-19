import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

// 모든 페이지에 한국어 설정, 공통 헤더와 메타데이터를 적용합니다.
export const metadata: Metadata = {
  title: {
    default: "탄단지 계산기",
    template: "%s | 탄단지",
  },
  description:
    "성별, 나이, 키, 체중과 활동량으로 나에게 맞는 하루 칼로리와 탄단지를 계산하고 기록하세요.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <a className="skip-link" href="#main">
          본문으로 이동
        </a>
        <SiteHeader />
        {/* 반복되는 하단 문구를 없애고 각 페이지의 입력과 기록만 표시합니다. */}
        <div className="app-content">{children}</div>
      </body>
    </html>
  );
}
