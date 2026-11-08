# Báo cáo token

Giá tham chiếu kiểm tra ngày 2026-11-08. Chi phí tính bằng USD theo bảng giá trong `tools/token-report/pricing.json`.

## Tổng

- Tổng chi phí: $44.96
- Tổng token (input + output + cache): 92,802,484
- Số task có dữ liệu: 14

## Theo milestone

| Milestone | Số task | Chi phí |
|---|---|---|
| M0 | 6 | $7.16 |
| M1 | 8 | $20.01 |

## Theo loại task × model (chi phí trung bình mỗi task)

| Loại task | Vai trò | Model | Số task | Tổng | TB / task |
|---|---|---|---|---|---|
| asset-sourcing | implement | sonnet | 1 | $1.07 | $1.07 |
| asset-sourcing | review | sonnet | 1 | $0.20 | $0.20 |
| devops | implement | sonnet | 3 | $3.13 | $1.04 |
| devops | review | sonnet | 3 | $0.91 | $0.30 |
| feature-logic | implement | opus | 1 | $1.48 | $1.48 |
| feature-logic | implement | sonnet | 2 | $1.44 | $0.72 |
| feature-logic | review | sonnet | 3 | $0.65 | $0.22 |
| integration | review | opus | 1 | $4.23 | $4.23 |
| integration | review | sonnet | 1 | $0.23 | $0.23 |
| scaffold | implement | sonnet | 1 | $0.43 | $0.43 |
| scaffold | review | sonnet | 1 | $0.25 | $0.25 |
| shader-visual | implement | opus | 3 | $10.72 | $3.57 |
| shader-visual | implement | sonnet | 2 | $1.35 | $0.68 |
| shader-visual | review | sonnet | 5 | $1.09 | $0.22 |

## Model dự kiến vs thực tế (người implement)

| Dự kiến | Thực tế | Số task | TB / task |
|---|---|---|---|
| opus | opus | 4 | $3.05 |
| sonnet | sonnet | 9 | $0.82 |

## 5 task tốn kém nhất

| Task | Model | Chi phí |
|---|---|---|
| M1-T1 | mixed | $4.59 |
| M1-T8 | mixed | $4.46 |
| M1-T6 | mixed | $4.20 |
| M1-T5 | mixed | $2.66 |
| M0-T5 | sonnet | $1.69 |

## Leo thang model (implementer dùng hơn 1 model)

_Không có._

## Review

- Tỷ trọng review: $7.55 / $27.17 chi phí task (27.8%)

## Model chưa có giá (tính $0)

_Không có._

## Orchestration

- Chi phí orchestration: $17.79 (39.6% tổng)

> Lưu ý: chỉ tính phiên trên máy này.
