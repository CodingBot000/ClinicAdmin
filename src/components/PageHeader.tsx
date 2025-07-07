import { PropsWithChildren } from "react";
import { Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  name: string;
  onPreview: () => void;
  onSave: () => void;
  currentStep: number; // 1 ~ 5
  onStepChange?: (step: number) => void; // 스텝 변경 콜백 추가
}

const PageHeader = ({
  name,
  currentStep,
  children,
  onPreview,
  onSave,
  onStepChange,
}: PropsWithChildren<PageHeaderProps>) => {
  const router = useRouter();

  const handleHomeClick = () => {
    router.push("/admin");
  };

  const handlePreview = () => {
    onPreview();
  };

  const handleSave = () => {
    onSave();
  };

  const handleStepClick = (step: number) => {
    // 현재 단계 이전 단계만 클릭 가능
    if (step < currentStep && onStepChange) {
      onStepChange(step);
    }
  };

  return (
    <div className="sticky top-0 z-50">
      <div className="relative flex justify-center items-center bg-gray-200 py-3 px-6 text-[#464344]">
        {/* 홈 아이콘 */}
        <Home
          className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer"
          size={24}
          onClick={handleHomeClick}
        />

        {/* 중앙 name + Stepper */}
        <div className="flex flex-col items-center">
          <h1 className="font-bold text-[25px]">{name}</h1>

          {/* Stepper 아래 배치 */}
          <div className="flex gap-4 items-center mt-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                    step < currentStep
                      ? "bg-blue-500 border-blue-500 text-white cursor-pointer hover:bg-blue-600 hover:border-blue-600"
                      : step === currentStep
                      ? "bg-orange-500 border-orange-500 text-white cursor-default"
                      : "bg-white border-gray-400 text-gray-400 cursor-not-allowed"
                  }`}
                  onClick={() => handleStepClick(step)}
                  title={
                    step < currentStep
                      ? `Step ${step}로 이동`
                      : step === currentStep
                      ? "현재 단계"
                      : "아직 진행되지 않은 단계"
                  }
                >
                  {step}
                </div>
                {step !== 5 && (
                  <div className="w-8 h-1 bg-gray-400"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽 버튼 */}
        <div className="absolute right-4 flex gap-4">
          {/* <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            onClick={handleSave}
          >
            임시저장
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            onClick={handlePreview}
          >
            Preview
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
