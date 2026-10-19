"use client";

import { useFormStatus } from "react-dom";

// useFormStatus로 처리 상태를 읽어 저장 중 중복 제출을 막습니다.
export function SubmitButton({
  label,
  disabled = false,
}: {
  label: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className="primary-button"
      type="submit"
      disabled={pending || disabled}
    >
      {pending ? "처리 중…" : label}
    </button>
  );
}
