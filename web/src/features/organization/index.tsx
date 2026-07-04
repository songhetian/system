import { useState } from 'react';
import {
  PageHeader,
  Card,
  Tabs,
  Button,
  Input,
  Space,
  Message,
  Modal,
  Form,
  Select,
  InputNumber,
} from '@arco-design/web-react';
import { IconPlus, IconEdit, IconDelete, IconMenu } from '@arco-design/web-react/icon';
import BaseTable from '@/components/BaseTable';
import { DraggableTable, SortableRow } from '@/components/DraggableTable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import request from '@/api/request';
import {
  useDepartmentTree,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  usePositionList,
  useCreatePosition,
  useUpdatePosition,
  useDeletePosition,
  useRankList,
  useCreateRank,
  useUpdateRank,
  useDeleteRank,
} from './hooks/useOrganization';
import styles from './index.module.css';

function OrgPage() {
  const [activeTab, setActiveTab] = useState('departments');
  const [deptModal, setDeptModal] = useState(false);
  const [posModal, setPosModal] = useState(false);
  const [rankModal, setRankModal] = useState(false);

  const { data: deptTree, isLoading: deptLoading } = useDepartmentTree();
  const { data: rankData, isLoading: rankLoading } = useRankList();
  const { data: posData, isLoading: posLoading } = usePositionList();

  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();
  const createPos = useCreatePosition();
  const updatePos = useUpdatePosition();
  const deletePos = useDeletePosition();
  const createRank = useCreateRank();
  const updateRank = useUpdateRank();
  const deleteRank = useDeleteRank();

  const qc = useQueryClient();
  const reorderMut = useMutation({
    mutationFn: (items: { id: number; sortOrder: number }[]) =>
      request.put('/org/departments/reorder', { items }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org'] }),
  });

  const handleReorder = (items: { id: number; sortOrder: number }[]) => {
    reorderMut.mutate(items);
  };

  const flattenTree = (nodes: any[] = []) => {
    const result: any[] = [];
    const walk = (list: any[], level: number) => {
      for (const n of list) {
        result.push({ ...n, _level: level });
        if (n.children?.length) walk(n.children, level + 1);
      }
    };
    walk(nodes, 0);
    return result;
  };

  const deptFlat = flattenTree(deptTree as any);
  const ranks = rankData?.list || [];
  const positions = posData?.list || [];

  // 部门表格列
  const deptColumns = [
    { title: '部门名称', dataIndex: 'name', render: (_: any, r: any) => `${'　'.repeat(r._level || 0)}${r.name}` },
    { title: '排序', dataIndex: 'sortOrder', width: 80 },
    {
      title: '操作', key: 'actions', width: 160,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button size="small" icon={<IconEdit />} onClick={() => Message.info('编辑部门功能')}>编辑</Button>
          <Button size="small" icon={<IconDelete />} status="danger" onClick={() => {
            Modal.confirm({ title: '确认删除', content: `删除部门「${r.name}」？`, onOk: () => deleteDept.mutateAsync(r.id).then(() => Message.success('已删除')).catch(() => Message.error('删除失败')) });
          }}>删除</Button>
        </Space>
      ),
    },
  ];

  // 职级表格列
  const rankColumns = [
    { title: '职级名称', dataIndex: 'name' },
    { title: '级别', dataIndex: 'level', width: 80 },
    {
      title: '操作', key: 'actions', width: 160,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button size="small" icon={<IconEdit />}>编辑</Button>
          <Button size="small" icon={<IconDelete />} status="danger" onClick={() => {
            Modal.confirm({ title: '确认删除', content: `删除职级「${r.name}」？`, onOk: () => deleteRank.mutateAsync(r.id).then(() => Message.success('已删除')).catch(() => Message.error('删除失败')) });
          }}>删除</Button>
        </Space>
      ),
    },
  ];

  // 岗位表格列
  const posColumns = [
    { title: '岗位名称', dataIndex: 'name' },
    { title: '部门', dataIndex: 'departmentId', render: (v: number) => deptFlat.find(d => d.id === v)?.name || '-' },
    { title: '编制', dataIndex: 'headcount', width: 80 },
    {
      title: '操作', key: 'actions', width: 160,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button size="small" icon={<IconEdit />}>编辑</Button>
          <Button size="small" icon={<IconDelete />} status="danger" onClick={() => {
            Modal.confirm({ title: '确认删除', content: `删除岗位「${r.name}」？`, onOk: () => deletePos.mutateAsync(r.id).then(() => Message.success('已删除')).catch(() => Message.error('删除失败')) });
          }}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.pageContainer}>
      <PageHeader title="组织架构" breadcrumb={{ routes: [{ path: '/', breadcrumbName: '首页' }, { path: '/组织架构', breadcrumbName: '组织架构' }] }} />
      <Card>
        <Tabs activeTab={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane key="departments" title="部门管理">
            <Card
              className={styles.actionBar}
              extra={<Button type="primary" icon={<IconPlus />} onClick={() => setDeptModal(true)}>新增部门</Button>}
            />
            <DraggableTable data={deptFlat} onReorder={handleReorder}>
              {(items) => (
                <div className={styles.dragList}>
                  <div className={styles.dragHeader}>
                    <span className={styles.dragHandle} />
                    <span className={styles.dragName}>部门名称</span>
                    <span className={styles.dragSort}>排序</span>
                    <span className={styles.dragActions}>操作</span>
                  </div>
                  {items.map((item: any) => (
                    <SortableRow key={item.id} id={item.id}>
                      <div className={styles.dragRow}>
                        <span className={styles.dragHandle}><IconMenu /></span>
                        <span className={styles.dragName}>{'　'.repeat(item._level || 0)}{item.name}</span>
                        <span className={styles.dragSort}>{item.sortOrder}</span>
                        <span className={styles.dragActions}>
                          <Space size="small">
                            <Button size="small" icon={<IconEdit />} onClick={() => Message.info('编辑部门功能')}>编辑</Button>
                            <Button size="small" icon={<IconDelete />} status="danger" onClick={() => {
                              Modal.confirm({ title: '确认删除', content: `删除部门「${item.name}」？`, onOk: () => deleteDept.mutateAsync(item.id).then(() => Message.success('已删除')).catch(() => Message.error('删除失败')) });
                            }}>删除</Button>
                          </Space>
                        </span>
                      </div>
                    </SortableRow>
                  ))}
                </div>
              )}
            </DraggableTable>
          </Tabs.TabPane>

          <Tabs.TabPane key="positions" title="岗位管理">
            <Card
              className={styles.actionBar}
              extra={<Button type="primary" icon={<IconPlus />} onClick={() => setPosModal(true)}>新增岗位</Button>}
            />
            <BaseTable
              columns={posColumns}
              data={positions}
              loading={posLoading}
              pagination={false}
              rowKey="id"
            />
          </Tabs.TabPane>

          <Tabs.TabPane key="ranks" title="职级管理">
            <Card
              className={styles.actionBar}
              extra={<Button type="primary" icon={<IconPlus />} onClick={() => setRankModal(true)}>新增职级</Button>}
            />
            <BaseTable
              columns={rankColumns}
              data={ranks}
              loading={rankLoading}
              pagination={false}
              rowKey="id"
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
}

export default OrgPage;
