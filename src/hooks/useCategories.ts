import { CategoryNode } from "@/types/category";
import { fetchUtils } from "@/utils/fetch";
import { useQuery } from "@tanstack/react-query";

const url = `${process.env.NEXT_PUBLIC_API_ROUTE}/api/treatment-categories`;

function fetchCategories() {
  console.log("🚀 fetchCategories 호출됨");
  console.log("📍 API URL:", url);
  console.log("🔧 NEXT_PUBLIC_API_ROUTE:", process.env.NEXT_PUBLIC_API_ROUTE);
  
  return fetchUtils<CategoryNode[]>({ url })
    .then(data => {
      console.log("✅ fetchCategories 성공:", data);
      console.log("📊 categories 개수:", data?.length || 0);
      return data;
    })
    .catch(error => {
      console.error("❌ fetchCategories 에러:", error);
      throw error;
    });
}

export function useCategories() {
  const result = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  console.log("🔍 useCategories 결과:", {
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    dataLength: result.data?.length || 0,
    data: result.data
  });

  return result;
}
