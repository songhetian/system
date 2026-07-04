import { useState } from 'react';
import { PageHeader, Card, Button, Message, Modal, Tag, Upload } from '@arco-design/web-react';
import { IconUpload, IconDelete } from '@arco-design/web-react/icon';
import BaseTable from '@/components/BaseTable';
import { useAuthStore } from '@/store/auth';
import styles from './index.module.css';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import request from '@/api/request';
import type { KbDocument, KbDocumentQuery } from '@shop/shared';

function useKbDocumentList(params: KbDocumentQuery) {
  return useQuery({ queryKey: ['kb', 'documents', params], queryFn: async () => request.get<{ list: KbDocument[]; total: number }>('/kb/documents', { params }), staleTime: 60 * 1000 });
}

function useDeleteKbDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => request.delete(`/kb/documents/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['kb'] }) });
}

const catLabels: Record<string, string> = { POLICY: '制度', COURSEWARE: '课件', FORM: '表单', CONTRACT: '合同', ANNOUNCEMENT: '公告附件' };

function KbPage() {
  const [page, setPage] = useState(1);
  const token = useAuthStore((s) => s.token);
  const { data, isLoading, refetch } = useKbDocumentList({ page, pageSize: 10 } as any);
  const deleteMutation = useDeleteKbDocument();

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const columns = [
    { title: '文档标题', dataIndex: 'title' },
    { title: '分类', dataIndex: 'category', width: 100, render: (v: string) => catLabels[v] || v },
    { title: '文件名', dataIndex: 'fileName', width: 200 },
    { title: '上传者', dataIndex: 'uploaderName', width: 100 },
    { title: '大小', dataIndex: 'fileSize', width: 80, render: (v: number) => `${(v / 1024).toFixed(1)} KB` },
    { title: '上传时间', dataIndex: 'createdAt', width: 160, render: (v: string) => v?.split('T')[0] },
    {
      title: '操作', key: 'actions', width: 120,
      render: (_: any, r: any) => (
        <Button size="small" icon={<IconDelete />} status="danger" onClick={() => {
          Modal.confirm({ title: '确认删除', content: `删除文档「${r.title}」？`, onOk: () => deleteMutation.mutateAsync(r.id).then(() => Message.success('已删除')).catch(() => Message.error('删除失败')) });
        }} />
      ),
    },
  ];

  return (
    <div className={styles.pageContainer}>
      <PageHeader title="知识库" breadcrumb={{ routes: [{ path: '/', breadcrumbName: '首页' }, { path: '/知识库', breadcrumbName: '知识库' }] }} />
      <Card extra={
        <Upload
          action="/api/kb/documents"
          headers={headers}
          showUploadList={false}
          onChange={(files) => {
            const file = Array.isArray(files) ? files[0] : files;
            if (file?.status === 'done') {
              Message.success('上传成功');
              refetch();
            } else if (file?.status === 'error') {
              Message.error('上传失败');
            }
          }}
        >
          <Button type="primary" icon={<IconUpload />}>上传文档</Button>
        </Upload>
      }>
        <BaseTable columns={columns} data={data?.list || []} pagination={{ page, pageSize: 10, total: data?.total || 0, onChange: (p) => setPage(p) }} loading={isLoading} showIndexColumn rowKey="id" />
      </Card>
    </div>
  );
}

export default KbPage;
