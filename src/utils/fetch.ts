import { RequestInit } from "next/dist/server/web/spec-extension/request";

interface IFetchUtils {
  url: string;
  fetchOptions?: RequestInit;
}

export const fetchUtils = async <T>({
  url,
  fetchOptions,
}: IFetchUtils): Promise<T> => {
  try {
    const res = await fetch(url, fetchOptions);
    const contentType = res.headers.get("Content-Type") || "";

    // ✅ 응답이 HTML이면 JSON 파싱 시도하지 않고 즉시 차단
    if (contentType.includes("text/html")) {
      const text = await res.text();
      throw new Error(`HTML 응답 수신됨 (예상치 못한 응답): ${text.slice(0, 100)}...`);
    }

    if (!res.ok) {
      const errorText = await res.text(); // HTML이 아닐 테니 읽기 안전
      throw new Error(`HTTP 오류 ${res.status}: ${errorText.slice(0, 100)}...`);
    }

    if (!contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error(`예상치 못한 응답 형식: ${contentType} → ${text.slice(0, 100)}...`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      log.error("[API] error.message 반환:", error.message);
      throw new Error(error.message);
    } else {
      throw new Error("API ERROR");
    }
  }
};