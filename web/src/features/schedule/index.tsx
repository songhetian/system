/*
 * 修改点：
 * 1. PageHeader breadcrumbs → breadcrumb 对象格式
 * 2. 移除 RotationRuleUpdate（不存在）
 * 3. render 第一个参数 _ → _col: unknown
 * 4. fixed: 'right' → 'right' as const
 * 5. handleSubmit values 类型改为 Record<string, unknown>
 * 6. 移除 ShiftTemplateForm/RotationRuleForm 的 form prop（BaseFormModal 内部管理）
 * 7. RotationRuleForm 移除 isEdit prop
 */
import {
  Card,
  Tabs,
  Button,
  Modal,
  Message,
  Tag,
  Space,
  PageHeader,
} from '@arco-design/web-react';
import {
  IconPlus,
  IconEdit,
  IconDelete,
} from '@arco-design/web-react/icon';
import { useState, useRef, useMemo } from 'react';
import BaseTable from '@/components/BaseTable';
import BaseFormModal from '@/components/BaseFormModal';
import type { BaseFormModalRef } from '@/components/BaseFormModal';
import ShiftTemplateForm from './components/ShiftTemplateForm';
import RotationRuleForm from './components/RotationRuleForm';
import ScheduleCalendar from './components/ScheduleCalendar';
import {
  useShiftTemplateList,
  useCreateShiftTemplate,
  useUpdateShiftTemplate,
  useDeleteShiftTemplate,
  useRotationRuleList,
  useCreateRotationRule,
  useUpdateRotationRule,
  useDeleteRotationRule,
} from './hooks/useSchedule';
import type {
  ShiftTemplate,
  RotationRule,
  ShiftTemplateCreate,
  RotationRuleCreate,
  ShiftTemplateUpdate,
} from '@shop/shared';
import styles from './index.module.css';

function Schedule() {
  const [activeTab, setActiveTab] = useState('shift-template');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editData, setEditData] = useState<ShiftTemplate | RotationRule | null>(null);
  const [modalType, setModalType] = useState<'shift' | 'rotation'>('shift');
  const [shiftsPage, setShiftsPage] = useState(1);
  const [rotationsPage, setRotationsPage] = useState(1);
  const formModalRef = useRef<BaseFormModalRef>(null);

  const { data: shiftTemplates, isLoading: shiftLoading } = useShiftTemplateList();
  const createShiftMutation = useCreateShiftTemplate();
  const updateShiftMutation = useUpdateShiftTemplate();
  const deleteShiftMutation = useDeleteShiftTemplate();

  const { data: rotationRules, isLoading: rotationLoading } = useRotationRuleList();
  const createRotationMutation = useCreateRotationRule();
  const updateRotationMutation = useUpdateRotationRule();
  const deleteRotationMutation = useDeleteRotationRule();

  const shiftTemplateMap = useMemo(() => {
    const map: Record<number, ShiftTemplate> = {};
    (shiftTemplates || []).forEach((t: ShiftTemplate) => {
      map[t.id] = t;
    });
    return map;
  }, [shiftTemplates]);

  // ═══════════════════ 班次模板 ═══════════════════

  const handleAddShift = () => {
    setModalType('shift');
    setIsEdit(false);
    setEditData(null);
    setModalVisible(true);
  };

  const handleEditShift = (record: ShiftTemplate) => {
    setModalType('shift');
    setIsEdit(true);
    setEditData(record);
    setModalVisible(true);
  };

  const handleDeleteShift = (record: ShiftTemplate) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除班次模板「${record.name}」吗？`,
      onOk: async () => {
        try {
          await deleteShiftMutation.mutateAsync(record.id);
          Message.success('删除成功');
        } catch {
          Message.error('删除失败');
        }
      },
    });
  };

  // ═══════════════════ 轮班规则 ═══════════════════

  const handleAddRotation = () => {
    setModalType('rotation');
    setIsEdit(false);
    setEditData(null);
    setModalVisible(true);
  };

  const handleEditRotation = (record: RotationRule) => {
    setModalType('rotation');
    setIsEdit(true);
    setEditData(record);
    setModalVisible(true);
  };

  const handleDeleteRotation = (record: RotationRule) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除轮班规则「${record.name}」吗？`,
      onOk: async () => {
        try {
          await deleteRotationMutation.mutateAsync(record.id);
          Message.success('删除成功');
        } catch {
          Message.error('删除失败');
        }
      },
    });
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      if (modalType === 'shift') {
        if (isEdit && editData) {
          await updateShiftMutation.mutateAsync({ id: editData.id, data: values as ShiftTemplateUpdate });
        } else {
          await createShiftMutation.mutateAsync(values as ShiftTemplateCreate);
        }
      } else {
        if (isEdit && editData) {
          await updateRotationMutation.mutateAsync({ id: editData.id, data: values as RotationRuleCreate });
        } else {
          await createRotationMutation.mutateAsync(values as RotationRuleCreate);
        }
      }
      Message.success('操作成功');
      setModalVisible(false);
    } catch {
      // error handled by request interceptor
    }
  };

  const shiftTemplateColumns = [
    {
      title: '班次名称',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: '时间',
      width: 160,
      render: (_col: unknown, record: ShiftTemplate) => (
        <span>{record.startTime} - {record.endTime}</span>
      ),
    },
    {
      title: '颜色',
      width: 100,
      render: (_col: unknown, record: ShiftTemplate) => (
        <Tag color={record.color}>{record.color}</Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (_col: unknown, record: ShiftTemplate) => (
        <span>{new Date(record.createdAt).toLocaleString()}</span>
      ),
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right' as const,
      render: (_col: unknown, record: ShiftTemplate) => (
        <Space size={8}>
          <Button
            type="text"
            icon={<IconEdit />}
            onClick={() => handleEditShift(record)}
          >
            编辑班次
          </Button>
          <Button
            type="text"
            status="danger"
            icon={<IconDelete />}
            onClick={() => handleDeleteShift(record)}
          >
            删除班次
          </Button>
        </Space>
      ),
    },
  ];

  const rotationRuleColumns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: '周期天数',
      dataIndex: 'cycleDays',
      width: 100,
      render: (_col: unknown, record: RotationRule) => (
        <span>{record.cycleDays} 天</span>
      ),
    },
    {
      title: '班次模式',
      flex: 1,
      render: (_col: unknown, record: RotationRule) => (
        <Space size={4} wrap>
          {record.pattern.map((p, idx) => {
            const t = shiftTemplateMap[p.shiftTemplateId];
            return (
              <Tag
                key={idx}
                color={t?.color || 'gray'}
                className={styles.patternTag}
              >
                {t?.name || '未设置'}
              </Tag>
            );
          })}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (_col: unknown, record: RotationRule) => (
        <span>{new Date(record.createdAt).toLocaleString()}</span>
      ),
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right' as const,
      render: (_col: unknown, record: RotationRule) => (
        <Space size={8}>
          <Button
            type="text"
            icon={<IconEdit />}
            onClick={() => handleEditRotation(record)}
          >
            编辑规则
          </Button>
          <Button
            type="text"
            status="danger"
            icon={<IconDelete />}
            onClick={() => handleDeleteRotation(record)}
          >
            删除规则
          </Button>
        </Space>
      ),
    },
  ];

  const getModalTitle = () => {
    if (modalType === 'shift') {
      return isEdit ? '编辑班次模板' : '新增班次模板';
    }
    return isEdit ? '编辑轮班规则' : '新增轮班规则';
  };

  const getModalLoading = () => {
    if (modalType === 'shift') {
      return createShiftMutation.isPending || updateShiftMutation.isPending;
    }
    return createRotationMutation.isPending || updateRotationMutation.isPending;
  };

  const getExtraButton = () => {
    if (activeTab === 'shift-template') {
      return (
        <Button type="primary" icon={<IconPlus />} onClick={handleAddShift}>
          新增班次
        </Button>
      );
    }
    if (activeTab === 'rotation-rule') {
      return (
        <Button type="primary" icon={<IconPlus />} onClick={handleAddRotation}>
          新增规则
        </Button>
      );
    }
    return null;
  };

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title="排班管理"
        breadcrumb={{
          routes: [
            { path: '/', breadcrumbName: '首页' },
            { path: '/schedule', breadcrumbName: '排班' },
            { path: '/schedule', breadcrumbName: '排班管理' },
          ],
        }}
      />
      <div className={styles.pageContent}>
        <Card extra={getExtraButton()}>
          <Tabs activeTab={activeTab} onChange={setActiveTab}>
            <Tabs.TabPane key="shift-template" title="班次模板">
              <BaseTable
                columns={shiftTemplateColumns}
                data={shiftTemplates || []}
                pagination={{
                  page: shiftsPage,
                  pageSize: 10,
                  total: (shiftTemplates || []).length,
                  onChange: (page) => setShiftsPage(page),
                }}
                loading={shiftLoading}
                showIndexColumn
                actions={null}
              />
            </Tabs.TabPane>
            <Tabs.TabPane key="rotation-rule" title="轮班规则">
              <BaseTable
                columns={rotationRuleColumns}
                data={rotationRules || []}
                pagination={{
                  page: rotationsPage,
                  pageSize: 10,
                  total: (rotationRules || []).length,
                  onChange: (page) => setRotationsPage(page),
                }}
                loading={rotationLoading}
                showIndexColumn
                actions={null}
              />
            </Tabs.TabPane>
            <Tabs.TabPane key="schedule-calendar" title="排班日历">
              <ScheduleCalendar />
            </Tabs.TabPane>
          </Tabs>

          <BaseFormModal
            ref={formModalRef}
            visible={modalVisible}
            title={getModalTitle()}
            onOk={handleSubmit}
            onCancel={() => setModalVisible(false)}
            loading={getModalLoading()}
            okText="确认"
            cancelText="取消"
            width={modalType === 'rotation' ? 640 : 560}
            initialValues={isEdit && editData ? editData : undefined}
          >
            {modalType === 'shift' ? (
              <ShiftTemplateForm isEdit={isEdit} />
            ) : (
              <RotationRuleForm form={formModalRef.current!.getForm()} />
            )}
          </BaseFormModal>
        </Card>
      </div>
    </div>
  );
}

export default Schedule;
