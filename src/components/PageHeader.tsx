import { PropsWithChildren } from "react";
import { Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  name: string;
  onPreview: () => void;
  onSave: () => void;
}

const PageHeader = ({ name, children, onPreview, onSave }: PropsWithChildren<PageHeaderProps>) => {
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

  return (
    <div className="sticky top-0 z-50">
      <div className="relative flex justify-center items-center bg-gray-200 min-h-[55px] py-3 px-6 text-[#464344] font-bold text-[25px]">
        <Home className="absolute left-4" size={24} onClick={handleHomeClick} />
        <h1>{name}</h1>
        <button
          className="absolute right-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          onClick={handleSave}
        >
          임시저장
        </button>
        <button
          className="relative right-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          onClick={handlePreview}
        >
          Preview
        </button>
      </div>
    </div>
  );
};

export default PageHeader;
