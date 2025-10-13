# Clinic Admin - Comprehensive Project Analysis

Generated: 2025-10-14

## Table of Contents
1. [Project Overview](#project-overview)
2. [Directory Structure](#directory-structure)
3. [Code Inventory](#code-inventory)
4. [Interface & Type Definitions Map](#interface--type-definitions-map)
5. [Import/Export Analysis](#importexport-analysis)
6. [Potential Issues](#potential-issues)
7. [Recommendations](#recommendations)

---

## 1. Project Overview

### Tech Stack Summary
- **Framework**: Next.js 15.3.3 (App Router)
- **React**: 19.0.0
- **TypeScript**: 5.x (strict mode enabled)
- **Database**: Supabase (PostgreSQL + Real-time)
- **Styling**: Tailwind CSS v4
- **State Management**:
  - Zustand (client state)
  - TanStack Query v5.79.0 (server state)
- **UI Components**: Radix UI, shadcn/ui pattern
- **Drag & Drop**: @dnd-kit
- **Chat**: Sendbird

### Project Purpose
A comprehensive clinic administration system for managing:
- Clinic information (multi-step wizard)
- Reservations/appointments (real-time)
- Doctor profiles
- Treatment catalogs
- Business hours
- Chat consultations
- Image galleries

### Main Dependencies
```json
{
  "@supabase/supabase-js": "^2.50.0",
  "@tanstack/react-query": "^5.79.0",
  "@sendbird/uikit-react": "^3.17.3",
  "@dnd-kit/core": "^6.3.1",
  "zustand": "^5.0.6",
  "next": "15.3.3",
  "react": "^19.0.0"
}
```

### Statistics
- **Total TypeScript Files**: 151
- **Components**: 48
- **Hooks**: 9
- **Utilities**: 19
- **API Routes**: 13
- **Pages**: 26
- **Total Import Statements**: 440 across 116 files

---

## 2. Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin pages
│   │   ├── chat/                 # Chat system (Sendbird)
│   │   │   └── [channelUrl]/    # Dynamic chat room
│   │   ├── consultation/         # Consultation management
│   │   ├── login/                # Admin login
│   │   ├── reservation/          # Reservation management
│   │   └── upload/               # Multi-step clinic upload wizard
│   │       ├── button/           # Upload navigation buttons
│   │       └── modal/            # Upload modals
│   ├── api/                      # API Routes
│   │   ├── devices/              # Device catalog API
│   │   ├── geocode/              # Address geocoding
│   │   ├── reservation/          # Reservation CRUD
│   │   ├── treatment-categories/ # Treatment categories
│   │   ├── upload/               # Multi-step upload API
│   │   │   ├── step1/            # Basic info
│   │   │   ├── step2/            # Contact info
│   │   │   ├── step3/            # Business hours
│   │   │   ├── step4/            # Images & doctors
│   │   │   ├── step5/            # Treatments
│   │   │   ├── step6/            # Support treatments/devices
│   │   │   │   └── feedback/     # Feedback submission
│   │   │   └── step_last/        # Languages & feedback
│   │   └── validate/             # Validation API
│   ├── contents/                 # Static content data
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Root page
├── components/                   # React components
│   ├── ClinicUpload/             # Empty directory (unused)
│   ├── modal/                    # Modal components
│   ├── ui/                       # shadcn/ui components
│   └── utils/                    # Component utilities
├── constants/                    # Constants and config
├── contexts/                     # React contexts
├── hooks/                        # Custom React hooks
├── lib/                          # Library code
├── provider/                     # React providers
├── stores/                       # Zustand stores
├── types/                        # TypeScript type definitions
└── utils/                        # Utility functions
    ├── address/                  # Address utilities
    ├── number-formating/         # Number formatting
    ├── regexp/                   # Regular expressions
    ├── rq/                       # React Query utilities
    ├── sql-generate-helper/      # SQL generators (scripts)
    └── validate-check/           # Validation utilities
```

---

## 3. Code Inventory

### 3.1 App Routes (Pages)

#### Admin Pages
| File | Purpose | Type |
|------|---------|------|
| `/admin/page.tsx` | Admin dashboard | Server Component |
| `/admin/AdminAuthWrapper.tsx` | Auth wrapper for admin routes | Client Component |
| `/admin/AdminPageClient.tsx` | Dashboard client component | Client Component |
| `/admin/layout.tsx` | Admin layout with navigation | Server Component |

#### Login
| File | Purpose | Type |
|------|---------|------|
| `/admin/login/page.tsx` | Admin login page | Client Component |

#### Chat System
| File | Purpose | Type |
|------|---------|------|
| `/admin/chat/page.tsx` | Chat list page | Server Component |
| `/admin/chat/ChatListClient.tsx` | Chat list client | Client Component |
| `/admin/chat/[channelUrl]/page.tsx` | Chat room page | Server Component |
| `/admin/chat/[channelUrl]/ChatRoomClient.tsx` | Chat room client | Client Component |

#### Reservation
| File | Purpose | Type |
|------|---------|------|
| `/admin/reservation/page.tsx` | Reservation list page | Server Component |
| `/admin/reservation/ReservationClient.tsx` | Reservation management | Client Component |

#### Consultation
| File | Purpose | Type |
|------|---------|------|
| `/admin/consultation/page.tsx` | Consultation submissions | Client Component |

#### Upload Wizard (7 Steps)
| File | Purpose | Type |
|------|---------|------|
| `/admin/upload/page.tsx` | Upload main page | Server Component |
| `/admin/upload/layout.tsx` | Upload layout | Server Component |
| `/admin/upload/ClinicInfoUploadClientWrapper.tsx` | Main wrapper | Client Component |
| `/admin/upload/ClinicInfoInsertClient.tsx` | Insert mode client | Client Component |
| `/admin/upload/Step1BasicInfo.tsx` | Step 1: Basic clinic info | Client Component |
| `/admin/upload/Step2BasicContactInfo.tsx` | Step 2: Contact info | Client Component |
| `/admin/upload/Step3BusinessHours.tsx` | Step 3: Business hours | Client Component |
| `/admin/upload/Step4ClinicImagesDoctorsInfo.tsx` | Step 4: Images & doctors | Client Component |
| `/admin/upload/Step5Treatments.tsx` | Step 5: Treatments | Client Component |
| `/admin/upload/Step6SupportTreatments.tsx` | Step 6: Support treatments/devices | Client Component |
| `/admin/upload/StepLastLanguagesFeedback.tsx` | Final: Languages & feedback | Client Component |
| `/admin/upload/UploadSkeleton.tsx` | Loading skeleton | Client Component |
| `/admin/upload/button/index.tsx` | Navigation buttons | Client Component |
| `/admin/upload/modal/index.tsx` | Surgery selection modal | Client Component |

### 3.2 API Routes

| Route | Purpose | HTTP Methods |
|-------|---------|--------------|
| `/api/devices/route.ts` | Fetch device catalog | GET |
| `/api/geocode/route.ts` | Geocode addresses | POST |
| `/api/reservation/route.ts` | Reservation CRUD | GET, POST, PATCH |
| `/api/treatment-categories/route.ts` | Treatment categories | GET |
| `/api/validate/route.ts` | Form validation | POST |
| `/api/upload/step1/route.ts` | Save step 1 data | POST |
| `/api/upload/step2/route.ts` | Save step 2 data | POST |
| `/api/upload/step3/route.ts` | Save step 3 data | POST |
| `/api/upload/step4/route.ts` | Save step 4 data | POST |
| `/api/upload/step5/route.ts` | Save step 5 data | POST |
| `/api/upload/step6/route.ts` | Save step 6 data | POST |
| `/api/upload/step6/feedback/route.ts` | Save feedback | POST |
| `/api/upload/step_last/route.ts` | Save final step | POST |

### 3.3 Components (48 files)

#### Form Components
- `AddressSection.tsx` - Address input with Daum Postcode
- `AddressPreviewCard.tsx` - Address preview display
- `AvailableLanguageSection.tsx` - Language selection
- `BasicInfoSection.tsx` - Basic info form
- `ContactsInfoSection.tsx` - Contact information
- `DaumPost.tsx` - Daum Postcode integration
- `DoctorInfoForm.tsx` - Doctor information form
- `DoctorInfoSection.tsx` - Doctor info section
- `ExtraOptions.tsx` - Extra facility options
- `InputField.tsx` - Reusable input field
- `LocationSelect.tsx` - Location dropdown
- `OpeningHoursForm.tsx` - Business hours form
- `ProductOptionInput.tsx` - Treatment option input

#### Upload Components
- `ClinicImageUploadSection.tsx` - Clinic image upload
- `ClinicImageThumbnailUploadSection.tsx` - Thumbnail upload
- `FileUploadSection.tsx` - Generic file upload
- `ImageUploadSection copy.tsx` - **DUPLICATE FILE**

#### Treatment Components
- `SupportDevices.tsx` - Support devices selection
- `SupportTreatment.tsx` - Support treatment selection
- `TreatmentSelectBox.tsx` - Treatment selection
- `TreatmentSelectedChips.tsx` - Selected treatment chips
- `TreatmentSelectedOptionInfo.tsx` - Treatment option info

#### Drag & Drop
- `SortableDoctorItem.tsx` - Sortable doctor card
- `SortableImageItem.tsx` - Sortable image card
- `DoctorOrderModal.tsx` - Doctor ordering modal
- `ImageOrderModal.tsx` - Image ordering modal

#### UI Components
- `Button.tsx` - Custom button
- `DoctorCard.tsx` - Doctor display card
- `Divider.tsx` - Section divider
- `LoadingSpinner.tsx` - Loading indicator
- `PageBottom.tsx` - Page bottom navigation
- `PageHeader.tsx` - Page header

#### Auth Components
- `AdminLogoutButton.tsx` - Logout button
- `AdminLoginForm.tsx` - Login form

#### Modal Components
- `modal/Modal.tsx` - Base modal components
- `modal/ModalOverlay.tsx` - Modal overlay
- `modal/PreviewClinicInfoModal.tsx` - Clinic info preview
- `modal/PreviewModal.tsx` - Generic preview modal
- `modal/SNSContentModal.tsx` - SNS content modal
- `modal/SupportTreatmentFeedbackModal.tsx` - Feedback modal
- `modal/TreatmentSelectModal.tsx` - Treatment selection modal
- `modal/index.ts` - Modal exports

#### UI Library (shadcn/ui)
- `ui/button.tsx` - Button component
- `ui/card.tsx` - Card component
- `ui/dialog.tsx` - Dialog component
- `ui/dropdown-menu.tsx` - Dropdown menu
- `ui/label.tsx` - Label component
- `ui/radio-group.tsx` - Radio group

#### Utility Components
- `utils/OverflowFixer.tsx` - Overflow fix utility

### 3.4 Hooks (9 files)

| Hook | Purpose | Dependencies |
|------|---------|--------------|
| `useFormAction.ts` | Form action state management | useState, useTransition |
| `useGetUser.ts` | Get current user | Supabase |
| `useInput.ts` | Input state management | useState |
| `useModal.ts` | Modal state management | useState |
| `useReservationRealtime.ts` | Real-time reservation updates | Supabase, TanStack Query |
| `useSendbirdUnreadCount.ts` | Sendbird unread count | Sendbird |
| `useSupabaseSession.ts` | Supabase session management | Supabase |
| `useTimer.ts` | Timer utility | useState, useEffect |
| `useTreatmentCategories.ts` | Fetch treatment categories | TanStack Query |

### 3.5 Libraries (8 files)

| File | Purpose |
|------|---------|
| `api-client.ts` | API client wrapper |
| `api-utils.ts` | API utilities and response types |
| `clinicUploadApi.ts` | **COMMENTED OUT** - Old upload API |
| `formDataHelper.ts` | FormData preparation utilities |
| `hospitalDataLoader.ts` | Load hospital data from Supabase |
| `hospitalDataMapper.ts` | Map hospital data structures |
| `supabaseClient.ts` | Supabase client initialization |
| `utils.ts` | General utilities (cn function) |

### 3.6 Utilities (19 files)

| File/Directory | Purpose |
|----------------|---------|
| `index.ts` | Utility exports |
| `categoryUtils.ts` | Category tree utilities |
| `delay.ts` | Async delay utility |
| `fetch.ts` | Fetch wrapper utilities |
| `inifinityQuery.ts` | Infinity query helpers |
| `logger.ts` | Logging utility (client/server) |
| `makeUploadImageFileName.ts` | Image filename generator |
| `security.ts` | Security utilities |
| `validateFormData.ts` | Form validation |
| `word.ts` | Word/text utilities |
| `address/daysYMDFormat.ts` | Date formatting |
| `address/getTimeStamp.ts` | Timestamp utilities |
| `address/mapDaumPostDataToHospitalAddress.ts` | Map Daum data |
| `number-formating/index.ts` | Number formatting |
| `regexp/index.ts` | Regular expressions |
| `rq/react-query.ts` | React Query config |
| `sql-generate-helper/generate-inserts.js` | **SCRIPT** - SQL generator |
| `sql-generate-helper/generate-inserts_surgery.js` | **SCRIPT** - SQL generator |
| `validate-check/validate-forms.ts` | Form validators |

### 3.7 Constants (7 files)

| File | Purpose |
|------|---------|
| `common.ts` | Common constants |
| `country.ts` | Country code data |
| `extraoptions.ts` | Extra facility options |
| `languages.ts` | Language list |
| `paths.ts` | Route paths |
| `reservation.ts` | Reservation constants |
| `tables.ts` | Supabase table names |

### 3.8 Contexts (1 file)

| File | Purpose |
|------|---------|
| `SendbirdContext.tsx` | Sendbird chat context |

### 3.9 Providers (1 file)

| File | Purpose |
|------|---------|
| `QueryProvider.tsx` | TanStack Query provider |

### 3.10 Stores (1 file)

| File | Purpose |
|------|---------|
| `useHospitalUUIDStore.ts` | Hospital UUID Zustand store |

### 3.11 Content Data (6 files)

| File | Purpose |
|------|---------|
| `location.ts` | Location data |
| `plasticSurgeryCategories.ts` | Plastic surgery categories |
| `plasticSurgeryCategories_old.ts` | **OLD VERSION** |
| `skinBeautyCategories.ts` | Skin beauty categories |
| `skinBeautyCategories_old.ts` | **OLD VERSION** |
| `treatments.ts` | Treatment data |

---

## 4. Interface & Type Definitions Map

### 4.1 Types by File

#### `/types/hospital.ts` (Core Hospital Types)
```typescript
export interface HospitalData {
  id_uuid: string;
  name: string;
  name_en: string;
  address_full_road: string;
  address_full_road_en: string;
  address_full_jibun: string;
  address_full_jibun_en: string;
  address_si: string;
  address_si_en: string;
  address_gu: string;
  address_gu_en: string;
  address_dong: string;
  address_dong_en: string;
  bname: string;
  bname_en: string;
  building_name: string;
  building_name_en: string;
  zipcode: string;
  latitude: number;
  longitude: number;
  address_detail: string;
  address_detail_en: string;
  directions_to_clinic: string;
  directions_to_clinic_en: string;
  location: string;
  imageurls: string[];
  thumbnail_url: string | null;
}

export interface HospitalDetailData {
  id_hospital: number;
  id_uuid_hospital: string;
  tel: string;
  email: string;
  introduction: string;
  introduction_en: string;
  kakao_talk: string;
  line: string;
  we_chat: string;
  whats_app: string;
  telegram: string;
  facebook_messenger: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  other_channel: string;
  map: string;
  etc: string;
  has_private_recovery_room: boolean;
  has_parking: boolean;
  has_cctv: boolean;
  has_night_counseling: boolean;
  has_female_doctor: boolean;
  has_anesthesiologist: boolean;
  specialist_count: number;
  sns_content_agreement: 1 | 0 | null;
  available_languages: string[];
}

export interface BusinessHourData {
  day_of_week: string;
  open_time: string | null;
  close_time: string | null;
  status: 'open' | 'closed' | 'ask';
}

export interface DoctorData {
  name: string;
  bio: string;
  image_url: string[];
  chief: number;
}

export interface TreatmentData {
  id_uuid_treatment: string;
  option_value: string;
  price: number;
  discount_price: number;
  price_expose: number;
  etc?: string;
}

export interface ExistingHospitalData {
  hospital: HospitalData | null;
  hospitalDetail: HospitalDetailData | null;
  businessHours: any[];
  doctors: any[];
  treatments: any[];
  feedback: string;
  contacts?: any[];
}
```

#### `/types/reservation.dto.ts` (Reservation Types)
```typescript
export interface ReservationInputDto {
  date?: string;
  time?: string;
  id_uuid?: string;
  id_user?: string;
  id_uuid_hospital: string;
  name: string;
  english_name?: string;
  passport_name?: string;
  nationality?: string;
  gender?: 'male' | 'female' | 'other';
  birth_date?: string;
  email?: string;
  phone: string;
  phone_korea?: string;
  preferred_date: string;
  preferred_time: string;
  visitor_count?: number;
  reservation_headcount?: number;
  treatment_experience?: boolean;
  area_to_improve?: string;
  consultation_request?: string;
  additional_info?: string;
  preferred_languages?: string[];
  status?: string;
  created_at?: string;
}

export interface ReservationOutputDto {
  data: ReservationInputDto[];
}

export interface ReservationResponseDto {
  data: ReservationInputDto | null;
  status: number;
  statusText: string;
}
```

#### `/app/api/reservation/reservation.dto.ts` (Duplicate)
```typescript
// EXACT DUPLICATE of /types/reservation.dto.ts
// Only difference: status vs status_code field
export interface ReservationInputDto { /* ... */ }
export interface ReservationOutputDto { /* ... */ }
export interface ReservationResponseDto { /* ... */ }
```

#### `/types/category.ts` (Category Types)
```typescript
export type CategoryNode = {
  key: number;
  name: string;
  label: string;
  unit?: string;
  department?: string;
  children?: CategoryNode[];
};

export type CategoryNodeTag = {
  id: string;
  key: string;
  ko: string;
  en: string;
  children?: CategoryNodeTag[];
};
```

#### `/types/devices.dto.ts` (Device Types)
```typescript
export interface Device {
  id: string;
  ko: string;
  en: string;
  type: 'device' | 'drug' | 'program';
  group: string;
  dept: 'skin' | 'plastic' | 'both';
}
```

#### `/types/address.ts` (Address Type)
```typescript
export type HospitalAddress = {
  address_full_road: string;
  address_full_road_en: string;
  address_full_jibun: string;
  address_full_jibun_en: string;
  address_si: string;
  address_si_en: string;
  address_gu: string;
  address_gu_en: string;
  address_dong: string;
  address_dong_en: string;
  bname: string;
  bname_en: string;
  building_name: string;
  building_name_en: string;
  zipcode: string;
  latitude: number;
  longitude: number;
};
```

#### `/types/alarm.ts` (Alarm Type)
```typescript
export interface AlarmDto {
  id_uuid_hospital: string;
}
```

#### `/types/basicinfo.ts` (Basic Info Type)
```typescript
export interface BasicInfo {
  // Not fully defined in scan
}
```

#### `/types/country-code.dto.ts` (Country Code Types)
```typescript
export interface CountryInputDto {}

export interface CountryCode {
  // Fields not shown in scan
}

export interface CountryOutputDto {
  // Fields not shown in scan
}
```

#### `/types/sns.ts` (SNS Constants)
```typescript
export const SNS_CHANNEL_LABELS = {
  kakao_talk: '카카오톡',
  line: '라인',
  we_chat: '위챗',
  whats_app: '왓츠앱',
  telegram: '텔레그램',
  facebook_messenger: '페이스북 메신저',
  instagram: '인스타그램',
  tiktok: '틱톡',
  youtube: '유튜브',
  other_channel: '기타 채널'
} as const;
```

#### `/lib/api-utils.ts` (API Types)
```typescript
export interface ApiResponse<T = any> {
  // Fields not shown in scan
}
```

#### `/utils/logger.ts` (Logger Type)
```typescript
export type Logger = typeof log;
```

### 4.2 Component-Level Interfaces

#### Form Components
- `DoctorInfoForm.tsx` - `DoctorInfo`, `DoctorInfoFormProps`
- `OpeningHoursForm.tsx` - `OpeningHour`, `OpeningHoursFormProps`, `DayOfWeek`
- `BasicInfoSection.tsx` - `BasicInfoSectionProps`, `SnsChannelKey`
- `ContactsInfoSection.tsx` - `ContactsInfoSectionProps`
- `DoctorInfoSection.tsx` - `DoctorInfoSectionProps`
- `AvailableLanguageSection.tsx` - `AvailableLanguageSectionProps`
- `AddressSection.tsx` - `AddressSectionProps`
- `FileUploadSection.tsx` - `FileUploadSectionProps`, `FileType`

#### Treatment Components
- `TreatmentSelectBox.tsx` - `ProductOption`, `TreatmentData`, `TreatmentSelectBoxProps`
- `TreatmentSelectedChips.tsx` - `ProductOption`, `TreatmentSelectedChipsProps`
- `TreatmentSelectedOptionInfo.tsx` - `ProductOption`, `TreatmentSelectedOptionInfoProps`
- `SupportDevices.tsx` - `SupportDevicesProps`, `TabType`
- `SupportTreatment.tsx` - `SupportTreatmentProps`, `TabType`

#### Modal Components
- `Modal.tsx` - `ModalBaseProps`, `ConfirmModalProps`, `AlertModalProps`
- `ModalOverlay.tsx` - `ModalOverlayProps`
- `PreviewClinicInfoModal.tsx` - `PreviewClinicInfoModalProps`, `TreatmentData`, `CombinedHospitalData`
- `PreviewModal.tsx` - `PreviewModalProps`, `CategoryNodeTag`, `Device`
- `TreatmentSelectModal.tsx` - `ProductOption`, `TreatmentSelectModalProps`
- `SupportTreatmentFeedbackModal.tsx` - `SupportTreatmentFeedbackModalProps`

#### UI Components
- `Button.tsx` - `ButtonProps`
- `InputField.tsx` - `InputFieldProps`, `TextAreaProps`
- `LoadingSpinner.tsx` - `LoadingSpinnerProps`
- `DoctorCard.tsx` - `DoctorCardProps`
- `PageHeader.tsx` - `PageHeaderProps`
- `PageBottom.tsx` - `PageBottomProps`
- `Divider.tsx` - `DividerProps`
- `LocationSelect.tsx` - `LocationSelectProps`
- `AddressPreviewCard.tsx` - `AddressPreviewCardProps`

#### Drag & Drop Components
- `SortableDoctorItem.tsx` - `SortableDoctorItemProps`
- `SortableImageItem.tsx` - `SortableImageItemProps`
- `DoctorOrderModal.tsx` - `DoctorOrderModalProps`
- `ImageOrderModal.tsx` - `ImageOrderModalProps`

#### Upload Components
- `ClinicImageUploadSection.tsx` - `ClinicImageUploadSectionProps`
- `ClinicImageThumbnailUploadSection.tsx` - `ClinicImageThumbnailUploadSectionProps`

#### Step Components
- `Step1BasicInfo.tsx` - `Surgery`, `Step1BasicInfoProps`
- `Step2BasicContactInfo.tsx` - `Step2BasicContactInfoProps`
- `Step3BusinessHours.tsx` - `Surgery`, `Step3BusinessHoursProps`
- `Step4ClinicImagesDoctorsInfo.tsx` - `Surgery`, `Step4ClinicImagesDoctorsInfoProps`
- `Step5Treatments.tsx` - `Step5TreatmentsProps`
- `Step6SupportTreatments.tsx` - `Step6SupportTreatmentsProps`, `MainTabType`
- `StepLastLanguagesFeedback.tsx` - `StepLastLanguagesFeedbackProps`

#### Other Page Components
- `AdminPageClient.tsx` - `AdminPageClientProps`
- `ReservationClient.tsx` - `ReservationClientProps`
- `ChatRoomClient.tsx` - `ChatRoomClientProps`

### 4.3 Hook Interfaces
- `useTimer.ts` - `useTimerProps`
- `useInput.ts` - `useInputProps`
- `useFormAction.ts` - `FormActionProps`, `State`

### 4.4 Context Interfaces
- `SendbirdContext.tsx` - `SendbirdContextType`, `SendbirdProviderProps`

### 4.5 Store Interfaces
- `useHospitalUUIDStore.ts` - `AlarmStore`

### 4.6 Utility Interfaces
- `utils/fetch.ts` - `IFetchUtils`
- `utils/index.ts` - `SidebarPath<T>`
- `utils/inifinityQuery.ts` - `infinityParamsType`
- `lib/formDataHelper.ts` - `PrepareFormDataParams`
- `utils/address/mapDaumPostDataToHospitalAddress.ts` - `DaumAddressData`

### 4.7 Duplicate Type Definitions

**CRITICAL**: Multiple components define the same interfaces locally:

1. **ProductOption** - Defined in 3 places:
   - `TreatmentSelectBox.tsx`
   - `TreatmentSelectedChips.tsx`
   - `TreatmentSelectedOptionInfo.tsx`
   - `modal/TreatmentSelectModal.tsx`

2. **Surgery** - Defined in 4 places:
   - `Step1BasicInfo.tsx`
   - `Step3BusinessHours.tsx`
   - `Step4ClinicImagesDoctorsInfo.tsx`
   - `modal/index.tsx`

3. **TabType** - Defined in 2 places:
   - `SupportDevices.tsx`
   - `SupportTreatment.tsx`

4. **CategoryNodeTag** - Defined in 2 places:
   - `/types/category.ts` (correct location)
   - `modal/PreviewModal.tsx` (duplicate)

5. **Device** - Defined in 2 places:
   - `/types/devices.dto.ts` (correct location)
   - `modal/PreviewModal.tsx` (duplicate)

6. **ReservationInputDto** - **EXACT DUPLICATE**:
   - `/types/reservation.dto.ts`
   - `/app/api/reservation/reservation.dto.ts`

---

## 5. Import/Export Analysis

### 5.1 Import Statistics
- **Total import statements**: 440 across 116 files
- **Average imports per file**: 3.8

### 5.2 Most Imported Modules

1. **React** - Used in all components
2. **@/lib/supabaseClient** - Used in 15+ files
3. **@/constants/tables** - Used in 10+ files
4. **@/types/hospital** - Used in 8+ files
5. **@/components/ui/** - Used throughout components
6. **@/utils/logger** - Used in lib and API routes

### 5.3 Unused Exports

Based on the analysis, the following files appear to have no imports:

1. **`/components/ImageUploadSection copy.tsx`** - Not imported anywhere
2. **`/app/contents/plasticSurgeryCategories_old.ts`** - Not imported anywhere
3. **`/app/contents/skinBeautyCategories_old.ts`** - Not imported anywhere
4. **`/lib/clinicUploadApi.ts`** - Completely commented out, not imported
5. **`/components/ClinicUpload/`** - Empty directory

### 5.4 Circular Dependencies

No obvious circular dependencies detected. The codebase follows a clean hierarchy:
- Types → Utils → Lib → Components → Pages
- API routes are independent

### 5.5 Import Patterns

**Good patterns:**
- Centralized type definitions in `/types`
- Consistent use of `@/` path alias
- Clear separation between client and server code

**Areas for improvement:**
- Some components import types from other components (e.g., `ProductOption`)
- Duplicate type definitions should be centralized

---

## 6. Potential Issues

### 6.1 Duplicate Files (HIGH PRIORITY)

1. **`/components/ImageUploadSection copy.tsx`**
   - Status: Not imported anywhere
   - Size: 9KB
   - Action: Safe to delete

2. **`/app/contents/plasticSurgeryCategories_old.ts`**
   - Status: Not imported anywhere
   - Action: Safe to delete if new version is confirmed working

3. **`/app/contents/skinBeautyCategories_old.ts`**
   - Status: Not imported anywhere
   - Action: Safe to delete if new version is confirmed working

### 6.2 Dead Code (HIGH PRIORITY)

1. **`/lib/clinicUploadApi.ts`**
   - Status: Entire file commented out (188 lines)
   - Purpose: Old upload API implementation
   - Action: Delete if functionality is confirmed in new API routes

2. **`/components/ClinicUpload/`**
   - Status: Empty directory
   - Action: Delete empty directory

### 6.3 Duplicate Type Definitions (MEDIUM PRIORITY)

These types should be moved to `/types` and imported:

1. **ProductOption** (4 occurrences)
   ```typescript
   // Should be in /types/treatment.ts
   interface ProductOption {
     id: string;
     ko: string;
     en: string;
     // ... other fields
   }
   ```

2. **Surgery** (4 occurrences)
   ```typescript
   // Should be in /types/hospital.ts or /types/surgery.ts
   interface Surgery {
     id: number;
     name: string;
     // ... other fields
   }
   ```

3. **TabType** (2 occurrences)
   ```typescript
   // Should be in /types/common.ts
   type TabType = 'skin' | 'plastic';
   ```

4. **CategoryNodeTag** (duplicate in PreviewModal.tsx)
   - Already defined in `/types/category.ts`
   - Remove from `PreviewModal.tsx` and import from types

5. **Device** (duplicate in PreviewModal.tsx)
   - Already defined in `/types/devices.dto.ts`
   - Remove from `PreviewModal.tsx` and import from types

### 6.4 Duplicate Reservation DTOs (HIGH PRIORITY)

**Problem**: Two identical files with slight variation:
- `/types/reservation.dto.ts` - Uses `status` field
- `/app/api/reservation/reservation.dto.ts` - Uses `status_code` field

**Solution**:
- Keep only `/types/reservation.dto.ts`
- Update API to import from types
- Standardize field naming

### 6.5 Inconsistent Naming

1. **File naming inconsistencies:**
   - Most components use PascalCase
   - Some use kebab-case (e.g., in constants)
   - Inconsistent between folders

2. **Type naming:**
   - Mix of `Interface` suffix and plain names
   - Mix of `Dto` suffix and plain names
   - `Props` suffix not always used

### 6.6 Missing Type Exports

Some types are defined but not exported from component files, making them harder to reuse:
- Component-level interfaces that could be useful elsewhere
- Local type definitions that duplicate existing types

### 6.7 Logger Usage

The `logger.ts` utility uses `globalThis` augmentation which is good, but:
- Not all files consistently use the logger
- Mix of `console.log` and `log.info` throughout codebase
- Should standardize on logger utility

### 6.8 SQL Generator Scripts

Files in `/utils/sql-generate-helper/`:
- `generate-inserts.js`
- `generate-inserts_surgery.js`

These appear to be development/migration scripts:
- Written in JavaScript (not TypeScript)
- Should be moved to `/scripts` directory at root level
- Or deleted if no longer needed

### 6.9 Commented Code

`/lib/clinicUploadApi.ts` is entirely commented out (188 lines). This should either be:
- Deleted if the functionality is replaced
- Moved to a documentation file if it serves as reference
- Uncommented if it's still needed

### 6.10 Empty Directory

`/components/ClinicUpload/` is completely empty and should be removed.

---

## 7. Recommendations

### 7.1 Immediate Actions (Do First)

#### Delete Unused Files
```bash
# Safe to delete immediately
rm src/components/"ImageUploadSection copy.tsx"
rm src/app/contents/plasticSurgeryCategories_old.ts
rm src/app/contents/skinBeautyCategories_old.ts
rm src/lib/clinicUploadApi.ts
rmdir src/components/ClinicUpload
```

**Impact**: Removes ~10KB+ of dead code, reduces confusion

#### Consolidate Reservation DTOs
```bash
# Keep: /types/reservation.dto.ts
# Delete: /app/api/reservation/reservation.dto.ts
# Update all imports in /app/api/reservation/
```

**Impact**: Single source of truth for reservation types

### 7.2 Type Consolidation (High Value)

Create `/types/common.ts`:
```typescript
// Common shared types
export type TabType = 'skin' | 'plastic';

export interface ProductOption {
  id: string;
  ko: string;
  en: string;
  // ... complete definition
}

export interface Surgery {
  id: number;
  name: string;
  // ... complete definition
}
```

Update all components to import from `/types/common.ts`:
- `TreatmentSelectBox.tsx`
- `TreatmentSelectedChips.tsx`
- `TreatmentSelectedOptionInfo.tsx`
- `modal/TreatmentSelectModal.tsx`
- `Step1BasicInfo.tsx`
- `Step3BusinessHours.tsx`
- `Step4ClinicImagesDoctorsInfo.tsx`
- `modal/index.tsx`
- `SupportDevices.tsx`
- `SupportTreatment.tsx`

**Impact**:
- Reduces duplicate code by ~100 lines
- Ensures type consistency
- Easier to maintain and update types

### 7.3 Remove Duplicate Type Definitions

In `modal/PreviewModal.tsx`, remove these interfaces and import from types:
```typescript
// Remove these:
// interface CategoryNodeTag { ... }
// interface Device { ... }

// Add these imports:
import { CategoryNodeTag } from '@/types/category';
import { Device } from '@/types/devices.dto';
```

**Impact**: Single source of truth, prevents type drift

### 7.4 Logging Standardization

1. Create a rule to always use the logger utility:
```typescript
// Don't use:
console.log('message');

// Use:
log.info('message');
```

2. Consider adding an ESLint rule to prevent `console.*` usage

3. Search and replace all `console.log` → `log.info` throughout codebase

**Impact**: Consistent logging, easier to disable in production

### 7.5 Move SQL Scripts

Move SQL generation scripts out of `/src`:
```bash
mkdir -p scripts
mv src/utils/sql-generate-helper/* scripts/
rm -rf src/utils/sql-generate-helper
```

**Impact**: Cleaner source directory, clear separation of build scripts

### 7.6 Reorganize Types

Create a clearer type structure:
```
/types
├── common.ts           # Shared types (TabType, ProductOption, Surgery)
├── hospital.ts         # Hospital-related types (existing)
├── reservation.ts      # Reservation types (rename from .dto.ts)
├── category.ts         # Category types (existing)
├── device.ts           # Device types (rename from .dto.ts)
├── address.ts          # Address types (existing)
├── api.ts              # API response types
└── forms.ts            # Form-specific types
```

**Impact**: Better organization, easier to find types

### 7.7 Component Organization

Consider moving step components into their own directory:
```
/app/admin/upload
├── steps/
│   ├── Step1BasicInfo.tsx
│   ├── Step2BasicContactInfo.tsx
│   ├── Step3BusinessHours.tsx
│   ├── Step4ClinicImagesDoctorsInfo.tsx
│   ├── Step5Treatments.tsx
│   ├── Step6SupportTreatments.tsx
│   └── StepLastLanguagesFeedback.tsx
├── button/
├── modal/
└── ...
```

**Impact**: Better organization, clearer structure

### 7.8 Documentation

Create additional documentation files:
```
/docs
├── project_analysis.md      # This file
├── api_documentation.md     # API route documentation
├── component_guide.md       # Component usage guide
├── type_reference.md        # Type definitions reference
└── development_guide.md     # Development setup and guidelines
```

### 7.9 Code Quality Improvements

1. **Add JSDoc comments** to:
   - All exported functions
   - All exported types/interfaces
   - All React components (especially props)

2. **Implement consistent error handling**:
   - Use try-catch in all API routes
   - Standardize error response format
   - Use ApiResponse type consistently

3. **Add prop validation**:
   - Consider using Zod for runtime validation
   - Add default props where appropriate

### 7.10 Testing Setup

Currently no test files detected. Consider adding:
```
/src
├── __tests__/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── lib/
```

Recommended testing stack:
- Vitest (faster than Jest)
- React Testing Library
- MSW for API mocking

---

## Summary Statistics

### File Counts
- **Total TypeScript files**: 151
- **Components**: 48
- **Hooks**: 9
- **Utilities**: 19
- **API Routes**: 13
- **Type Definition Files**: 9

### Code Health Metrics
- **Duplicate files**: 3 (need deletion)
- **Dead code files**: 2 (clinicUploadApi.ts, empty dir)
- **Duplicate type definitions**: 11+ instances across 4 types
- **Empty directories**: 1
- **Commented code**: 1 file (188 lines)

### Priority Actions
1. **Delete unused files** (immediate, zero risk)
2. **Consolidate reservation DTOs** (high priority, prevents bugs)
3. **Create `/types/common.ts`** (high value, reduces duplication)
4. **Remove duplicate types in PreviewModal** (quick win)
5. **Move SQL scripts** (organizational improvement)

### Code Quality Score: 7.5/10

**Strengths:**
- Well-organized directory structure
- Good use of TypeScript
- Consistent naming (mostly)
- Clean separation of concerns
- Modern React patterns (hooks, contexts)

**Areas for Improvement:**
- Duplicate type definitions
- Some dead code
- Inconsistent logging
- Missing tests
- Could use more documentation

---

## Conclusion

This is a well-structured Next.js application with good architectural decisions. The main areas for improvement are:

1. **Code cleanup** - Remove duplicates and dead code
2. **Type consolidation** - Centralize duplicate type definitions
3. **Logging standardization** - Use logger utility consistently
4. **Documentation** - Add more inline and external documentation
5. **Testing** - Add test coverage

The recommendations above provide a clear path to improving code quality and maintainability while maintaining the excellent structure that's already in place.

**Estimated cleanup time**: 4-6 hours for all immediate actions and type consolidation.

**Risk level**: Low - Most recommendations are safe refactorings with clear benefits.
