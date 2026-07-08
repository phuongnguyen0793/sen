# UX Wireframes — MVP Screens

**Product:** Sen  
**Platforms:** React Native (primary), Next.js web (thin parity noted)  
**Tone:** Soft Vietnamese cultural (see `PRODUCT_ASSUMPTIONS.md`)  
**Languages:** English + Vietnamese — wireframes below show `vi-VN` copy; English strings live in `apps/*/src/lib/i18n/messages/en.ts` (see `TECH_DESIGN.md` §17).

ASCII wireframes for design handoff. Measurements are conceptual (mobile ~390×844).

---

## Navigation (mobile)

```
┌─────────────────────────────────────┐
│           [ Screen Body ]           │
├─────────┬─────────┬─────────┬───────┤
│  Home   │  Lịch   │  Món    │ Cài đặt│
└─────────┴─────────┴─────────┴───────┘
```

Tabs: Home · Lịch · Món · Cài đặt  
Reminders are nested under Cài đặt (and editable from onboarding).

---

## 1. Onboarding (≤ 4 steps)

### 1.1 Welcome / mục đích

```
┌─────────────────────────────────────┐
│                                     │
│              Sen                    │
│                                     │
│   Nhắc ăn chay đúng ngày âm —       │
│   mùng 1, rằm, và ngày bạn chọn.    │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  Bắt đầu                    │   │
│   └─────────────────────────────┘   │
│   Đã có tài khoản? Đăng nhập        │
│                                     │
└─────────────────────────────────────┘
```

### 1.2 Chọn lịch ăn chay (CAL-03)

```
┌─────────────────────────────────────┐
│  ←  Bạn ăn chay ngày nào?           │
│  Bước 2/4                           │
│                                     │
│  ○ Chỉ mùng 1                       │
│  ○ Chỉ ngày 15 (rằm)                │
│  ● Mùng 1 và ngày 15     [mặc định] │
│  ○ Tự chọn ngày âm…                 │
│                                     │
│  ☐ Ưu tiên món không hành tỏi       │
│     (chay niệm)                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Tiếp tục                   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

Custom lunar days sheet (when “Tự chọn”):

```
┌─────────────────────────────────────┐
│  Chọn ngày âm                       │
│  [1] [2] … [14] [15] … [29] [30]    │
│  Đã chọn: 1, 15, 23                 │
│  [ Xong ]                           │
└─────────────────────────────────────┘
```

### 1.3 Giờ nhắc (REM-01)

```
┌─────────────────────────────────────┐
│  ←  Khi nào nhắc bạn?               │
│  Bước 3/4                           │
│                                     │
│  ☑ Tối hôm trước          20:00  ›  │
│  ☑ Sáng ngày chay          07:00  ›  │
│  ☐ Thêm lần nhắc…                   │
│                                     │
│  Ví dụ: “Ngày mai mùng 1 — nhớ      │
│  ăn chay nhé.”                      │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Tiếp tục                   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 1.4 Tài khoản + quyền thông báo

```
┌─────────────────────────────────────┐
│  ←  Tạo tài khoản & bật nhắc        │
│  Bước 4/4                           │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Continuer avec Apple        │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  Tiếp tục với Google         │   │
│  └─────────────────────────────┘   │
│  ─── hoặc email ───                 │
│  [ email ]                          │
│  [ mật khẩu ]                       │
│  [ Tạo tài khoản ]                  │
│                                     │
│  Sau khi đăng nhập:                 │
│  hệ thống xin quyền Thông báo OS.   │
│                                     │
└─────────────────────────────────────┘
```

Notification permission system dialog → if denied, show in-app banner later (REM-05).

---

## 2. Home (UX-01)

```
┌─────────────────────────────────────┐
│  Xin chào, Lan          Streak 3🔥  │
│─────────────────────────────────────│
│                                     │
│  ┌─────────────────────────────┐   │
│  │  HÔM NAY LÀ NGÀY CHAY       │   │
│  │  Rằm tháng 6 (15/06 âm)     │   │
│  │  Dương: Thứ Tư, 08/07/2026  │   │
│  │                             │   │
│  │  [ Đã ăn chay ] [ Bỏ lỡ ]   │   │
│  └─────────────────────────────┘   │
│                                     │
│  Ngày chay kế tiếp                 │
│  Mùng 1 tháng 7 — còn 14 ngày      │
│  22/07/2026                        │
│                                     │
│  Gợi ý món hôm nay                 │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │Canh  │ │Đậu   │ │Cơm   │  ›     │
│  │bí đỏ │ │hũ    │ │nít   │        │
│  └──────┘ └──────┘ └──────┘        │
│                                     │
│  [✨ Gợi ý món bằng AI (còn 1/2)]  │
│                                     │
├─────────┬─────────┬─────────┬───────┤
│ ● Home  │  Lịch   │  Món    │ Cài đặt│
└─────────────────────────────────────┘
```

**Empty / not fasting day:**

```
│  ┌─────────────────────────────┐   │
│  │  Hôm nay không phải ngày    │   │
│  │  ăn chay theo lịch của bạn  │   │
│  │  Kế tiếp: Rằm — còn 3 ngày  │   │
│  └─────────────────────────────┘   │
```

**Notification disabled banner (REM-05):**

```
│  ⚠ Thông báo đang tắt — bật để     │
│    không quên ngày chay  [ Mở Cài đặt ]
```

---

## 3. Calendar / Lịch (CAL-01, CAL-02, CAL-06)

```
┌─────────────────────────────────────┐
│  ⟨  Tháng 7 2026  ⟩                 │
│  Âm: tháng 5–6                       │
│                                     │
│   T2  T3  T4  T5  T6  T7  CN        │
│            1   2   3   4   5        │
│           17  18  19  20  21        │
│    6   7  [8]  9  10  11  12        │
│   22  23  24● 25  26  27  28        │
│   13  14  15  16  17  18  19        │
│   29  30 ┌1┐  2   3   4   5         │
│          └─┘  fasting day           │
│   ...                               │
│                                     │
│  Chú thích: ● ngày chay  [ ] hôm nay│
│                                     │
│  Sắp tới (30 ngày)                  │
│  • 08/07 — Rằm tháng 6              │
│  • 22/07 — Mùng 1 tháng 7           │
│  • 06/08 — Rằm tháng 7              │
│                                     │
├─────────┬─────────┬─────────┬───────┤
│  Home   │ ● Lịch  │  Món    │ Cài đặt│
└─────────────────────────────────────┘
```

Each cell: solar day large, lunar day small below.

Day detail sheet on tap:

```
│  Thứ Tư, 08/07/2026                 │
│  15/06 năm Bính Ngọ (âm)            │
│  ● Ngày ăn chay (rằm)               │
│  Check-in: [Đã ăn chay] [Bỏ lỡ] …   │
│  Gợi ý món ›                        │
```

---

## 4. Reminders (nested in Settings)

```
┌─────────────────────────────────────┐
│  ←  Nhắc nhở                        │
│                                     │
│  Lịch ăn chay                       │
│  Mùng 1 và ngày 15            ›     │
│                                     │
│  Lịch nhắc                          │
│  ┌─────────────────────────────┐   │
│  │ ☑ Tối hôm trước     20:00   │   │
│  │ ☑ Sáng ngày chay     07:00   │   │
│  │ ☐ Follow-up chưa check-in    │   │
│  └─────────────────────────────┘   │
│                                     │
│  Trạng thái OS                      │
│  Thông báo: Đã bật ✓                │
│  (hoặc: Đang tắt — [Bật lại])       │
│                                     │
│  Múi giờ: Asia/Ho_Chi_Minh          │
│                                     │
└─────────────────────────────────────┘
```

Settings root also includes: Hồ sơ, Món yêu thích, Quyền riêng tư / Xóa tài khoản, Giới thiệu.

---

## 5. Recipes / Món (REC-*)

### 5.1 Feed

```
┌─────────────────────────────────────┐
│  Món chay                           │
│  [Tất cả] [Không hành tỏi] [Nhanh]  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Canh bí đỏ hạt sen         │   │
│  │  25 phút · Dễ · Niệm        │   │
│  │                         ♡   │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  Đậu hũ sốt cà              │   │
│  │  20 phút · Dễ               │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ✨ Gợi ý bằng AI  (2/2 hôm nay)│
│  └─────────────────────────────┘   │
│                                     │
├─────────┬─────────┬─────────┬───────┤
│  Home   │  Lịch   │ ● Món   │ Cài đặt│
└─────────────────────────────────────┘
```

### 5.2 Recipe detail

```
┌─────────────────────────────────────┐
│  ←                                  │
│  Canh bí đỏ hạt sen            ♡    │
│  25 phút · 2 phần · Thuần chay      │
│  Tags: niệm · dễ tiêu               │
│                                     │
│  Nguyên liệu                        │
│  • Bí đỏ 300g                       │
│  • Hạt sen 50g                      │
│  • …                                │
│                                     │
│  Cách làm                           │
│  1. …                               │
│  2. …                               │
│                                     │
│  [ Nấu hôm nay ]                    │
│  ⚠ Gợi ý ẩm thực, không phải lời    │
│    khuyên dinh dưỡng y tế.          │
└─────────────────────────────────────┘
```

### 5.3 AI generate sheet

```
┌─────────────────────────────────────┐
│  Gợi ý món bằng AI                  │
│  Bạn muốn ăn gì hôm nay?            │
│  [________________________]         │
│  VD: canh chua, ít dầu, 30 phút     │
│                                     │
│  Constraints từ hồ sơ:              │
│  ☑ Không hành tỏi  ☐ Không đậu nành │
│                                     │
│  [ Tạo gợi ý ]   Còn 1/2 lượt       │
│  Nội dung AI — kiểm tra trước khi nấu│
└─────────────────────────────────────┘
```

---

## 6. Web thin parity (Next.js)

| Route | Content |
|-------|---------|
| `/` | Marketing landing: hero “Sen”, CTA Sign in / Open web app, **EN \| VI** language toggle |
| `/login` | Auth + language toggle |
| `/app` | Home summary (today status + upcoming); header nav + language toggle |
| `/app/calendar` | Month grid + upcoming list |
| `/app/reminders` | Same reminder prefs as mobile |
| `/app/recipes` | Curated list only (AI optional / deferred) |
| `/blog` | Placeholder |

Web layout: left nav or top nav — not forced to match mobile tab bar.

---

## 7. Empty & error states (UX-03)

| Screen | Empty | Error |
|--------|-------|-------|
| Home | “Chưa có lịch nhắc — thiết lập trong 1 phút” | Retry toast for API |
| Recipes | “Sắp có món curated — thử AI hoặc quay lại sau” | AI fail → curated fallback cards |
| Calendar | N/A (always shows month) | Soft banner if sync failed; show cached |

---

## 8. Accessibility notes (P1)

- Dynamic Type: titles/body scale; fasting badge stays readable
- VoiceOver labels: “Ngày 8 tháng 7, âm 15, ngày ăn chay”
- Contrast: fasting highlight not color-only (dot + bold)
- Tap targets ≥ 44pt for check-in buttons

---

## 9. Motion (subtle, intentional)

1. Home fasting card: soft fade-in on day status
2. Check-in success: brief checkmark confirm
3. Calendar month swipe: horizontal page transition

No decorative particle/glow effects.

---

## 10. Language switcher (shipped in scaffold)

| Platform | Placement | Control |
|----------|-----------|---------|
| Web `/` | Top-right of landing | `EN` \| `VI` segmented toggle |
| Web `/login` | Top-right, beside back link | Same toggle |
| Web `/app/*` | App header, left of Home link | Same toggle |
| Mobile Login | Top-right overlay | Same toggle |
| Mobile Settings | Row labeled “Language” / “Ngôn ngữ” | Same toggle |

Persistence: `sen.locale` in `localStorage` (web) or SecureStore (mobile). Tab/screen titles update immediately when locale changes.
