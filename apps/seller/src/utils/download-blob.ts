/**
 * 触发浏览器下载 blob 响应。
 *
 * 入参刻意用 `unknown`：调用方拿到的通常是 axios 的 `ResultMessage` 类型，
 * 但 `responseType: "blob"` 时运行时实际是 `Blob`（拦截器只做了类型断言）。
 */
export function downloadBlob(blob: unknown, filename: string): void {
  if (!blob) return;
  const payload = blob instanceof Blob ? blob : new Blob([blob as BlobPart]);
  const link = document.createElement("a");
  link.style.display = "none";
  const url = window.URL.createObjectURL(payload);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
