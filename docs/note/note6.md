src/components/SupportDevices.tsx

에
상단에 

 return (
    <div className="flex flex-col flex-1">
      {/* 피부/성형 탭 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('skin')}
            className={`px-4 py-2 rounded ${
              activeTab === 'skin'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {language === 'ko' ? '피부' : 'Skin'}
          </button>
          <button
            onClick={() => setActiveTab('plastic')}
            className={`px-4 py-2 rounded ${
              activeTab === 'plastic'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {language === 'ko' ? '성형' : 'Plastic Surgery'}
          </button>
        </div>
        <div className="flex gap-1 border rounded overflow-hidden">
          <button
            onClick={() => setLanguage('ko')}
            className={`px-3 py-1 text-sm ${
              language === 'ko'
                ? 'bg-gray-700 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            한글
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 text-sm ${
              language === 'en'
                ? 'bg-gray-700 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            English
          </button>
        </div>
      </div>

를 추가해주고 이화면에 나오는데이터를보면 
interface Device {
  id: string;
  ko: string;
  en: string;
  type: 'device' | 'drug' | 'program';
  group: string;
  dept: 'skin' | 'plastic' | 'both';
}

이렇게   dept: 'skin' | 'plastic' | 'both'; 가 있어

skin을 선택하면 dept가 skin인것과 both를 보여주고
plastic을 선택하면 dept가 plastic인것과 both를 보여줘

그리고 type 별로도 1뎁스를 분리해서 보여줘

both인경우는 중복해서 선택되지않도록해줘.
예를들어 skin에 both항목을 선택한상태에서 plastic 을 탭해서 같은 항목을 보면 이미 선택된상태로 보여져야해.

