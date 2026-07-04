import { useState, useEffect } from 'react';
import { Button, Modal, Form, Input, Space, Message } from '@arco-design/web-react';
import { IconEye, IconSave, IconPlayCircle } from '@arco-design/web-react/icon';
import { ReactFlowProvider } from '@xyflow/react';
import WorkflowCanvas from './WorkflowCanvas';
import NodeConfigPanel from './NodeConfigPanel';
import {
  useCreateWorkflowTemplate,
  useUpdateWorkflowTemplate,
  usePublishWorkflowTemplate,
} from '../hooks/useWorkflow';
import type { WorkflowTemplate, NodeType, TemplateNode, Edge } from '@shop/shared';
import type { Node, Edge as FlowEdge } from '@xyflow/react';
import styles from './TemplateEditor.module.css';

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
type WorkflowEdgeType = FlowEdge;

interface TemplateEditorProps {
  template?: WorkflowTemplate | null;
  onClose: () => void;
}

export function TemplateEditor({ template, onClose }: TemplateEditorProps) {
  const [form] = Form.useForm();
  const [nodes, setNodes] = useState<WorkflowNodeType[]>([]);
  const [edges, setEdges] = useState<WorkflowEdgeType[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeType | null>(null);

  const createMutation = useCreateWorkflowTemplate();
  const updateMutation = useUpdateWorkflowTemplate();
  const publishMutation = usePublishWorkflowTemplate();

  useEffect(() => {
    if (template) {
      form.setFieldsValue({
        name: template.name,
        description: template.description || '',
      });
      setNodes(
        (template.nodes as unknown as TemplateNode[]).map((node: TemplateNode, index: number) => ({
          id: `node-${index}`,
          type: 'custom',
          position: { x: 100 + index * 200, y: 200 },
          data: { ...node } as WorkflowNodeData,
        })) || [],
      );
      setEdges(
        (template.edges as unknown as Edge[]).map((edge: Edge, index: number) => ({
          id: `edge-${index}`,
          source: `node-${edge.sourceNodeIndex}`,
          target: `node-${edge.targetNodeIndex}`,
          label: edge.label,
          data: {
            sourceNodeIndex: edge.sourceNodeIndex,
            targetNodeIndex: edge.targetNodeIndex,
          },
        })) || [],
      );
    } else {
      form.setFieldsValue({
        name: '',
        description: '',
      });
      setNodes([
        {
          id: 'node-0',
          type: 'custom',
          position: { x: 100, y: 200 },
          data: { type: 'START', label: '开始' } as WorkflowNodeData,
        },
        {
          id: 'node-1',
          type: 'custom',
          position: { x: 350, y: 200 },
          data: { type: 'APPROVAL', label: '审批' } as WorkflowNodeData,
        },
        {
          id: 'node-2',
          type: 'custom',
          position: { x: 600, y: 200 },
          data: { type: 'END', label: '结束' } as WorkflowNodeData,
        },
      ]);
      setEdges([
        { id: 'edge-0', source: 'node-0', target: 'node-1' },
        { id: 'edge-1', source: 'node-1', target: 'node-2' },
      ]);
    }
  }, [template, form]);

  const handleNodeClick = (_event: React.MouseEvent, node: WorkflowNodeType) => {
    setSelectedNode(node);
  };

  const handleSaveConfig = (config: Record<string, unknown>) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === selectedNode?.id
          ? { ...node, data: { ...node.data, ...config } as WorkflowNodeData }
          : node,
      ),
    );
  };

  const handleSave = async () => {
    try {
      const values = await form.validate();
      const templateData = {
        name: String(values.name).trim(),
        description: String(values.description || '').trim(),
        nodes: nodes.map((n) => n.data) as unknown as TemplateNode[],
        edges: edges.map((e) => ({
          sourceNodeIndex: e.data?.sourceNodeIndex as number ?? Number(e.source.replace('node-', '')),
          targetNodeIndex: e.data?.targetNodeIndex as number ?? Number(e.target.replace('node-', '')),
          label: e.label as string | undefined,
        })),
      };

      if (template) {
        await updateMutation.mutateAsync({ id: template.id, data: templateData });
        Message.success('模板更新成功');
      } else {
        await createMutation.mutateAsync(templateData);
        Message.success('模板创建成功');
      }
      onClose();
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        return;
      }
      Message.error('保存失败');
    }
  };

  const handlePublish = async () => {
    if (!template?.id) {
      Message.warning('请先保存模板');
      return;
    }
    try {
      await publishMutation.mutateAsync(template.id);
      Message.success('模板发布成功');
      onClose();
    } catch (err) {
      Message.error('发布失败');
    }
  };

  const isPublished = template?.status === 'PUBLISHED';

  return (
    <Modal
      title={template ? `编辑模板: ${template.name}` : '新建工作流模板'}
      visible
      onCancel={onClose}
      footer={null}
      style={{ width: '90vw', height: '90vh' }}
      maskClosable={false}
    >
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <Form
            form={form}
            layout="inline"
            className={styles.headerForm}
          >
            <Form.Item
              field="name"
              label="模板名称"
              rules={[{ required: true, message: '请输入模板名称' }]}
            >
              <Input
                placeholder="输入模板名称"
                className={styles.nameInput}
              />
            </Form.Item>
            <Form.Item
              field="description"
              label="描述"
            >
              <Input
                placeholder="输入模板描述"
                className={styles.descInput}
              />
            </Form.Item>
          </Form>
          <Space size={8}>
            <Button icon={<IconEye />} onClick={handleSave}>
              保存草稿
            </Button>
            <Button
              type="primary"
              icon={<IconSave />}
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              保存
            </Button>
            {template?.status === 'DRAFT' && (
              <Button
                type="primary"
                icon={<IconPlayCircle />}
                onClick={handlePublish}
                loading={publishMutation.isPending}
              >
                发布模板
              </Button>
            )}
            <Button onClick={onClose}>取消</Button>
          </Space>
        </div>

        <div className={styles.canvasContainer}>
          <div className={styles.canvasWrapper}>
            <ReactFlowProvider>
              <WorkflowCanvas
                nodes={nodes}
                edges={edges}
                onNodesChange={setNodes}
                onEdgesChange={setEdges}
                onNodeClick={handleNodeClick}
                readOnly={isPublished}
              />
            </ReactFlowProvider>
          </div>
          <NodeConfigPanel
            node={selectedNode}
            onSave={handleSaveConfig}
            onClose={() => setSelectedNode(null)}
          />
        </div>
      </div>
    </Modal>
  );
}

export default TemplateEditor;
