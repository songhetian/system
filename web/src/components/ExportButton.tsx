import { Button, Message } from '@arco-design/web-react';
import { IconDownload } from '@arco-design/web-react/icon';
import type { ExportColumn } from '@/utils/export';

export function ExportButton({ columns, data, filename, disabled }: {
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  filename: string;
  disabled?: boolean;
}) {
  const handleExport = () => {
    if (!data.length) {
      Message.warning('无数据可导出');
      return;
    }
    const { exportToXlsx } = require('@/utils/export');
    exportToXlsx(columns, data, filename);
    Message.success(`已导出 ${data.length} 条记录`);
  };

  return (
    <Button icon={<IconDownload />} onClick={handleExport} disabled={disabled || !data.length}>
      导出
    </Button>
  );
}
