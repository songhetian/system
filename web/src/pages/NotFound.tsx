import { Result, Button } from '@arco-design/web-react';
import { useNavigate } from 'react-router-dom';
import styles from './NotFound.module.css';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在"
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            返回首页
          </Button>
        }
      />
    </div>
  );
}

export default NotFound;
