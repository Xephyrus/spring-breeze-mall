export const PROCUREMENT_STATUS = {
  DRAFT: "待提交",
  SUBMITTED: "已提交",
  PENDING_INBOUND: "待入库",
  PARTIAL_INBOUND: "部分入库",
  CLOSED: "已关闭",
  COMPLETED: "已完成",
  REJECTED: "已拒绝",
};

export const PROCUREMENT_STATUS_TAG = {
  DRAFT: "info",
  SUBMITTED: "warning",
  PENDING_INBOUND: "primary",
  PARTIAL_INBOUND: "warning",
  CLOSED: "info",
  COMPLETED: "success",
  REJECTED: "danger",
};

export const DAMAGE_STATUS = {
  DRAFT: "待提交",
  SUBMITTED: "待审核",
  APPROVED: "已通过",
  REJECTED: "已驳回",
  CANCELLED: "已作废",
  COMPLETED: "已完成",
};

export const DAMAGE_STATUS_TAG = {
  DRAFT: "info",
  SUBMITTED: "warning",
  APPROVED: "primary",
  REJECTED: "danger",
  CANCELLED: "info",
  COMPLETED: "success",
};

export const MARKET_ENABLE = {
  UPPER: "上架",
  DOWN: "下架",
};

export const STOCK_REASON_CATEGORY = {
  INBOUND: "入库",
  OUTBOUND: "出库",
  DAMAGE: "报损",
};

export function stockReasonCategoryText(category: string | undefined) {
  return (STOCK_REASON_CATEGORY as Record<string, string>)[String(category ?? "")] || category || "-";
}

export function procurementStatusText(status: string | undefined) {
  return (PROCUREMENT_STATUS as Record<string, string>)[String(status ?? "")] || status || "-";
}

/** el-tag 的 type 只接受这五个字面量 */
type TagType = "primary" | "success" | "warning" | "info" | "danger";

export function procurementStatusTag(status: string | undefined): TagType {
  return (PROCUREMENT_STATUS_TAG as Record<string, TagType>)[String(status ?? "")] ?? "info";
}

export function damageStatusText(status: string | undefined) {
  return (DAMAGE_STATUS as Record<string, string>)[String(status ?? "")] || status || "-";
}

export function damageStatusTag(status: string | undefined): TagType {
  return (DAMAGE_STATUS_TAG as Record<string, TagType>)[String(status ?? "")] ?? "info";
}

export function formatMoney(val: string | number | null | undefined) {
  if (val === null || val === undefined || val === "") return "0.00";
  return Number(val).toFixed(2);
}

export function exportCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
) {
  const escape = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.map(escape).join(",")];
  rows.forEach((row) => lines.push(row.map(escape).join(",")));
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
