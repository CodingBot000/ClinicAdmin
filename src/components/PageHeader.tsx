import { PropsWithChildren } from "react";
import { Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  name: string;
}

const PageHeader = ({ name, children }: PropsWithChildren<PageHeaderProps>) => {
  const router = useRouter();

  const handleHomeClick = () => {
    router.push('/admin');
  };

  return (
    <div className=" relative flex justify-center items-center bg-gray-200 min-h-[55px] py-3 px-6 text-[#464344] font-bold text-[25px] z-12">
      <Home className="absolute left-4" size={24} onClick={handleHomeClick} />
      <h1>{name}</h1>
      <div className="absolute right-4">{children}</div>
    </div>
  );
};

export default PageHeader;
