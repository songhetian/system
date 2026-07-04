import React from 'react';
import { Result, Button } from '@arco-design/web-react';
import { IconExclamationCircle } from '@arco-design/web-react/icon';

interface Props { children: React.ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <Result
            status="error"
            icon={<IconExclamationCircle />}
            title="页面出错"
            subTitle={this.state.error?.message || '未知错误'}
            extra={<Button type="primary" onClick={this.handleReset}>返回首页</Button>}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
