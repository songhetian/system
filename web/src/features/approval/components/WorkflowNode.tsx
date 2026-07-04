import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  IconUpload,
  IconCheckCircle,
  IconShareAlt,
  IconUser,
  IconStop,
} from '@arco-design/web-react/icon';
import type { NodeType } from '@shop/shared';
import styles from './WorkflowNode.module.css';

interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  type: NodeType;
  assigneeType?: string;
  assigneeName?: string;
  conditionType?: string;
}

interface WorkflowNodeProps {
  data: WorkflowNodeData;
  selected?: boolean;
}

const nodeClassMap: Record<NodeType, string> = {
  START: styles.nodeStart,
  APPROVAL: styles.nodeApproval,
  CONDITION: styles.nodeCondition,
  CC: styles.nodeCc,
  END: styles.nodeEnd,
  SUB_PROCESS: styles.nodeApproval,
};

const nodeIconMap: Record<NodeType, React.ComponentType<{ style?: React.CSSProperties }>> = {
  START: IconUpload,
  APPROVAL: IconCheckCircle,
  CONDITION: IconShareAlt,
  CC: IconUser,
  END: IconStop,
  SUB_PROCESS: IconUpload,
};

export const WorkflowNode = memo(function WorkflowNode({ data, selected }: WorkflowNodeProps) {
  const nodeClass = nodeClassMap[data.type] || styles.nodeApproval;
  const Icon = nodeIconMap[data.type] || IconUpload;

  return (
    <div
      className={`${styles.node} ${nodeClass} ${selected ? styles.nodeSelected : ''}`}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#fff' }} />
      <div className={styles.nodeContent}>
        <Icon style={{ fontSize: 16 }} />
        <span>{data.label}</span>
        {data.assigneeName && (
          <span className={styles.assigneeName}>({data.assigneeName})</span>
        )}
        {data.conditionType && (
          <span className={styles.conditionTag}>[条件]</span>
        )}
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#fff' }} />
    </div>
  );
});

export default WorkflowNode;
