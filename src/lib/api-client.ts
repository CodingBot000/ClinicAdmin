import { ApiResponse } from './api-utils';

// API 호출을 위한 기본 설정
// const API_BASE_URL = process.env.NODE_ENV === 'production' 
//   ? 'https://your-domain.com' 
//   : '';
const API_BASE_URL =
  typeof window !== 'undefined' ? window.location.origin : '';

  
// 공통 fetch 래퍼
async function apiCall<T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}/api${endpoint}`;
    log.info(`[API] 호출 시작: ${url}`, { method: options.method || 'GET' });
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    log.info(`[API] 응답 상태: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    log.info(`[API] 응답 데이터:`, data);
    
    if (!response.ok) {
      const errorMsg = data.error || `HTTP error! status: ${response.status}`;
      console.error(`[API] HTTP 오류: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`[API] 호출 실패 ${endpoint}:`, error);
    console.error(`[API] 오류 타입:`, typeof error);
    console.error(`[API] 오류 메시지:`, (error as any)?.message);
    console.error(`[API] 오류 스택:`, (error as any)?.stack);
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
    log.info(`[API] FormData 호출 시작: ${url}`);
    
    // FormData 내용 로깅 (개발용)
    if (process.env.NODE_ENV === 'development') {
      log.info(`[API] FormData 키들:`, Array.from(formData.keys()));
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string' && value.length < 100) {
          log.info(`[API] FormData ${key}:`, value);
        } else {
          log.info(`[API] FormData ${key}:`, typeof value, value instanceof File ? `File(${value.size} bytes)` : '...');
        }
      }
    }
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // FormData 사용시 Content-Type 헤더를 자동으로 설정하도록 함
    });

    log.info(`[API] FormData 응답 상태: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    log.info(`[API] FormData 응답 데이터:`, data);
    
    if (!response.ok) {
      const errorMsg = data.error || `HTTP error! status: ${response.status}`;
      console.error(`[API] FormData HTTP 오류: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`[API] FormData 호출 실패 ${endpoint}:`, error);
    console.error(`[API] FormData 오류 타입:`, typeof error);
    console.error(`[API] FormData 오류 메시지:`,  (error as any)?.message);
    console.error(`[API] FormData 오류 스택:`, (error as any)?.stack);
    throw error;
  }
}

// Step별 API 호출 함수들
export const uploadAPI = {
  // Step 1: 기본 정보
  step1: async (formData: FormData): Promise<ApiResponse> => {
    log.info(`[API] Step1 호출 시작`);
    try {
      const result = await apiCallWithFormData('/upload/step1', formData);
      log.info(`[API] Step1 성공:`, result);
      return result;
    } catch (error) {
      console.error(`[API] Step1 실패:`, error);
      throw error;
    }
  },

  // Step 2: 연락처 정보 
  step2: async (formData: FormData): Promise<ApiResponse> => {
    log.info(`[API] Step2 호출 시작`);
    try {
      const result = await apiCallWithFormData('/upload/step2', formData);
      log.info(`[API] Step2 성공:`, result);
      return result;
    } catch (error) {
      console.error(`[API] Step2 실패:`, error);
      throw error;
    }
  },

  // Step 3: 영업시간 및 부대시설
  step3: async (formData: FormData): Promise<ApiResponse> => {
    log.info(`[API] Step3 호출 시작`);
    try {
      const result = await apiCallWithFormData('/upload/step3', formData);
      log.info(`[API] Step3 성공:`, result);
      return result;
    } catch (error) {
      console.error(`[API] Step3 실패:`, error);
      throw error;
    }
  },

  // Step 4: 이미지 및 의사 정보
  step4: async (formData: FormData): Promise<ApiResponse> => {
    log.info(`[API] Step4 호출 시작`);
    try {
      const result = await apiCallWithFormData('/upload/step4', formData);
      log.info(`[API] Step4 성공:`, result);
      return result;
    } catch (error) {
      console.error(`[API] Step4 실패:`, error);
      throw error;
    }
  },

  // Step 5: 치료 정보
  step5: async (formData: FormData): Promise<ApiResponse> => {
    log.info(`[API] Step5 호출 시작`);
    try {
      const result = await apiCallWithFormData('/upload/step5', formData);
      log.info(`[API] Step5 성공:`, result);
      return result;
    } catch (error) {
      console.error(`[API] Step5 실패:`, error);
      throw error;
    }
  },

  // Step 6: 시술/장비 정보
  step6: async (formData: FormData): Promise<ApiResponse> => {
    log.info(`[API] Step6 호출 시작`);
    try {
      const result = await apiCallWithFormData('/upload/step6', formData);
      log.info(`[API] Step6 성공:`, result);
      return result;
    } catch (error) {
      console.error(`[API] Step6 실패:`, error);
      throw error;
    }
  },

  // Step Last: 언어 설정 및 피드백
  step_last: async (formData: FormData): Promise<ApiResponse> => {
    log.info(`[API] Step_last 호출 시작`);
    try {
      const result = await apiCallWithFormData('/upload/step_last', formData);
      log.info(`[API] Step_last 성공:`, result);
      return result;
    } catch (error) {
      console.error(`[API] Step_last 실패:`, error);
      throw error;
    }
  },
};

// 에러 메시지 포맷팅
export function formatApiError(error: any): string {
  log.info(`[API] formatApiError 호출됨:`, error);
  log.info(`[API] error 타입:`, typeof error);
  log.info(`[API] error.message:`, error?.message);
  log.info(`[API] error.toString():`, error?.toString());
  
  if (error?.message) {
    log.info(`[API] error.message 반환:`, error.message);
    return error.message;
  }
  
  if (typeof error === 'string') {
    log.info(`[API] string error 반환:`, error);
    return error;
  }
  
  const fallbackMessage = '알 수 없는 오류가 발생했습니다. api-client error: ' + error;
  log.info(`[API] fallback 메시지 반환:`, fallbackMessage);
  return fallbackMessage;
}

// 성공 응답 확인
export function isApiSuccess(response: ApiResponse): boolean {
  const isSuccess = response.status === 'success';
  log.info(`[API] isApiSuccess 체크:`, { response, isSuccess });
  return isSuccess;
}

// 에러 응답 확인
export function isApiError(response: ApiResponse): boolean {
  const isError = response.status === 'error';
  log.info(`[API] isApiError 체크:`, { response, isError });
  return isError;
} 