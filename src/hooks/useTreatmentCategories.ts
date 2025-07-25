import { CategoryNode } from "@/types/category";
import { fetchUtils } from "@/utils/fetch";
import { useQuery } from "@tanstack/react-query";

// const url = `${process.env.NEXT_PUBLIC_API_ROUTE}/api/treatment-categories`;
const url = '/api/treatment-categories';  // 상대 경로 사용

function fetchCategories() {
  const fetchStartTime = Date.now();
  log.info(" fetchCategories 시작:", new Date().toISOString());
  log.info(" API URL:", url);
  log.info(" NEXT_PUBLIC_API_ROUTE:", process.env.NEXT_PUBLIC_API_ROUTE);
  
  return fetchUtils<CategoryNode[]>({ url })
    .then(data => {
      const fetchEndTime = Date.now();
      const fetchTime = fetchEndTime - fetchStartTime;
      log.info(" fetchCategories 성공:", new Date().toISOString());
      log.info(` Categories fetch 시간: ${fetchTime}ms (${(fetchTime / 1000).toFixed(2)}초)`);
      log.info(" categories 개수:", data?.length || 0);
      return data;
    })
    .catch(error => {
      const fetchEndTime = Date.now();
      const fetchTime = fetchEndTime - fetchStartTime;
      console.error(" fetchCategories 에러:", new Date().toISOString());
      console.error(` Categories fetch 실패 시간: ${fetchTime}ms`);
      console.error("Error details:", error);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      console.error("Error type:", typeof error);
      console.error("Full error object:", JSON.stringify(error, null, 2));
      throw error;
    });
}

export function useTreatmentCategories() {
  const result = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  log.info(" useCategories 상태 변화:", {
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error?.message || null,
    dataLength: result.data?.length || 0,
    status: result.status,
    fetchStatus: result.fetchStatus
  });

  return result;
}
