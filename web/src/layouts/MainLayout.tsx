// 修改点：1. 移除所有 tailwind 类名，替换为 CSS module 2. 明确 Message 类型导入 3. 图标全部使用 Arco 官方图标
import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Badge, Popover } from '@arco-design/web-react';
import {
  IconDashboard,
  IconUserGroup,
  IconUser,
  IconCalendar,
  IconClockCircle,
  IconCalendarClock,
  IconTag,
  IconFile,
  IconBook,
  IconSearch,
  IconCheckCircle,
  IconNotification,
  IconUserAdd,
  IconMenuFold,
  IconMenuUnfold,
  IconClose,
  IconSafe,
  IconSettings,
} from '@arco-design/web-react/icon';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useMessageStore, type Message } from '@/store/message';
import styles from './style.module.css';

const Sider = Layout.Sider;
const Header = Layout.Header;
const Content = Layout.Content;
const MenuItem = Menu.Item;

function stripHtmlTags(html: string, maxLen = 60): string {
  const text = html.replace(/<[^>]*>/g, '').trim();
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

type MenuItemConfig = {
  key: string;
  icon: React.ReactNode;
  label: string;
};

const menuItems: MenuItemConfig[] = [
  { key: '/dashboard', icon: <IconDashboard />, label: '仪表盘' },
  { key: '/organization', icon: <IconUserGroup />, label: '组织架构' },
  { key: '/employee', icon: <IconUser />, label: '员工管理' },
  { key: '/schedule', icon: <IconCalendar />, label: '排班管理' },
  { key: '/attendance', icon: <IconClockCircle />, label: '考勤管理' },
  { key: '/leave', icon: <IconCalendarClock />, label: '假期管理' },
  { key: '/salary', icon: <IconTag />, label: '薪资管理' },
  { key: '/expense', icon: <IconFile />, label: '报销管理' },
  { key: '/training', icon: <IconBook />, label: '培训管理' },
  { key: '/knowledge', icon: <IconSearch />, label: '知识库' },
  { key: '/approval', icon: <IconCheckCircle />, label: '审批流' },
  { key: '/message', icon: <IconNotification />, label: '消息公告' },
  { key: '/audit', icon: <IconSafe />, label: '操作审计' },
  { key: '/report', icon: <IconFile />, label: '数据报表' },
  { key: '/system', icon: <IconSettings />, label: '系统管理' },
];

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const { messages, markAsRead, markAllAsRead, deleteMessage, getUnreadCount } = useMessageStore();
  const unreadCount = getUnreadCount();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const messageContent = () => (
    <div className={styles.messageList}>
      <div className={styles.messageHeader}>
        <span className={styles.messageHeaderTitle}>消息通知</span>
        {unreadCount > 0 && (
          <button
            className={styles.markAllReadBtn}
            onClick={(e) => {
              e.stopPropagation();
              markAllAsRead();
            }}
          >
            全部已读
          </button>
        )}
      </div>
      {messages.length === 0 ? (
        <div className={styles.messageEmpty}>暂无消息</div>
      ) : (
        <div className={styles.messageScrollContainer}>
          {messages.slice(0, 20).map((msg: Message) => (
            <div
              key={msg.id}
              className={`${styles.messageItem} ${!msg.read ? styles.messageItemUnread : ''}`}
              onClick={() => {
                markAsRead(msg.id);
              }}
            >
              <div className={styles.messageItemInner}>
                <div className={styles.messageContent}>
                  <span className={styles.messageTitle}>{msg.title}</span>
                  <p className={styles.messageDesc} dangerouslySetInnerHTML={{ __html: stripHtmlTags(msg.content, 60) }} />
                  <span className={styles.messageTime}>
                    {new Date(msg.createdAt).toLocaleString()}
                  </span>
                </div>
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMessage(msg.id);
                  }}
                >
                  <IconClose />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Layout className={styles.layout}>
      <Sider
        collapsed={collapsed}
        collapsible
        trigger={null}
        breakpoint="lg"
        className={styles.sider}
      >
        <div className={styles.logo}>
          <span className={styles.logoText}>HR中台</span>
        </div>
        <Menu
          mode="vertical"
          selectedKeys={[location.pathname]}
          className={styles.siderMenu}
          onClickMenuItem={(key) => navigate(key)}
        >
          {menuItems.map((item) => (
            <MenuItem key={item.key}>
              {item.icon}
              <span>{item.label}</span>
            </MenuItem>
          ))}
        </Menu>
      </Sider>
      <Layout>
        <Header className={styles.header}>
          <div className={styles.headerLeft}>
            <span
              className={styles.collapseBtn}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <IconMenuUnfold /> : <IconMenuFold />}
            </span>
          </div>
          <div className={styles.headerRight}>
            <Space size={16}>
              <Popover content={messageContent()} position="br">
                <Badge count={unreadCount}>
                  <IconNotification className={styles.notificationIcon} />
                </Badge>
              </Popover>
              <Dropdown droplist={
                <Menu onClickMenuItem={(key) => {
                  if (key === 'profile') navigate('/profile');
                  if (key === 'logout') handleLogout();
                }}>
                  <Menu.Item key="profile">
                    <Space size={8}>
                      <IconUser />
                      <span>个人中心</span>
                    </Space>
                  </Menu.Item>
                  <Menu.Item key="logout">
                    <Space size={8}>
                      <IconUserAdd />
                      <span>退出登录</span>
                    </Space>
                  </Menu.Item>
                </Menu>
              } position="br">
                <Space size={8} className={styles.userInfo}>
                  <Avatar size={32} className={styles.avatar}>
                    {user?.username?.charAt(0) || 'U'}
                  </Avatar>
                  <span>{user?.username || '未登录'}</span>
                </Space>
              </Dropdown>
            </Space>
          </div>
        </Header>
        <Content className={styles.content}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
