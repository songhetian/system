import { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WorkflowNode } from './WorkflowNode';
import {
  IconCheckCircle,
  IconUser,
  IconStop,
  IconPlus,
  IconUpload,
  IconShareAlt,
} from '@arco-design/web-react/icon';
import { Button, Form, Select, Input, Space } from '@arco-design/web-react';
import BaseFormModal from '@/components/BaseFormModal';
import type { BaseFormModalRef } from '@/components/BaseFormModal';
import { z } from 'zod';
import type { NodeType } from '@shop/shared';
import styles from './WorkflowCanvas.module.css';

const nodeTypes = {
  custom: WorkflowNode,
};

const zAddNodeForm = z.object({
  nodeType: z.enum(['START', 'APPROVAL', 'CONDITION', 'CC', 'END']),
  nodeLabel: z.string().max(100).optional(),
});

type AddNodeFormValues = z.infer<typeof zAddNodeForm>;

interface NodeOption {
  value: NodeType;
  label: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  colorToken: string;
}

const nodeOptions: NodeOption[] = [
  { value: 'START', label: '开始', icon: IconUpload, colorToken: 'var(--color-success-6)' },
  { value: 'APPROVAL', label: '审批', icon: IconCheckCircle, colorToken: 'var(--color-primary-6)' },
  { value: 'CONDITION', label: '条件', icon: IconShareAlt, colorToken: 'var(--color-warning-6)' },
  { value: 'CC', label: '抄送', icon: IconUser, colorToken: 'var(--color-primary-6)' },
  { value: 'END', label: '结束', icon: IconStop, colorToken: 'var(--color-danger-6)' },
];

interface WorkflowNodeData extends Record<string, unknown> {
  type: NodeType;
  label: string;
  assigneeType?: string;
  assigneeId?: number | null;
  assigneeName?: string;
  conditionType?: string;
  operator?: string;
  conditionValue?: string;
  signType?: string;
}

type WorkflowNodeType = Node<WorkflowNodeData>;
type WorkflowEdgeType = Edge;

interface WorkflowCanvasProps {
  nodes: WorkflowNodeType[];
  edges: WorkflowEdgeType[];
  onNodesChange: (nodes: WorkflowNodeType[]) => void;
  onEdgesChange: (edges: WorkflowEdgeType[]) => void;
  onNodeClick?: (event: React.MouseEvent, node: WorkflowNodeType) => void;
  readOnly?: boolean;
}

export function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  readOnly,
}: WorkflowCanvasProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const formModalRef = useRef<BaseFormModalRef>(null);
  const { screenToFlowPosition } = useReactFlow();

  const onNodesChangeLocal = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(applyNodeChanges(changes, nodes as Node[]) as WorkflowNodeType[]);
    },
    [nodes, onNodesChange],
  );

  const onEdgesChangeLocal = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(applyEdgeChanges(changes, edges as Edge[]) as WorkflowEdgeType[]);
    },
    [edges, onEdgesChange],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const label = sourceNode?.data?.type === 'CONDITION' ? '通过' : undefined;
      onEdgesChange(addEdge({ ...connection, label }, edges as Edge[]) as WorkflowEdgeType[]);
    },
    [edges, nodes, onEdgesChange],
  );

  const handleAddNode = (values: Record<string, unknown>) => {
    const typedValues = values as AddNodeFormValues;
    const position = screenToFlowPosition({
      x: window.innerWidth / 2 - 100,
      y: window.innerHeight / 2 - 50,
    });
    const newNode: WorkflowNodeType = {
      id: `node-${Date.now()}`,
      type: 'custom',
      position,
      data: {
        type: typedValues.nodeType,
        label: typedValues.nodeLabel || nodeOptions.find((n) => n.value === typedValues.nodeType)?.label || '节点',
      },
    };
    onNodesChange([...nodes, newNode]);
    setShowAddModal(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!readOnly && e.key === 'Delete' && window.getSelection()?.toString() === '') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readOnly]);

  return (
    <div className={styles.container}>
      {!readOnly && (
        <Button
          type="primary"
          icon={<IconPlus />}
          onClick={() => setShowAddModal(true)}
          className={styles.addButton}
        >
          添加节点
        </Button>
      )}
      <ReactFlow
        {...({
          nodes: nodes as Node[],
          edges: edges as Edge[],
          onNodesChange: onNodesChangeLocal,
          onEdgesChange: onEdgesChangeLocal,
          onConnect,
          onNodeClick: onNodeClick as (event: React.MouseEvent, node: Node) => void,
          nodeTypes,
          fitView: true,
          defaultZoom: 1,
          deleteKeyCode: readOnly ? null : 'Delete',
          proOptions: { hideAttribution: true },
        } as React.ComponentProps<typeof ReactFlow>)}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      <BaseFormModal
        ref={formModalRef}
        visible={showAddModal}
        title="添加节点"
        onOk={handleAddNode}
        onCancel={() => setShowAddModal(false)}
        okText="确认"
        cancelText="取消"
        width={480}
        initialValues={{
          nodeType: 'APPROVAL',
          nodeLabel: '',
        }}
      >
        <Form.Item
          field="nodeType"
          label="节点类型"
          rules={[{ required: true, message: '请选择节点类型' }]}
        >
          <Select>
            {nodeOptions.map((option) => (
              <Select.Option key={option.value} value={option.value}>
                <Space size={8}>
                  <option.icon style={{ color: option.colorToken }} />
                  {option.label}
                </Space>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          field="nodeLabel"
          label="节点名称"
        >
          <Input placeholder="默认使用节点类型名称" />
        </Form.Item>
      </BaseFormModal>
    </div>
  );
}

export default WorkflowCanvas;
