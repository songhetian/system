import { useState } from 'react';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Space,
  Message,
  Modal,
  Tag,
  Form,
  Select,
  InputNumber,
} from '@arco-design/web-react';
import {
  IconPlus,
  IconEdit,
  IconDelete,
  IconSearch,
  IconDownload,
} from '@arco-design/web-react/icon';
import { exportToXlsx } from '@/utils/export';
import BaseTable from '@/components/BaseTable';
import { useSearchState } from '@/hooks/useSearchState';
import BaseFormModal from '@/components/BaseFormModal';
import type { BaseFormModalRef } from '@/components/BaseFormModal';
import {
  useEmployeeList,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  useDepartmentTree,
  usePositionList,
} from './hooks/useEmployee';
import type { EmployeeListItem, EmployeeCreate, DepartmentTreeNode } from '@shop/shared';
import styles from './index.module.css';

const statusColors: Record<string, string> = {
  PROBATION: 'orange',
  ACTIVE: 'green',
  RESIGNED: 'gray',
};

const statusLabels: Record<string, string> = {
  PROBATION: '试用期',
  ACTIVE: '在职',
  RESIGNED: '已离职',
};

function flattenDeptTree(nodes: DepartmentTreeNode[]): { id: number; name: string; level: number }[] {
  const result: { id: number; name: string; level: number }[] = [];
  function walk(list: DepartmentTreeNode[], level: number) {
    for (const node of list) {
      result.push({ id: node.id, name: node.name, level });
      if (node.children?.length) walk(node.children, level + 1);
    }
  }
  walk(nodes, 0);
  return result;
}

function EmployeePage() {
  const [searchState, setSearchState] = useSearchState<{ keyword?: string; status?: string }>();
  const [page, setPage] = useState(1);
  const keyword = searchState.keyword || '';
  const statusFilter = searchState.status || undefined;
  const [selectedDept, setSelectedDept] = useState<number | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  const params = { page, pageSize: 10, keyword: keyword || undefined, departmentId: selectedDept, status: statusFilter };
  const { data, isLoading } = useEmployeeList(params as any);
  const { data: deptTree } = useDepartmentTree();

  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployee();

  const flatDepts = deptTree ? flattenDeptTree(deptTree) : [];

  const handleSearch = () => {
    setPage(1);
  };

  const handleCreate = () => {
    setEditingId(null);
    setModalVisible(true);
  };

  const handleEdit = (record: EmployeeListItem) => {
    setEditingId(record.id);
    setModalVisible(true);
  };

  const handleDelete = (record: EmployeeListItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除员工「${record.name}」吗？`,
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(record.id);
          Message.success('删除成功');
        } catch {
          Message.error('删除失败');
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: values });
        Message.success('更新成功');
      } else {
        await createMutation.mutateAsync(values);
        Message.success('创建成功');
      }
      setModalVisible(false);
    } catch {
      Message.error('操作失败');
    }
  };

  const columns = [
    { title: '姓名', dataIndex: 'name', width: 100, sorter: !0 },
    { title: '工号', dataIndex: 'employeeNo', width: 120, sorter: !0 },
    { title: '手机号', dataIndex: 'phone', width: 130 },
    { title: '部门', dataIndex: 'departmentId', width: 120, render: (v: number) => flatDepts.find(d => d.id === v)?.name || '-' },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: string) => <Tag color={statusColors[v] || 'gray'}>{statusLabels[v] || v}</Tag>,
    },
    { title: '入职日期', dataIndex: 'hireDate', width: 120 },
    {
      title: '操作', key: 'actions', width: 160,
      render: (_: any, record: EmployeeListItem) => (
        <Space size="small">
          <Button size="small" icon={<IconEdit />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button size="small" icon={<IconDelete />} status="danger" onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.pageContainer}>
      <PageHeader title="员工管理" breadcrumb={{ routes: [{ path: '/', breadcrumbName: '首页' }, { path: '/员工管理', breadcrumbName: '员工管理' }] }} />
      <Card className={styles.filterCard}>
        <Space wrap>
          <Input
            style={{ width: 200 }}
            placeholder="搜索姓名/工号"
            value={keyword}
            onChange={(v) => setSearchState({ keyword: v })}
            prefix={<IconSearch />}
            onPressEnter={handleSearch}
            allowClear
          />
          <Select
            style={{ width: 180 }}
            placeholder="选择部门"
            value={selectedDept}
            onChange={setSelectedDept}
            allowClear
            options={flatDepts.map(d => ({ label: `${'　'.repeat(d.level)}${d.name}`, value: d.id }))}
          />
          <Select
            style={{ width: 120 }}
            placeholder="员工状态"
            value={statusFilter}
            onChange={(v) => setSearchState({ status: v })}
            allowClear
            options={[
              { label: '试用期', value: 'PROBATION' },
              { label: '在职', value: 'ACTIVE' },
              { label: '已离职', value: 'RESIGNED' },
            ]}
          />
          <Button type="primary" onClick={handleSearch} icon={<IconSearch />}>
            查询
          </Button>
        </Space>
      </Card>
      {selectedRowKeys.length > 0 && (
        <Card className={styles.batchBar}>
          <Space>
            <span>已选 {selectedRowKeys.length} 项</span>
            <Button
              type="primary"
              status="danger"
              icon={<IconDelete />}
              onClick={() => {
                Modal.confirm({
                  title: '批量删除',
                  content: `确认删除选中的 ${selectedRowKeys.length} 名员工？`,
                  onOk: async () => {
                    try {
                      await Promise.all(selectedRowKeys.map(id => deleteMutation.mutateAsync(id)));
                      Message.success('批量删除成功');
                      setSelectedRowKeys([]);
                    } catch { Message.error('批量删除失败'); }
                  },
                });
              }}
            >
              批量删除
            </Button>
            <Button
              icon={<IconDownload />}
              onClick={() => {
                const selectedData = (data?.list || []).filter((item: Record<string, unknown>) => selectedRowKeys.includes(item.id as number));
                exportToXlsx(columns, selectedData, '员工花名册_已选');
              }}
            >
              导出选中
            </Button>
            <Button onClick={() => setSelectedRowKeys([])}>取消选择</Button>
          </Space>
        </Card>
      )}
      <Card
        className={styles.tableCard}
        title="员工列表"
        extra={
          <Space>
            <Button type="primary" icon={<IconPlus />} onClick={handleCreate}>新增员工</Button>
            <Button icon={<IconDownload />} onClick={() => exportToXlsx(columns, employeeData?.list || [], '员工花名册')}>导出</Button>
          </Space>
        }
      >
        <BaseTable
          columns={columns}
          data={data?.list || []}
          pagination={{
            page,
            pageSize: 10,
            total: data?.total || 0,
            onChange: (p) => setPage(p),
          }}
          loading={isLoading}
          showIndexColumn
          rowKey="id"
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as number[]),
          }}
        />
      </Card>

      <BaseFormModal
        ref={null as any}
        visible={modalVisible}
        title={editingId ? '编辑员工' : '新增员工'}
        onCancel={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        initialValues={editingId ? data?.list?.find(e => e.id === editingId) : undefined}
      >
        <Form.Item label="姓名" field="name" rules={[{ required: true, message: '请输入姓名' }]}>
          <Input placeholder="请输入姓名" maxLength={30} />
        </Form.Item>
        <Form.Item label="工号" field="employeeNo" rules={[{ required: true, message: '请输入工号' }]}>
          <Input placeholder="请输入工号" maxLength={20} />
        </Form.Item>
        <Form.Item label="手机号" field="phone" rules={[{ required: true, message: '请输入手机号' }]}>
          <Input placeholder="请输入手机号" maxLength={11} />
        </Form.Item>
        <Form.Item label="邮箱" field="email">
          <Input placeholder="请输入邮箱" />
        </Form.Item>
        <Form.Item label="身份证号" field="idCard" rules={[{ required: true, message: '请输入身份证号' }]}>
          <Input placeholder="请输入18位身份证号" maxLength={18} />
        </Form.Item>
        <Form.Item label="部门" field="departmentId" rules={[{ required: true, message: '请选择部门' }]}>
          <Select placeholder="请选择部门" options={flatDepts.map(d => ({ label: d.name, value: d.id }))} />
        </Form.Item>
        <Form.Item label="入职日期" field="hireDate" rules={[{ required: true, message: '请选择入职日期' }]}>
          <Input placeholder="YYYY-MM-DD" />
        </Form.Item>
      </BaseFormModal>
    </div>
  );
}

export default EmployeePage;
