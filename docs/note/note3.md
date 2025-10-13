현재 시드가 되는 데이터인 
src/app/contents/plasticSurgeryCategories.ts
src/app/contents/skinBeautyCategories.ts

에서 보면 

{ key: "face", label: "얼굴", name: "Face", children: [ { key: "filler", label: "필러", name: "Filler", children: [ { key: "full_face", label: "풀페이스", name: "Full Face" }, { key: "forehead_glabella", label: "이마/미간", name: "Forehead Glabella" }, { key: "nose", label: "코", name: "Nose" }, 생략  { key: "botox", label: "보톡스", name: "Botox", children: [ { key: "full_face", label: "풀페이스", name: "Full Face" }, { key: "chin", label: "턱", name: "Chin" }, 생략 { key: "fat_dissolving_contouring_injection", label: "지방분해/윤곽주사", name: "Fat Dissolving/Contouring Injection", children: [ { key: "full_face", label: "풀페이스", name: "Full Face" }, { key: "cheek_zygomatic", label: "볼/광대", name: "Cheek Zygomatic" }, { key: "chin", label: "턱", name: "Chin" }, { key: "nose", label: "코", name: "Nose" }, ], }, 생략 위에 내용을 보면 하위 key가 예를들어 full_face의 경우 모두 동일해 하지만 엄연히 상위카테고리가 다르면 다른 아이템인거지 그런데 현재 구현이 현재 key기준으로 선택지를 체크하다보니, full_face하나 선택했더니 +3 이 되어버려.


이런 이슈가있는데 
지피티에게 문의하니 예시로 아래처럼 패스형태로 관리를 하면
이런 이슈를 피할수있을거라고 하더라고


아래는 예시일뿐이고 이문제를 좀 해결해줄래 
  
  path: string[];      // ['face','filler','full_face']
  uid: string;         // 'face/filler/full_face'
  parentUid?: string;  // 'face/filler'
  isLeaf: boolean;

  그리고 추가적으로 파부 / 성형 도 구분가능해야해. 애당초 선택된 시술항목을 관리하는걸  피부용과 성형용을 별도의 객체로 해서 관리해줘.
  