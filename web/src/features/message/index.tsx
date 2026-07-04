import { useState } from 'react';
import { PageHeader, Card, Tabs, Button, Tag, Form, Input, Select, Modal } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import BaseTable from '@/components/BaseTable';
import { QuillEditor } from '@/components/QuillEditor';
import styles from './index.module.css';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import request from '@/api/request';
import type { Message as MessageType, Announcement, AnnouncementCreate } from '@shop/shared';

function useMessageList() {
  return useQuery({ queryKey: ['messages'], queryFn: async () => request.get<{ list: MessageType[]; total: number }>('/messages'), staleTime: 30 * 1000 });
}

function useAnnouncementList() {
  return useQuery({ queryKey: ['announcements'], queryFn: async () => request.get<{ list: Announcement[]; total: number }>('/announcements'), staleTime: 60 * 1000 });
}

function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: AnnouncementCreate) => request.post('/announcements', data), onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }) });
}

function usePublishAnnouncement() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => request.post(`/announcements/${id}/publish`), onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }) });
}

const typeLabels: Record<string, string> = { TODO: '待办', NOTIFICATION: '通知', SYSTEM: '系统' };
const typeColors: Record<string, string> = { TODO: 'orange', NOTIFICATION: 'blue', SYSTEM: 'gray' };

function MessagePage() {
  const [activeTab, setActiveTab] = useState('messages');
  const [msgPage, setMsgPage] = useState(1);
  const [annPage, setAnnPage] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);

  const { data: msgData, isLoading: msgLoading } = useMessageList();
  const { data: annData, isLoading: annLoading } = useAnnouncementList();
  const createAnn = useCreateAnnouncement();
  const publishAnn = usePublishAnnouncement();

  const msgColumns = [
    { title: '标题', dataIndex: 'title' },
    { title: '类型', dataIndex: 'type', width: 80, render: (v: string) => <Tag color={typeColors[v]}>{typeLabels[v]}</Tag> },
    { title: '已读', dataIndex: 'read', width: 60, render: (v: boolean) => v ? '✅' : '🔴' },
    { title: '时间', dataIndex: 'createdAt', width: 160, render: (v: string) => v?.split('T')[0] },
  ];

  const annColumns = [
    { title: '标题', dataIndex: 'title' },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={v === 'PUBLISHED' ? 'green' : 'orange'}>{v === 'PUBLISHED' ? '已发布' : '草稿'}</Tag> },
    { title: '发布者', dataIndex: 'publisherName', width: 100 },
    { title: '发布时间', dataIndex: 'publishedAt', width: 160, render: (v: string) => v?.split('T')[0] || '-' },
    { title: '操作', key: 'actions', width: 80,
      render: (_: any, r: any) => r.status === 'DRAFT' ? (
        <Button size="small" type="primary" onClick={() => publishAnn.mutateAsync(r.id).then(() => {})}>发布</Button>
      ) : null,
    },
  ];

  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annTarget, setAnnTarget] = useState<string>('ALL');

  const handleCreate = async () => {
    if (!annTitle.trim() || !annContent.trim()) return;
    try {
      await createAnn.mutateAsync({ title: annTitle, content: annContent, targetType: annTarget });
      setModalVisible(false);
      setAnnTitle('');
      setAnnContent('');
      setAnnTarget('ALL');
    } catch {}
  };

  return (
    <div className={styles.pageContainer}>
      <PageHeader title="消息公告" breadcrumb={{ routes: [{ path: '/', breadcrumbName: '首页' }, { path: '/消息公告', breadcrumbName: '消息公告' }] }} />
      <Card>
        <Tabs activeTab={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane key="messages" title="我的消息">
            <BaseTable columns={msgColumns} data={(msgData as any)?.list || []} pagination={{ page: msgPage, pageSize: 10, total: (msgData as any)?.total || 0, onChange: (p) => setMsgPage(p) }} loading={msgLoading} rowKey="id" />
          </Tabs.TabPane>
          <Tabs.TabPane key="announcements" title="公告管理">
            <Card extra={<Button type="primary" icon={<IconPlus />} onClick={() => setModalVisible(true)}>发布公告</Button>} />
            <BaseTable columns={annColumns} data={(annData as any)?.list || []} pagination={{ page: annPage, pageSize: 10, total: (annData as any)?.total || 0, onChange: (p) => setAnnPage(p) }} loading={annLoading} rowKey="id" />
          </Tabs.TabPane>
        </Tabs>
      </Card>
      <Modal
        title="发布公告"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleCreate}
        okText="发布"
        className={styles.announceModal}
      >
        <div className={styles.formGroup}>
          <div className={styles.formLabel}>标题</div>
          <Input placeholder="公告标题" value={annTitle} onChange={setAnnTitle} />
        </div>
        <div className={styles.formGroup}>
          <div className={styles.formLabel}>目标范围</div>
          <Select
            value={annTarget}
            onChange={setAnnTarget}
            options={[
              { label: '全员', value: 'ALL' },
              { label: '部门', value: 'DEPARTMENT' },
              { label: '角色', value: 'ROLE' },
            ]}
          />
        </div>
        <div className={styles.formGroup}>
          <div className={styles.formLabel}>内容</div>
          <QuillEditor value={annContent} onChange={setAnnContent} />
        </div>
      </Modal>
    </div>
  );
}

export default MessagePage;
