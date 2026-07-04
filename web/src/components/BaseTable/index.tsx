import { useState } from 'react';
import { Table, Empty, Space, Checkbox, Popover, Button } from '@arco-design/web-react';
import { IconSettings } from '@arco-design/web-react/icon';
import type { TableProps } from '@arco-design/web-react';
import type { ReactNode } from 'react';
import styles from './style.module.css';

type PaginationInfo = {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
};

type BaseTableProps<T> = {
  columns: TableProps<T>['columns'];
  data: T[];
  pagination: PaginationInfo | false;
  loading?: boolean;
  rowSelection?: TableProps<T>['rowSelection'];
  rowKey?: string;
  actions?: ReactNode;
  actionColumnTitle?: string;
  showIndexColumn?: boolean;
  indexColumnTitle?: string;
};

function BaseTable<T extends Record<string, unknown>>({
  columns,
  data,
  pagination,
  loading = false,
  rowSelection,
  rowKey = 'id',
  actions,
  actionColumnTitle = '操作',
  showIndexColumn = true,
  indexColumnTitle = '序号',
}: BaseTableProps<T>) {
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());

  const indexColumn: TableProps<T>['columns'][number] = {
    title: indexColumnTitle,
    width: 70,
    align: 'center' as const,
    render: (_record: unknown, _index: number, rowIndex: number) => {
      return rowIndex + 1 + ((pagination as any)?.page - 1 || 0) * ((pagination as any)?.pageSize || 10);
    },
  };

  const actionColumn: TableProps<T>['columns'][number] = {
    title: actionColumnTitle,
    width: 200,
    fixed: 'right' as const,
    align: 'center' as const,
    render: () => <Space size={8}>{actions}</Space>,
  };

  const visibleColumns = (columns || []).filter((c: any) => !hiddenCols.has(c.key || c.dataIndex));

  const mergedColumns: TableProps<T>['columns'] = [];
  if (showIndexColumn) mergedColumns.push(indexColumn);
  mergedColumns.push(...visibleColumns);
  if (actions) mergedColumns.push(actionColumn);

  const paginationConfig = pagination ? {
    current: pagination.page,
    pageSize: pagination.pageSize,
    total: pagination.total,
    onChange: pagination.onChange,
    showTotal: true,
    sizeCanChange: true,
    pageSizeChangeResetCurrent: true,
  } : false;

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Popover
          content={
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              <Checkbox.Group
                direction="vertical"
                value={(columns || []).filter((c: any) => !hiddenCols.has(c.key || c.dataIndex)).map((c: any) => c.key || c.dataIndex)}
                options={(columns || []).map((c: any) => ({
                  label: c.title as string,
                  value: c.key || c.dataIndex,
                }))}
                onChange={(vals) => {
                  const allKeys = (columns || []).map((c: any) => c.key || c.dataIndex);
                  setHiddenCols(new Set(allKeys.filter((k) => !vals.includes(k))));
                }}
              />
            </div>
          }
          trigger="click"
          position="br"
        >
          <Button size="small" icon={<IconSettings />} type="text" />
        </Popover>
      </div>
      <Table
        rowKey={rowKey}
        columns={mergedColumns}
        data={data}
        loading={loading}
        rowSelection={rowSelection}
        pagination={paginationConfig}
        scroll={{ x: 'max-content' }}
        noDataElement={<Empty description="暂无数据" />}
      />
    </div>
  );
}

export default BaseTable;
