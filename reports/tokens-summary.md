# Báo cáo token

Giá tham chiếu kiểm tra ngày 2026-11-08. Chi phí tính bằng USD theo bảng giá trong `tools/token-report/pricing.json`.

## Tổng

- Tổng chi phí: $14.89
- Tổng token (input + output + cache): 27,072,769
- Số task có dữ liệu: 6

## Theo milestone

| Milestone | Số task | Chi phí |
|---|---|---|
| M0 | 6 | $5.17 |

## Theo loại task × model (chi phí trung bình mỗi task)

| Loại task | Model | Số task | TB / task |
|---|---|---|---|
| devops | sonnet | 3 | $0.72 |
| feature-logic | mixed | 1 | $1.68 |
| feature-logic | sonnet | 1 | $0.65 |
| scaffold | sonnet | 1 | $0.68 |

## 5 task tốn kém nhất

| Task | Model | Chi phí |
|---|---|---|
| M0-T2 | mixed | $1.68 |
| M0-T4 | sonnet | $0.75 |
| M0-T6 | sonnet | $0.72 |
| M0-T5 | sonnet | $0.70 |
| M0-T1 | sonnet | $0.68 |

## Leo thang model (task dùng hơn 1 model)

- M0-T2: sonnet, opus

## Orchestration

- Chi phí orchestration: $9.72 (65.3% tổng)

> Lưu ý: chỉ tính phiên trên máy này.
