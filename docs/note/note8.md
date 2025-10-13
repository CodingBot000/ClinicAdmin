현재 src/app/api/upload/step6/route.ts  에는 이전에 사용하던 코드가 있어 

이건무시해
여기서 두가지 구현을 해야해

먼저 테이블 스키마는 
docs/database/device_catalog.md
를 참고해

src/app/admin/upload/Step6SupportTreatments.tsx
여기서 입력받은 값을
선택한 시술 id 리스트와
선택한 장비 id리스트를 모두

hospital_treatment_selection 
테이블에 Upsert할꺼야



내가   const handlePreview = () => {
    console.log('Selected Skin Items:', Array.from(selectedSkinItems));
    console.log('Selected Plastic Items:', Array.from(selectedPlasticItems));
  }; 
  라는 버튼을 만들어놧어 
여기에 api 콜을 구현하면돼.

