import { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Space, Typography } from '@arco-design/web-react';
import {
  IconShareAlt,
  IconUser,
  IconUserGroup,
} from '@arco-design/web-react/icon';
import { useUsers, useRoles } from '../hooks/useWorkflow';
import type { NodeType, AssigneeType, SignType } from '@shop/shared';
import type { Node } from '@xyflow/react';
import styles from './NodeConfigPanel.module.css';

const { Title } = Typography;

const conditionTypes = [
  { value: 'AMOUNT_THRESHOLD', label: '金额阈值', description: '根据金额判断分支路径' },
  { value: 'DEPARTMENT', label: '部门', description: '根据申请人部门判断' },
  { value: 'POSITION', label: '岗位', description: '根据申请人岗位判断' },
  { value: 'LEAVE_DAYS', label: '请假天数', description: '根据请假天数判断' },
  { value: 'EMPLOYEE_TYPE', label: '员工类型', description: '根据员工状态判断' },
];

const operators = [
  { value: '>', label: '大于' },
  { value: '>=', label: '大于等于' },
  { value: '<', label: '小于' },
  { value: '<=', label: '小于等于' },
  { value: '==', label: '等于' },
  { value: '!=', label: '不等于' },
];

interface AssigneeTypeOption {
  value: string;
  label: string;
  icon: React.ComponentType<{ style?: React.CSSProperties; className?: string }>;
}

const assigneeTypes: AssigneeTypeOption[] = [
  { value: 'USER', label: '指定用户', icon: IconUser },
  { value: 'ROLE', label: '指定角色', icon: IconUserGroup },
  { value: 'DEPARTMENT_LEADER', label: '部门负责人', icon: IconUserGroup },
  { value: 'SUPERVISOR', label: '直属上级', icon: IconUser },
];

interface WorkflowNodeData extends Record<string, unknown> {
  type: NodeType;
  label: string;
  assigneeType?: AssigneeType | string;
  assigneeId?: number | null;
  assigneeName?: string;
  conditionType?: string;
  operator?: string;
  conditionValue?: string;
  signType?: SignType | string;
}

type WorkflowNodeType = Node<WorkflowNodeData>;

interface NodeConfigPanelProps {
  node: WorkflowNodeType | null;
  onSave: (config: Record<string, unknown>) => void;
  onClose: () => void;
}

export function NodeConfigPanel({ node, onSave, onClose }: NodeConfigPanelProps) {
  const [config, setConfig] = useState<Record<string, unknown>>({
    label: '',
    assigneeType: 'USER',
    assigneeId: null,
    assigneeName: '',
    conditionType: '',
    operator: '>',
    conditionValue: '',
    signType: 'OR',
  });
  const { data: users, isLoading: usersLoading } = useUsers() as {
    data: { id: number; username: string; employeeName: string | null }[] | undefined;
    isLoading: boolean;
  };
  const { data: roles, isLoading: rolesLoading } = useRoles() as {
    data: { id: number; name: string; code: string }[] | undefined;
    isLoading: boolean;
  };

  useEffect(() => {
    if (node?.data) {
      setConfig({
        label: node.data.label || '',
        assigneeType: (node.data.assigneeType as string) || 'USER',
        assigneeId: node.data.assigneeId ?? null,
        assigneeName: node.data.assigneeName || '',
        conditionType: node.data.conditionType || '',
        operator: node.data.operator || '>',
        conditionValue: node.data.conditionValue || '',
        signType: (node.data.signType as string) || 'OR',
      });
    }
  }, [node]);

  const handleSave = () => {
    onSave({ ...config });
    onClose();
  };

  if (!node) return null;

  const isConditionNode = node.data?.type === 'CONDITION';
  const isApprovalNode = node.data?.type === 'APPROVAL';

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <Title heading={6} className={styles.title}>
          节点配置
        </Title>
        <Button type="text" size="small" onClick={onClose}>
          关闭
        </Button>
      </div>

      <Form layout="vertical">
        <Form.Item
          field="label"
          label="节点名称"
          rules={[{ required: true, message: '请输入节点名称' }]}
        >
          <Input
            value={config.label as string}
            onChange={(v) => setConfig({ ...config, label: v })}
            placeholder="输入节点名称"
          />
        </Form.Item>

        {isApprovalNode && (
          <>
            <Form.Item
              label="审批人类型"
              rules={[{ required: true, message: '请选择审批人类型' }]}
            >
              <Select
                value={config.assigneeType as string}
                onChange={(v) => setConfig({ ...config, assigneeType: v })}
              >
                {assigneeTypes.map((item) => (
                  <Select.Option key={item.value} value={item.value}>
                    <Space size={8}>
                      <item.icon />
                      {item.label}
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {config.assigneeType === 'USER' && (
              <Form.Item
                label="选择用户"
                rules={[{ required: true, message: '请选择用户' }]}
              >
                <Select
                  value={config.assigneeId as number | undefined ?? undefined}
                  onChange={(v) => {
                    const selected = users?.find((u) => u.id === v);
                    setConfig({
                      ...config,
                      assigneeId: v,
                      assigneeName: selected ? selected.employeeName || selected.username : '',
                    });
                  }}
                  loading={usersLoading}
                  placeholder="请选择用户"
                >
                  {users?.map((user) => (
                    <Select.Option key={user.id} value={user.id}>
                      {user.employeeName || user.username}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            {config.assigneeType === 'ROLE' && (
              <Form.Item
                label="选择角色"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select
                  value={config.assigneeId as number | undefined ?? undefined}
                  onChange={(v) => {
                    const selected = roles?.find((r) => r.id === v);
                    setConfig({
                      ...config,
                      assigneeId: v,
                      assigneeName: selected ? selected.name : '',
                    });
                  }}
                  loading={rolesLoading}
                  placeholder="请选择角色"
                >
                  {roles?.map((role) => (
                    <Select.Option key={role.id} value={role.id}>
                      {role.name} ({role.code})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            <Form.Item label="会签方式">
              <Select
                value={config.signType as string}
                onChange={(v) => setConfig({ ...config, signType: v })}
              >
                <Select.Option value="OR">或签（任一审批）</Select.Option>
                <Select.Option value="AND">会签（全部审批）</Select.Option>
              </Select>
            </Form.Item>
          </>
        )}

        {isConditionNode && (
          <>
            <div className={styles.conditionHeader}>
              <IconShareAlt className={styles.conditionIcon} />
              <span className={styles.conditionText}>条件配置</span>
            </div>

            <Form.Item
              label="条件类型"
              rules={[{ required: true, message: '请选择条件类型' }]}
            >
              <Select
                value={config.conditionType as string}
                onChange={(v) => setConfig({ ...config, conditionType: v })}
              >
                {conditionTypes.map((item) => (
                  <Select.Option key={item.value} value={item.value}>
                    <div>
                      <div>{item.label}</div>
                      <div className={styles.optionDescription}>{item.description}</div>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {config.conditionType === 'AMOUNT_THRESHOLD' ||
            config.conditionType === 'LEAVE_DAYS' ? (
              <>
                <Form.Item
                  label="比较运算符"
                  rules={[{ required: true, message: '请选择比较运算符' }]}
                >
                  <Select
                    value={config.operator as string}
                    onChange={(v) => setConfig({ ...config, operator: v })}
                  >
                    {operators.map((item) => (
                      <Select.Option key={item.value} value={item.value}>
                        {item.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  label="阈值"
                  rules={[{ required: true, message: '请输入阈值' }]}
                >
                  <Input
                    type="number"
                    value={config.conditionValue as string}
                    onChange={(v) => setConfig({ ...config, conditionValue: v })}
                    placeholder={
                      config.conditionType === 'AMOUNT_THRESHOLD' ? '输入金额阈值' : '输入天数'
                    }
                  />
                </Form.Item>
              </>
            ) : (
              <Form.Item
                label="目标值"
                rules={[{ required: true, message: '请输入目标值' }]}
              >
                <Input
                  value={config.conditionValue as string}
                  onChange={(v) => setConfig({ ...config, conditionValue: v })}
                  placeholder={
                    config.conditionType === 'DEPARTMENT' ? '输入部门ID或名称' : '输入岗位ID或名称'
                  }
                />
              </Form.Item>
            )}
          </>
        )}

        {node.data?.type === 'CC' && (
          <Form.Item label="抄送对象">
            <Input
              value={config.assigneeName as string}
              onChange={(v) => setConfig({ ...config, assigneeName: v })}
              placeholder="输入抄送用户名称"
            />
          </Form.Item>
        )}

        <Button type="primary" long onClick={handleSave} className={styles.saveButton}>
          保存配置
        </Button>
      </Form>
    </div>
  );
}

export default NodeConfigPanel;
