src/app/contents/plasticSurgeryCategories.ts
src/app/contents/skinBeautyCategories.ts

두개의 파일이 있어
보면 뎁스가 있어

탭으로 피부와 성형으로 나뉘어서 리스트가 나와 
피부를 선택하면 
src/app/contents/skinBeautyCategories.ts
를 보여주고

성형을 선택하면
src/app/contents/plasticSurgeryCategories.ts
를 보여줄거야

이것들을 뎁스 단위로 열고 닫을수있게 하고싶어

처음에 진입하면 1뎁스만 보여.

제일왼쪽에는 선택된 데이터들을 뎁스별로 보여주는 창이고 그 오른쪽에는 1뎁스를  배치하고 2뎁스는 오른쪽에 3뎁스는 또 오른쪽에 해서


세개의 창으로 split해줘

1뎁스가  2뎁스 데이터를 갖고있다면 열기버튼만 있고 2뎁스 데이터가 없다면  체크박스 만 있어 


2뎁스에 데이터가 3뎁스를 갖고있다면 열기버튼만 있고 
3뎁스 데이터가 없다면  체크박스 만 있어 


3뎁스도 마찬가지야.

1뎁스 2뎁스, 3뎁스 모두 제일위에  전체 라고 써진 체크박스가있어.

1뎁스의 전체를 선택하면 모든 1뎁스 2뎁스 3뎁스 모든 존재하는 시술이 선택돼


2뎁스의 전체를 선택하면 마찬가지로 2뎁스 3뎁스 전체가 다 선택돼


3뎁스도 마찬가지야


전체 체크박스는 전체체크박스를 체크시 전체선택되고, 체크해제하면 전체 해제가 되지.

전체가 체크된 상태에서 하나라도 선택해제되면 전체체크박스는 자동으로 체크해제돼 

이렇게 선택된 내용들은 useState로 기억하고있어야해 

여기에다가 만들어줘
src/app/admin/upload/Step6SupportTreatments.tsx

