# Báo cáo token

Giá tham chiếu kiểm tra ngày 2026-11-08. Chi phí tính bằng USD theo bảng giá trong `tools/token-report/pricing.json`.

## Tổng

- Tổng chi phí: $18.09
- Tổng token (input + output + cache): 37,377,878
- Số task có dữ liệu: 6

## Theo milestone

| Milestone | Số task | Chi phí |
|---|---|---|
| M0 | 6 | $7.09 |

## Theo loại task × model (chi phí trung bình mỗi task)

| Loại task | Vai trò | Model | Số task | Tổng | TB / task |
|---|---|---|---|---|---|
| devops | implement | sonnet | 3 | $3.07 | $1.02 |
| devops | review | sonnet | 3 | $0.91 | $0.30 |
| feature-logic | implement | opus | 1 | $1.48 | $1.48 |
| feature-logic | implement | sonnet | 1 | $0.53 | $0.53 |
| feature-logic | review | sonnet | 2 | $0.44 | $0.22 |
| scaffold | implement | sonnet | 1 | $0.43 | $0.43 |
| scaffold | review | sonnet | 1 | $0.25 | $0.25 |

## Model dự kiến vs thực tế (người implement)

| Dự kiến | Thực tế | Số task | TB / task |
|---|---|---|---|
| opus | opus | 1 | $1.48 |
| sonnet | sonnet | 5 | $0.80 |

## 5 task tốn kém nhất

| Task | Model | Chi phí |
|---|---|---|
| M0-T2 | mixed | $1.68 |
| M0-T5 | sonnet | $1.62 |
| M0-T6 | sonnet | $1.61 |
| M0-T3 | sonnet | $0.76 |
| M0-T4 | sonnet | $0.75 |

## Leo thang model (implementer dùng hơn 1 model)

_Không có._

## Review

- Tỷ trọng review: $1.60 / $7.09 chi phí task (22.5%)

## Model chưa có giá (tính $0)

_Không có._

## Orchestration

- Chi phí orchestration: $11.00 (60.8% tổng)

> Lưu ý: chỉ tính phiên trên máy này.
