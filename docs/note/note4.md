src/constants/device_list.json

이걸이용해서 
src/app/admin/upload/Step6SupportTreatments.tsx
에 추가할거야

지금은 시술선택만있는데
먼저 지금의 시술선택 기능을 별도 컴포넌트로 분리해줘

return (
    <main className="min-h-screen flex flex-col p-6">
      <h1 className="text-2xl font-bold mb-2">시술/보유장비 선택</h1>
      <span className="text-md text-red-500 font-base mb-6">선택하는 시술과 보유장비는 병원정보에 보여지며 검색등 병원 노출을 위해 다양한 용도로 활용됩니다.</span>

      이부분은 타이틀로 공통으로 사용할꺼야.

여기 아래에 탭을. 탭은  '제공시술' 과  '보유장비' 로 나뉘어.

'제공시술'선택시 아래의 src/components/SupportTreatment.tsx가 로딩돼.
src/components/SupportTreatment.tsx 에 파일을만들어놨어 여기에 분리해줘

'보유장비'선택시아래의 파일이 로딩돼.
src/components/SupportDevices.tsx


앞서 언급한 공통타이틀과 PageBottom은 
src/app/admin/upload/Step6SupportTreatments.tsx에만 존재해.



두 파일모두 입력결과를 parent인 
src/app/admin/upload/Step6SupportTreatments.tsx 
에서 최종적으로 받도록 해줘.

그러므로 PageBottom에 해당하는 handle 이벤트들은 
src/app/admin/upload/Step6SupportTreatments.tsx 에 남겨둬야지.


이후에는 서버에 전송하도록할건데 이건 본작업이 완료된후 요청할게.

 '제공시술' 과  '보유장비' 는 구분해서 저장해줘.