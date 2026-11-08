# Báo cáo token

Giá tham chiếu kiểm tra ngày 2026-11-08. Chi phí tính bằng USD theo bảng giá trong `tools/token-report/pricing.json`.

## Tổng

- Tổng chi phí: $17.34
- Tổng token (input + output + cache): 34,515,492
- Số task có dữ liệu: 6

## Theo milestone

| Milestone | Số task | Chi phí |
|---|---|---|
| M0 | 6 | $6.77 |

## Theo loại task × model (chi phí trung bình mỗi task)

| Loại task | Vai trò | Model | Số task | Tổng | TB / task |
|---|---|---|---|---|---|
| devops | implement | sonnet | 3 | $2.93 | $0.98 |
| devops | review | sonnet | 3 | $0.72 | $0.24 |
| feature-logic | implement | opus | 1 | $1.48 | $1.48 |
| feature-logic | implement | sonnet | 1 | $0.53 | $0.53 |
| feature-logic | review | sonnet | 2 | $0.44 | $0.22 |
| scaffold | implement | sonnet | 1 | $0.43 | $0.43 |
| scaffold | review | sonnet | 1 | $0.25 | $0.25 |

## Model dự kiến vs thực tế (người implement)

| Dự kiến | Thực tế | Số task | TB / task |
|---|---|---|---|
| opus | opus | 1 | $1.48 |
| sonnet | sonnet | 5 | $0.78 |

## 5 task tốn kém nhất

| Task | Model | Chi phí |
|---|---|---|
| M0-T2 | mixed | $1.68 |
| M0-T6 | sonnet | $1.53 |
| M0-T5 | sonnet | $1.38 |
| M0-T3 | sonnet | $0.76 |
| M0-T4 | sonnet | $0.75 |

## Leo thang model (task dùng hơn 1 model)

- M0-T2: sonnet, opus

## Review

- Tỷ trọng review: $1.41 / $6.77 chi phí task (20.9%)

## Model chưa có giá (tính $0)

_Không có._

## Orchestration

- Chi phí orchestration: $10.57 (61.0% tổng)

> Lưu ý: chỉ tính phiên trên máy này.
