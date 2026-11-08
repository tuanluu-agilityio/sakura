# Báo cáo token

Giá tham chiếu kiểm tra ngày 2026-11-08. Chi phí tính bằng USD theo bảng giá trong `tools/token-report/pricing.json`.

## Tổng

- Tổng chi phí: $60.29
- Tổng token (input + output + cache): 122,379,780
- Số task có dữ liệu: 19

## Theo milestone

| Milestone | Số task | Chi phí |
|---|---|---|
| M0 | 6 | $7.16 |
| M1 | 8 | $20.01 |
| M2 | 5 | $11.06 |

## Theo loại task × model (chi phí trung bình mỗi task)

| Loại task | Vai trò | Model | Số task | Tổng | TB / task |
|---|---|---|---|---|---|
| asset-sourcing | implement | sonnet | 1 | $1.07 | $1.07 |
| asset-sourcing | review | sonnet | 1 | $0.20 | $0.20 |
| devops | implement | sonnet | 3 | $3.13 | $1.04 |
| devops | review | sonnet | 3 | $0.91 | $0.30 |
| feature-logic | implement | opus | 1 | $1.48 | $1.48 |
| feature-logic | implement | sonnet | 5 | $4.42 | $0.88 |
| feature-logic | review | sonnet | 6 | $1.20 | $0.20 |
| integration | review | opus | 2 | $9.05 | $4.53 |
| integration | review | sonnet | 2 | $0.51 | $0.25 |
| scaffold | implement | sonnet | 1 | $0.43 | $0.43 |
| scaffold | review | sonnet | 1 | $0.25 | $0.25 |
| shader-visual | implement | opus | 3 | $10.72 | $3.57 |
| shader-visual | implement | sonnet | 3 | $3.28 | $1.09 |
| shader-visual | review | sonnet | 6 | $1.57 | $0.26 |

## Model dự kiến vs thực tế (người implement)

| Dự kiến | Thực tế | Số task | TB / task |
|---|---|---|---|
| opus | opus | 4 | $3.05 |
| sonnet | sonnet | 13 | $0.95 |

## 5 task tốn kém nhất

| Task | Model | Chi phí |
|---|---|---|
| M2-T5 | mixed | $5.11 |
| M1-T1 | mixed | $4.59 |
| M1-T8 | mixed | $4.46 |
| M1-T6 | mixed | $4.20 |
| M1-T5 | mixed | $2.66 |

## Leo thang model (implementer dùng hơn 1 model)

_Không có._

## Review

- Tỷ trọng review: $13.69 / $38.23 chi phí task (35.8%)

## Model chưa có giá (tính $0)

_Không có._

## Orchestration

- Chi phí orchestration: $22.07 (36.6% tổng)

> Lưu ý: chỉ tính phiên trên máy này.
