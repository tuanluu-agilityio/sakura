# Sakura — Trang web thư giãn 3D: Thiết kế

Ngày: 2026-11-07 · Chủ dự án: Tuan Luu · Repo: `sakura` (GitHub public, tài khoản `tuanluu-agilityio`)

> Ký hiệu: **[Chủ dự án]** = do chủ dự án quyết định trong buổi trao đổi. **[AI quyết]** = AI tự quyết theo yêu cầu "tự quyết, ghi lại và báo cáo"; có thể bị đổi khi duyệt.

---

## 1. Ý tưởng và lý do

Một trang web duy nhất để **thư giãn**: một thế giới 3D nhỏ ở miền quê Nhật Bản mùa hoa anh đào. Người xem không có nhiệm vụ gì; họ chỉ ngắm, nghe và đi dạo.

Dự án còn có mục tiêu thứ hai, quan trọng ngang mục tiêu đầu: **thử nghiệm cách để AI làm phần mềm tiết kiệm nhất**. Mỗi task ghi lại loại việc, model đã làm, số token và chi phí. Dựa trên đó, các dự án sau sẽ ước lượng được chi phí và biết cách giao từng loại việc cho model rẻ nhất mà vẫn làm tốt, thay vì luôn dùng model mạnh nhất. **[Chủ dự án]**

### Thành công là gì
- Mở trang lên là thấy ngay: hoa anh đào rơi, núi Phú Sĩ phía sau, đoàn tàu chạy ngang ở xa, nhạc nhẹ nhàng, hai bạn trẻ (một nam, một nữ) ngắm hoa dưới gốc cây. **[Chủ dự án]**
- Người dùng điều khiển nhân vật riêng của mình, camera ở sau lưng kiểu GTA, đi dạo và chụp ảnh. **[Chủ dự án]**
- Chạy mượt trên cả máy tính và điện thoại. **[Chủ dự án]**
- Cuối dự án có bảng thống kê token và chi phí theo task, theo model và theo loại việc. **[Chủ dự án]**

### Mục tiêu / Không làm / Thất bại dù vẫn chạy được
- **Mục tiêu:** cảm giác yên bình và lãng mạn; phong cách **anime mềm mại** (phương án A: pastel, ánh sáng dịu, giống phim hoạt hình Nhật). **[Chủ dự án]**
- **Không làm ở giai đoạn này:** nói chuyện với nhân vật, ngồi ghế, nhiệm vụ, nhiều người chơi, tài khoản, lưu tiến trình, chu kỳ ngày đêm. **[Chủ dự án]** (ghế và hội thoại để lần sau) / **[AI quyết]** (phần còn lại)
- **Thất bại dù vẫn chạy được:**
  - Giật lag trên điện thoại.
  - Âm thanh to hoặc lặp gây khó chịu.
  - Giao diện rối, che mất khung cảnh.
  - Tải quá lâu mới thấy hình.
  - Nhìn "rẻ tiền", lệch hẳn khỏi phong cách anime.
  - Không đo được token cho từng task. **[AI quyết]**
- **Tránh:** không sao chép nhân vật, logo hay đoàn tàu có thương hiệu thật (ví dụ JR hay Ghibli). Mọi thứ đều là thiết kế chung chung, gốc. **[AI quyết]**

---

## 2. Trải nghiệm người dùng

### 2.1 Màn hình đầu (trước khi bấm)
- Màn hình tải nhẹ trên nền hồng pastel có thanh tiến trình. Khi tải xong thì cảnh hiện lên.
- **Cảnh quay điện ảnh tự chạy**: camera lướt chậm qua cây anh đào và hai bạn trẻ, phía sau là núi Phú Sĩ. Đoàn tàu chạy qua trong khoảng 10 giây đầu. **[Chủ dự án xác nhận]**
- Ở giữa dưới màn hình có tên trang và nút **"Bắt đầu dạo bước"**. Bấm nút này thì âm thanh bắt đầu phát (trình duyệt bắt buộc phải có một lần bấm) và camera chuyển ra sau lưng nhân vật người chơi. **[Chủ dự án xác nhận]**
- Nhạc chỉ phát sau khi người dùng bấm. Trước đó cảnh im lặng. **[AI quyết, theo giới hạn của trình duyệt]**

### 2.2 Thế giới
- **Kích thước:** khoảng **160 m × 160 m** đi được, xung quanh là đồi, rừng và hàng rào mềm để chặn. Thế giới nhỏ nhưng dày chi tiết. **[Chủ dự án xác nhận "khu vực nhỏ"; con số do AI quyết]**
- **Thành phần:**
  - **Cây anh đào chính** trên một gò đất nhỏ. Dưới gốc có **ghế đá**, nơi **hai bạn trẻ ngồi** ngắm hoa. Họ có hoạt ảnh nhẹ: thở, ngẩng nhìn lên, thỉnh thoảng quay sang nhau. Họ không đi lại. **[Chủ dự án xác nhận]**
  - Khoảng 8–15 cây anh đào phụ rải rác, cùng một hàng cây dọc con đường đất.
  - **Núi Phú Sĩ** ở xa, có đỉnh tuyết và lớp sương mờ dưới chân (chỉ để ngắm, không đến gần được).
  - **Đường ray nằm trên một con đê thấp** chạy ngang cảnh, giữa làng và núi. Có **một điểm chắn tàu** với chuông leng keng và đèn nhấp nháy khi tàu đến. **[AI quyết, thêm vào cho lãng mạn]**
  - **Đoàn tàu địa phương 3 toa** màu trắng kem, sọc xanh (thiết kế chung, không có thương hiệu), khoảng **75 giây chạy qua một lần**, xen kẽ hai chiều. **[AI quyết]**
  - Vài **ngôi nhà gỗ Nhật** mái ngói, ruộng lúa nhỏ, đèn đá, một cổng torii nhỏ, một con suối có cầu gỗ. **[AI quyết]**
  - Bầu trời xanh pastel chuyển dần sang hồng gần đường chân trời. Có mây trôi chậm. Thời điểm là **cuối buổi chiều**, cố định. **[AI quyết]**
- **Hoa anh đào rơi** (điểm nhấn chính):
  - Hàng nghìn cánh hoa bay theo gió, xoay lật, rơi xuống đất.
  - Thỉnh thoảng có **cơn gió** cuốn cánh hoa bay xoáy.
  - Cánh hoa phủ mỏng lên mặt đất quanh gốc cây.
  - Khi người chơi đi qua, cánh hoa gần chân bị hất nhẹ lên. **[AI quyết]**

### 2.3 Người chơi
- Một **nhân vật riêng**, khác hai bạn trẻ, với góc nhìn thứ ba sau lưng. **[Chủ dự án]**
- Hoạt ảnh: đứng yên, đi bộ, chạy nhẹ (không có nhảy). Va chạm được với cây, nhà, ghế, các nhân vật và ranh giới thế giới. Bước đi bám theo địa hình. **[AI quyết]**
- Không thể đi lên đường ray khi tàu đang chạy: có hàng rào hai bên đường ray, chỉ băng qua được ở điểm chắn tàu, và khi chắn đang hạ thì có va chạm chặn lại. **[AI quyết]**
- **Điều khiển máy tính:** **[AI quyết]**
  - WASD hoặc phím mũi tên để đi, Shift để chạy.
  - Kéo chuột (hoặc khóa chuột khi bấm vào màn hình) để xoay camera, cuộn chuột để zoom gần hoặc xa trong giới hạn.
  - **P** để chụp ảnh, **M** để tắt hoặc bật âm, **Esc** để mở menu.
- **Điều khiển điện thoại:** **[AI quyết]**
  - Cần điều khiển ảo ở nửa trái màn hình (đẩy xa thì chạy).
  - Vuốt nửa phải để xoay camera, chụm hai ngón để zoom.
  - Nút chụp ảnh và nút âm thanh ở góc.
  - Ưu tiên màn hình ngang. Màn hình dọc vẫn chạy, chỉ hiện gợi ý xoay ngang.

### 2.4 Chụp ảnh
- Bấm P hoặc nút máy ảnh: giao diện ẩn đi, có hiệu ứng chớp trắng nhẹ và tiếng màn trập, rồi lưu ảnh **PNG** ở độ phân giải màn hình (tối đa 2× nếu máy chịu được). Góc ảnh có một chữ ký nhỏ "sakura". **[AI quyết]**
- Trên điện thoại, nếu máy hỗ trợ thì dùng **chia sẻ của hệ điều hành** (Web Share API), nếu không thì tải file về. **[AI quyết]**

### 2.5 Âm thanh
- **Nhạc nền:** 2–3 bản piano hoặc koto nhẹ, phát lần lượt, chuyển bài mềm, âm lượng mặc định thấp (khoảng 40%). **[Chủ dự án: "du dương nhẹ nhàng"; chi tiết do AI quyết]**
- **Tiếng môi trường:** gió (to hơn khi có cơn gió), chim hót, suối chảy (to dần khi đến gần).
- **Tiếng tàu:** tiếng tàu chạy có hướng và khoảng cách (âm thanh không gian 3D), chuông ở điểm chắn tàu, tiếng còi xa thỉnh thoảng.
- **Tiếng bước chân** theo mặt đất (cỏ hoặc đất).
- **Menu cài đặt:** tắt/bật âm, thanh âm lượng nhạc, thanh âm lượng môi trường. Cài đặt được lưu trong `localStorage`. **[AI quyết]**
- **Nguồn âm thanh:** bản quyền CC0 hoặc tương đương cho phép dùng miễn phí cả mục đích thương mại, ưu tiên loại không bắt buộc ghi công. Ghi rõ nguồn trong `CREDITS.md`. **[AI quyết]**

### 2.6 Giao diện
- Tối giản, chữ mảnh, nền trong mờ, góc bo tròn.
- Tự ẩn sau khoảng 4 giây không thao tác, hiện lại khi di chuột hoặc chạm.
- Ngôn ngữ giao diện: **tiếng Việt và tiếng Anh**, mặc định theo ngôn ngữ trình duyệt, có nút đổi. **[AI quyết]**
- Menu (mở bằng Esc hoặc nút ☰): Tiếp tục · Âm thanh · Chất lượng (Tự động / Thấp / Trung bình / Cao) · Hướng dẫn điều khiển · Ghi công.

---

## 3. Yêu cầu kỹ thuật

### 3.1 Công nghệ **[AI quyết]**

| Phần | Lựa chọn | Lý do |
|---|---|---|
| 3D | **Three.js** (bản ổn định mới nhất lúc bắt đầu, khóa phiên bản) | Chủ dự án đề xuất. Phổ biến, AI viết tốt. Không thêm lớp trung gian. |
| Ngôn ngữ | **TypeScript** (strict) | Kiểu dữ liệu chính là "hợp đồng" giữa các module, giảm việc AI phải đọc code của nhau. |
| Build | **Vite** | Nhanh, cấu hình ít. |
| Test | **Vitest** (logic) + **Playwright** (smoke test trên trình duyệt) | |
| Joystick điện thoại | **nipplejs** | Nhỏ, ổn định. |
| Va chạm | Tự viết: hình tròn/hộp trên mặt phẳng + độ cao địa hình | Thế giới nhỏ, không cần engine vật lý nặng như Rapier hay Cannon. |
| Âm thanh | Web Audio qua `THREE.AudioListener` / `PositionalAudio` | Có sẵn trong Three.js, hỗ trợ âm thanh 3D. |
| Deploy | **Netlify** (tự build từ `main`, có bản xem thử cho mỗi PR) | **[Chủ dự án]** |

Không dùng: React, React Three Fiber, Babylon.js, game engine. Lý do: thêm lớp trừu tượng nghĩa là AI phải đọc nhiều hơn, tức là tốn token hơn.

### 3.2 Phong cách hình ảnh **[Chủ dự án: phương án A; cách làm do AI quyết]**
- **Toon shading** tự viết: 2–3 dải sáng mềm, viền sáng nhẹ (rim light) màu hồng hoặc vàng, bóng đổ màu tím nhạt thay vì đen.
- Màu chủ đạo: trời `#8ec5ff` → `#fde2ef`, cỏ `#9bd28a`/`#7cc06c`, hoa `#ffd6e6`/`#f7a8c8`, núi `#8aa6c9`. Ảnh phác thảo tham khảo: `.superpowers/brainstorm/*/content/visual-style.html` (phương án A).
- **Hậu kỳ**: bloom nhẹ, sương theo khoảng cách (màu hồng xanh), vignette mỏng. Ở mức chất lượng Thấp thì tắt bloom.
- Phần lớn cảnh được **tạo bằng code**: trời, núi, địa hình, cây, nhà, tàu, đường ray. Chỉ **nhân vật người và hoạt ảnh** lấy từ nguồn ngoài.
- **Nhân vật:** mô hình glTF có sẵn khung xương (rigged), phong cách stylized, bản quyền **CC0** (ưu tiên các bộ của Quaternius), rồi đổi màu, đổi chất liệu sang toon shader cho hợp phong cách. Cần 3 nhân vật khác nhau về trang phục và màu: người chơi, bạn nam, bạn nữ. Cần các hoạt ảnh: idle, walk, run, sit-idle. Nếu bộ đã chọn thiếu hoạt ảnh ngồi thì builder tự xử lý: chỉnh tư thế bằng code hoặc lấy hoạt ảnh CC0 khác. **[AI quyết]**

### 3.3 Hiệu năng **[AI quyết]**
- **Máy tính tầm trung:** 60 fps. **Điện thoại tầm trung** (ví dụ cỡ Android 2022, iPhone 12): ổn định ≥ 30 fps.
- **Tải trang:** tổng dung lượng lần đầu ≤ **12 MB** (nén). Hiện cảnh đầu tiên ≤ **4 giây** trên mạng 4G. Âm thanh tải sau khi người dùng bấm "Bắt đầu" (riêng nhạc bài đầu tải trước).
- **Ba mức chất lượng** (Thấp / Trung bình / Cao). Chế độ Tự động chọn mức theo thiết bị, rồi tự hạ mức nếu fps trung bình dưới ngưỡng trong 5 giây. Các mức khác nhau ở: số cánh hoa (khoảng 1.500 / 4.000 / 8.000), độ phân giải bóng đổ, bloom, pixel ratio (tối đa 1 / 1.5 / 2), khoảng cách nhìn và độ dày cỏ.
- Cánh hoa và cỏ dùng **InstancedMesh** và tính chuyển động trên GPU (vertex shader), không cập nhật từng cánh bằng JavaScript.
- Không có rò rỉ bộ nhớ khi chạy lâu, vì người dùng có thể để tab mở hàng giờ để thư giãn.

### 3.4 Trình duyệt
Chrome, Edge, Safari và Firefox bản mới (2 phiên bản gần nhất), Safari iOS 16 trở lên, Chrome Android. Dùng **WebGL2**. Nếu máy không hỗ trợ WebGL2 thì hiện một ảnh tĩnh của khung cảnh kèm thông báo nhẹ nhàng. **[AI quyết]**

### 3.5 Khả năng tiếp cận **[AI quyết]**
- Tôn trọng `prefers-reduced-motion`: giảm số cánh hoa, camera đầu trang không tự lướt.
- Mọi nút đều có nhãn và dùng được bằng bàn phím.

---

## 4. Kiến trúc mã nguồn (tối ưu cho AI) **[AI quyết]**

### 4.1 Nguyên tắc tiết kiệm token
1. **Mỗi tính năng là một thư mục riêng**, giao tiếp với phần khác qua một hợp đồng chung rất ngắn (`src/core/types.ts`). Agent làm tính năng nào thì chỉ cần đọc `CLAUDE.md` + `src/core/types.ts` + thư mục của tính năng đó.
2. **Mỗi thư mục tính năng có `README.md` ≤ 20 dòng** ghi: làm gì, export gì, phụ thuộc gì, các tham số chỉnh được. Agent đọc README thay vì đọc code.
3. **File code ≤ 200 dòng.** Shader để trong file `.glsl` riêng.
4. **`CLAUDE.md` ở gốc repo ≤ 60 dòng**: quy ước, lệnh chạy, cách đặt tên nhánh, cách ghi nhãn task, quy định "không được đọc".
5. **Issue tự đủ ngữ cảnh**: mỗi issue ghi rõ file nào được sửa, hợp đồng phải tuân theo, tiêu chí hoàn thành và model đề xuất. Nhờ vậy subagent không phải đi tìm hiểu cả repo.
6. **Tài liệu cho AI viết bằng tiếng Anh** (`CLAUDE.md`, README, issue, plan, code, commit), vì tiếng Việt có dấu tốn token gấp khoảng 2–3 lần. **Tài liệu cho người** (spec này, báo cáo thống kê) viết bằng tiếng Việt.
7. Không commit file lớn hoặc file nhị phân vào chỗ AI hay đọc. Asset để trong `public/assets/`, và `CLAUDE.md` ghi rõ không đọc thư mục này.

### 4.2 Cấu trúc thư mục
```
sakura/
├─ CLAUDE.md                 # ≤60 dòng, quy ước cho AI
├─ CREDITS.md                # nguồn và giấy phép của mọi asset
├─ netlify.toml
├─ index.html
├─ src/
│  ├─ main.ts                # khởi tạo, ghép các feature
│  ├─ core/                  # vòng lặp, renderer, event bus, quality, input, types
│  │  └─ types.ts            # HỢP ĐỒNG chung, thay đổi phải qua review
│  └─ features/
│     ├─ sky/  terrain/  fuji/  sakura-trees/  petals/  village/
│     ├─ railway/  train/  couple/  player/  camera/
│     ├─ audio/  photo/  ui/  intro/  postfx/
│     └─ <mỗi thư mục>: index.ts, README.md, *.glsl, *.test.ts
├─ public/assets/            # models/ audio/ textures/ (AI không đọc)
├─ tests/e2e/                # Playwright smoke test
├─ tools/token-report/       # script thống kê token
├─ reports/                  # tokens.csv, tokens-summary.md
└─ docs/superpowers/specs|plans/
```

### 4.3 Hợp đồng chung (bản phác thảo; builder hoàn thiện ở task đầu tiên)
```ts
interface Feature {
  name: string;
  init(ctx: WorldContext): Promise<void> | void;
  update?(dt: number, elapsed: number): void;
  setQuality?(q: QualityLevel): void;
  dispose?(): void;
}
interface WorldContext {
  scene; camera; renderer; clock;
  bus: EventBus;                    // sự kiện: 'train:approach', 'train:pass', 'wind:gust', 'photo:take', 'game:start'...
  terrain: { heightAt(x,z): number };
  colliders: ColliderRegistry;      // add(circle|box), resolve(pos, radius)
  quality: QualityLevel;
  input: InputState;                // trừu tượng hóa bàn phím, chuột và cảm ứng
  assets: AssetLoader;
}
```
- Các feature **không import lẫn nhau**. Mọi giao tiếp đi qua `ctx` và `bus`.
- Đây là điều kiện để các subagent làm song song mà không xung đột.

---

## 5. Quy trình làm việc **[Chủ dự án: GitHub Project, mỗi feature một nhánh, subagent song song; chi tiết do AI quyết]**

### 5.1 GitHub
- Repo **public** `tuanluu-agilityio/sakura`, nhánh mặc định `main`. **[Chủ dự án: public]**
- **GitHub Project (v2)** tên "Sakura", có các trường:
  - `Status` (Todo / In Progress / In Review / Done)
  - `Milestone`
  - `Task type` (scaffold, feature-logic, shader-visual, asset-sourcing, ui, audio, test, docs, devops, integration, perf)
  - `Size` (S/M/L)
  - `Model (planned)`, `Model (actual)`
  - `Input tokens`, `Output tokens`, `Cache write tokens`, `Cache read tokens`
  - `Cost (USD)`
  - `Agent runs` (số lần dispatch)
- Mỗi task là một issue, gắn vào Project và một milestone.

### 5.2 Nhánh và merge
- Nhánh: `feat/<số-issue>-<tên-ngắn>`. Những việc nhỏ không phải tính năng dùng `chore/<số>-...`.
- **Mỗi subagent làm trong một git worktree riêng** trên đúng nhánh của task, nhờ vậy nhiều agent chạy song song không giẫm lên nhau.
- Xong task thì mở PR có dòng `Closes #N`. **CI** (GitHub Actions) chạy typecheck, Vitest, build và Playwright smoke test. Netlify tạo bản xem thử. Agent điều phối review bằng `/code-review` mức thấp. Khi tất cả đạt thì **squash merge vào `main`** và xóa nhánh.
- **Không chờ người duyệt từng PR.** **[AI quyết, theo yêu cầu "tránh hỏi lại"]** Chủ dự án duyệt tại các mốc milestone qua link Netlify.
- Thay đổi `src/core/types.ts` sau milestone M0 phải làm trong một PR riêng, merge trước, rồi các nhánh khác rebase theo.

### 5.3 Chọn model cho task **[AI quyết, là giả thuyết để kiểm chứng bằng số liệu]**

| Model | Giao loại việc |
|---|---|
| **Haiku** | cấu hình, file boilerplate, docs/README, `CREDITS.md`, tìm và tải asset, UI đơn giản, test đơn giản |
| **Sonnet** | phần lớn tính năng: địa hình, làng, đường ray, tàu, âm thanh, chụp ảnh, giao diện, điều khiển điện thoại, script thống kê token |
| **Opus** | thiết kế hợp đồng core, shader toon và cánh hoa, điều khiển nhân vật và camera, tối ưu hiệu năng, tích hợp và review cuối milestone |

- Quy tắc nâng cấp: nếu một task chạy bằng model rẻ mà thất bại 2 lần (test đỏ hoặc review không đạt) thì chạy lại bằng model cao hơn một bậc. **Ghi lại cả lần thất bại**, vì đó là dữ liệu quý cho thống kê.
- Agent điều phối (phiên chính) dùng Opus. Token của nó được tính vào mục `orchestration`.

### 5.4 Song song
- Sau M0 (khung dự án và hợp đồng core), các task trong cùng milestone không phụ thuộc nhau, nên chạy song song **tối đa 4 subagent** cùng lúc. **[AI quyết, để cân bằng tốc độ và độ an toàn khi merge]**
- Plan phải ghi rõ đồ thị phụ thuộc giữa các task.

### 5.5 Đo token **[Chủ dự án: thống kê theo task; cách làm do AI quyết]**
- **Nguồn dữ liệu:**
  - Log của Claude Code: `~/.claude/projects/<thư-mục-dự-án>/*.jsonl`, của subagent ở `.../<session>/subagents/agent-*.jsonl` kèm file `*.meta.json` (có `description`). Các thư mục log của worktree cũng được quét: tên thư mục chứa `sakura`.
  - Mỗi dòng `assistant` có `message.model`, `message.usage` (input, output, cache_creation, cache_read), `message.id`, `gitBranch` và `timestamp`.
- **Gán token cho task**, theo thứ tự ưu tiên:
  1. Trường `description` của subagent bắt đầu bằng `[#N]`. **Bắt buộc** mọi lần dispatch phải có nhãn này.
  2. `gitBranch` khớp mẫu `feat|chore/N-...`.
  3. Còn lại thì tính vào `orchestration`.
- **Khử trùng lặp** theo `message.id`, vì một tin nhắn có thể xuất hiện nhiều dòng log.
- **Tính tiền** bằng bảng giá `tools/token-report/pricing.json`, mỗi model có giá input, output, cache write và cache read. **Builder phải kiểm tra giá hiện hành** qua skill `claude-api` khi tạo file và ghi ngày kiểm tra.
- **Kết quả đầu ra:**
  - `reports/tokens.csv`, mỗi dòng là một task và model.
  - `reports/tokens-summary.md` bằng tiếng Việt: tổng theo task, theo model, theo loại việc, theo milestone; chi phí trung bình mỗi loại việc cho từng model; số lần nâng cấp model.
  - Cập nhật các trường token và chi phí trên GitHub Project bằng `gh project item-edit`.
- **Cách chạy:** `npm run tokens` chạy tay. Agent điều phối **bắt buộc chạy sau mỗi lần merge PR** và ở cuối mỗi milestone.
- Script là Node + TypeScript, không cần thư viện ngoài. Có test bằng file log mẫu.

### 5.6 Làm tiếp sau khi tắt máy giữa chừng **[Chủ dự án: yêu cầu; cách làm do AI quyết]**
Mục tiêu: mở phiên mới thì AI biết ngay việc tiếp theo, chỉ tốn khoảng 1–2 nghìn token, không phải đọc lại spec, plan hay lịch sử chat.

- **Nguồn sự thật là GitHub** (Project, issue, PR, nhánh), không phải trí nhớ của AI hay lịch sử chat. Tất cả đều nằm trên mạng, nên tắt máy không mất gì.
- **`docs/STATE.md` dài ≤ 30 dòng, viết bằng tiếng Anh**, là "sổ bàn giao", gồm:
  - Mốc hiện tại.
  - Các task đang làm dở: số issue, nhánh, worktree, bước đã xong và bước tiếp theo.
  - Các task sẵn sàng làm tiếp (đã đủ phụ thuộc).
  - Các vấn đề đang chặn.
  - Thời điểm cập nhật cuối.

  Agent điều phối **cập nhật và push file này** mỗi khi dispatch một task, merge một PR hoặc xong một mốc.
- **Mỗi issue có một danh sách bước (checklist).** Subagent đánh dấu từng bước khi xong, nên làm dở thì biết đã đến đâu.
- **Commit và push thường xuyên:** subagent commit kiểu WIP và push lên nhánh sau mỗi bước, rồi mở **draft PR** ngay từ commit đầu. Nhờ vậy dù máy tắt đột ngột thì việc làm dở vẫn còn trên GitHub.
- **Lệnh `npm run resume`** (script Node) in ra một bản tóm tắt ngắn:
  - Nội dung `STATE.md`.
  - Các issue đang `In Progress` trên Project.
  - Các PR đang mở cùng trạng thái CI.
  - Các worktree hoặc nhánh còn thay đổi chưa commit, hoặc chưa push.
  - Gợi ý hành động tiếp theo.
- **Hook khởi động phiên** trong `.claude/settings.json` của dự án tự chạy `npm run resume --silent` khi mở Claude Code, nên AI thấy ngay tình trạng mà không cần ai nhắc.
- **`CLAUDE.md` có mục "Khi bắt đầu phiên":** đọc kết quả resume; không đọc lại spec hay plan, trừ phần task đang làm; tiếp tục task dở trước, task mới sau.
- **Plan được chia thành từng file nhỏ cho mỗi milestone** (`docs/superpowers/plans/M1-....md`), nên khi làm tiếp chỉ cần đọc đúng file của mốc hiện tại.
- **Task bị gián đoạn:** khi chạy lại task, subagent đọc checklist của issue cộng với `git log` của nhánh, rồi làm tiếp từ bước chưa xong, không làm lại từ đầu. Lần chạy lại vẫn mang nhãn `[#N]`, nên token vẫn được tính đúng cho task đó (trường `Agent runs` tăng thêm 1).

---

## 6. Các mốc (milestone) **[AI quyết]**

| Mốc | Nội dung | Chủ dự án kiểm tra |
|---|---|---|
| **M0 Nền móng** | repo GitHub, Project và các trường, khung Vite + TS, `CLAUDE.md`, `src/core` + hợp đồng, CI, `netlify.toml`, công cụ đo token, `STATE.md` + `npm run resume` + hook khởi động | link Netlify hiện một cảnh trống; `npm run tokens` chạy được |
| **M1 Khung cảnh tĩnh** | trời, núi Phú Sĩ, địa hình và cỏ, cây anh đào, cánh hoa rơi + gió, toon shader, hậu kỳ, mức chất lượng | đứng một chỗ nhìn đã thấy đẹp |
| **M2 Sự sống** | đường ray, đê và điểm chắn tàu, đoàn tàu chạy theo lịch, làng (nhà, ruộng, đèn đá, torii, suối, cầu), hai bạn trẻ ngồi ghế | cảnh "sống" |
| **M3 Dạo bước** | nhân vật người chơi, điều khiển và va chạm, camera sau lưng, điều khiển điện thoại, cánh hoa bị hất | đi dạo được trên máy tính và điện thoại |
| **M4 Âm thanh** | nhạc nền, tiếng môi trường, âm thanh 3D của tàu và chuông, tiếng bước chân, cài đặt âm lượng | nghe dễ chịu |
| **M5 Trải nghiệm** | màn hình tải, cảnh mở đầu + nút "Bắt đầu", giao diện, menu, Việt/Anh, chụp ảnh, ảnh dự phòng khi thiếu WebGL2, `CREDITS.md` | trải nghiệm trọn vẹn |
| **M6 Hoàn thiện** | đo và tối ưu hiệu năng trên điện thoại, kiểm tra rò rỉ bộ nhớ, sửa lỗi, báo cáo token cuối, README cho người | bản phát hành v1 |

Các mốc M1, M2 và M4 có nhiều task song song được. M3 phụ thuộc M1 (địa hình, collider). M5 phụ thuộc phần lớn các mốc còn lại.

---

## 7. Kiểm thử và tiêu chí hoàn thành **[AI quyết]**
- **Mỗi PR:** `tsc --noEmit` sạch, Vitest xanh, `vite build` chạy được, Playwright smoke test đạt (trang tải xong, có canvas, không lỗi console, bấm "Bắt đầu" thì vào được chế độ chơi; chạy trên viewport máy tính và viewport điện thoại).
- **Logic thuần có unit test:** lịch tàu, va chạm, độ cao địa hình, chọn mức chất lượng, gán token, tính tiền.
- **Phần hình ảnh** không viết test ảnh tự động. Thay vào đó, agent chụp màn hình bằng Playwright đính kèm vào PR, còn chủ dự án xem trên Netlify ở mỗi mốc.
- **Hiệu năng:** M6 có một script Playwright đo fps trung bình trong 30 giây (giả lập điện thoại có giới hạn CPU), ghi vào `reports/perf.md`.

---

## 8. Phần để builder tự quyết
- Chọn chính xác bộ nhân vật và hoạt ảnh CC0, các bản nhạc và hiệu ứng âm thanh cụ thể (miễn đúng giấy phép, có trong `CREDITS.md` và vừa ngân sách dung lượng).
- Bố trí cụ thể các vật thể trên bản đồ, đường đi của camera mở đầu, thuật toán tạo cây và hình dạng cánh hoa.
- Chi tiết shader, các hằng số hiệu ứng, cách hạ mức chất lượng.
- Cách tạo worktree (công cụ worktree của Agent tool, hoặc `git worktree add` rồi agent chuyển sang đúng nhánh `feat/N-...`), miễn đúng tên nhánh và có nhãn `[#N]`.
- Chia nhỏ task trong mỗi milestone, miễn mỗi task ≤ khoảng nửa ngày công người và có model đề xuất.

## 9. Quyết định bổ sung sau vòng review **[AI quyết, tất cả]**
1. **Ngân sách:**
   - Không đặt trần cứng.
   - Cuối mỗi mốc, agent điều phối báo tổng token và chi phí của mốc đó trong `reports/tokens-summary.md`.
   - **Dừng lại và báo chủ dự án** khi: một task đã chạy quá 3 lần mà vẫn chưa đạt, hoặc chi phí một mốc vượt **2 lần** chi phí trung bình của các mốc trước. Từ M1 trở đi mới áp dụng; M0 dùng làm mốc chuẩn.
2. **Chất lượng sản phẩm đặt trước.** Mỗi task được giao cho model có khả năng làm tốt nhất theo bảng 5.3, không cố tình giao việc khó cho model yếu chỉ để lấy số liệu. Dữ liệu so sánh giữa các model đến từ quy tắc nâng cấp (mục 5.3) và từ việc các loại task khác nhau dùng model khác nhau.
3. **Nhân vật**, thứ tự dự phòng:
   - (a) Bộ CC0 của Quaternius: nhân vật stylized + Universal Animation Library.
   - (b) Nhân vật CC0 khác, chuyển (retarget) hoạt ảnh từ bộ (a) sang.
   - (c) Nhân vật chibi tự dựng bằng khối cơ bản, có khung xương đơn giản và hoạt ảnh viết bằng code.

   Được dùng giấy phép CC0 hoặc CC-BY (có ghi công). **Không mua asset trả phí.** Task tìm nhân vật đặt **ở đầu M1** (chạy song song với phần cảnh) để M2 và M3 không bị chặn.
4. **Âm thanh:**
   - Agent tìm nguồn CC0 hoặc CC-BY và kiểm tra giấy phép tự động.
   - Nếu chưa tìm được bản phù hợp thì dùng **âm thanh tạo bằng code (Web Audio)**: tiếng gió từ nhiễu lọc, nhạc tự sinh theo thang ngũ cung kiểu Nhật với âm sắc piano/koto, chuông chắn tàu tổng hợp.
   - Cấu trúc module audio cho phép thay file thật vào sau mà không phải sửa code.
5. **Duyệt hình ảnh khi không có người:**
   - Mỗi PR về hình ảnh có ảnh chụp màn hình từ Playwright. Agent điều phối xem ảnh đó và so với spec cùng ảnh phác thảo phương án A trước khi merge.
   - Nếu ở cuối mốc chủ dự án chê, phần sửa được làm thành issue mới trong mốc kế tiếp. Được phép revert PR nếu cần.
6. **Hiệu năng trên máy thật:**
   - M6 có một **điểm kiểm tra bởi người**: chủ dự án mở link Netlify trên điện thoại của mình. Trang có nút bật hiển thị fps bằng `?debug=1`.
   - Nếu chưa kiểm tra được trên máy thật thì tiêu chí tạm là: giả lập điện thoại với CPU chậm đi 4 lần, chất lượng Thấp, đạt ≥ 30 fps.
7. **Đo token:**
   - Mọi phiên làm việc chạy trên **máy hiện tại** của chủ dự án.
   - Script ghi rõ giới hạn: phiên chạy ở máy khác hoặc trên claude.ai/code sẽ không được tính.
   - Không xóa log trong `~/.claude/projects`.
8. **GitHub:** đã kiểm tra. `gh` đã đăng nhập `tuanluu-agilityio` với các quyền `repo`, `project`, `workflow`, nên M0 không cần thao tác tay. Riêng Netlify vẫn cần kết nối một lần (mục 10).
9. **Ngân sách dung lượng 12 MB** chỉ tính cho lần tải đầu, **không gồm âm thanh** (trừ bài nhạc đầu, ≤ 1.5 MB). Âm thanh tải sau khi người dùng bấm "Bắt đầu". Nếu vẫn vượt thì cắt theo thứ tự: độ phân giải texture → số cây phụ → chi tiết làng. Giữ nguyên chất lượng nhân vật và cánh hoa.

## 10. Việc chủ dự án phải tự làm (không tự động được)
- **Kết nối Netlify với repo GitHub một lần** (đăng nhập Netlify → Import from GitHub → chọn `sakura`). Có thể làm sau M0. Trước khi kết nối, link Netlify chưa có, còn CI vẫn chạy bình thường.
