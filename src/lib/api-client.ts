import { ApiResponse } from './api-utils';

// API 호출을 위한 기본 설정
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.com' 
  : '';

// 공통 fetch 래퍼
async function apiCall<T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}/api${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// FormData를 사용한 API 호출
async function apiCallWithFormData<T = any>(
  endpoint: string, 
  formData: FormData
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}/api${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // FormData 사용시 Content-Type 헤더를 자동으로 설정하도록 함
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Step별 API 호출 함수들
export const uploadAPI = {
  // Step 1: 기본 정보
  step1: async (formData: FormData): Promise<ApiResponse> => {
    return apiCallWithFormData('/upload/step1', formData);
  },

  // Step 2: 영업시간 및 부대시설
  step2: async (formData: FormData): Promise<ApiResponse> => {
    return apiCallWithFormData('/upload/step2', formData);
  },

  // Step 3: 이미지 및 의사 정보
  step3: async (formData: FormData): Promise<ApiResponse> => {
    return apiCallWithFormData('/upload/step3', formData);
  },

  // Step 4: 치료 정보
  step4: async (formData: FormData): Promise<ApiResponse> => {
    return apiCallWithFormData('/upload/step4', formData);
  },

  // Step 5: 언어 설정 및 피드백
  step5: async (formData: FormData): Promise<ApiResponse> => {
    return apiCallWithFormData('/upload/step5', formData);
  },
};

// 에러 메시지 포맷팅
export function formatApiError(error: any): string {
  if (error?.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return '알 수 없는 오류가 발생했습니다.';
}

// 성공 응답 확인
export function isApiSuccess(response: ApiResponse): boolean {
  return response.success === true && response.status === 'success';
}

// 에러 응답 확인
export function isApiError(response: ApiResponse): boolean {
  return response.success === false || response.status === 'error';
} 