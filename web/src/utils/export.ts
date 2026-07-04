import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExportColumn {
  title: string;
  dataIndex: string;
  render?: (value: unknown, record: unknown) => unknown;
}

/**
 * 将表格数据导出为 XLSX 文件
 */
export function exportToXlsx(columns: ExportColumn[], data: Record<string, unknown>[], filename: string) {
  const header = columns.map((c) => c.title);
  const rows = data.map((record) =>
    columns.map((col) => {
      const cell = record[col.dataIndex];
      if (col.render) return col.render(cell, record) ?? '';
      if (cell === null || cell === undefined) return '';
      if (cell instanceof Date) return cell.toLocaleDateString('zh-CN');
      if (typeof cell === 'object') return JSON.stringify(cell);
      return String(cell);
    }),
  );

  const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);

  // 自动列宽
  const colWidths = header.map((h, i) => ({
    wch: Math.max(h.length * 2, ...rows.map((r) => String(r[i] || '').length * 2), 10),
  }));
  sheet['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Sheet1');

  const blob = new Blob(
    [XLSX.write(wb, { bookType: 'xlsx', type: 'array' })],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  );
  saveAs(blob, `${filename}.xlsx`);
}
