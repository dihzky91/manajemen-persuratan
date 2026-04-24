import Papa from "papaparse";

export function exportRowsToCsv(
  rows: Array<Record<string, string | number | boolean | null | undefined>>,
  fileName: string,
) {
  const csv = Papa.unparse(rows, {
    header: true,
    newline: "\r\n",
  });

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
