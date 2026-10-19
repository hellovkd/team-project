import { handlers } from "@/auth";

// Auth.js가 로그인, 로그아웃, 세션 조회와 CSRF 검증용 GET/POST를 처리합니다.
export const { GET, POST } = handlers;
