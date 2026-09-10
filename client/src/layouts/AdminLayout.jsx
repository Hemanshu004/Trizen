import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, Button, theme, Dropdown, Space, Avatar } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DownOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/admin/providers', icon: <TeamOutlined />, label: 'Providers' },
];

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { token: themeToken } = theme.useToken();

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    } else {
      navigate(key);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        onBreakpoint={(broken) => setCollapsed(broken)}
        width={260}
        style={{
          background: '#fff',
          borderRight: '1px solid var(--color-border)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 24px',
            borderBottom: '1px solid var(--color-border)',
            background: '#fff',
          }}
        >
          <div style={{ 
            width: 32, 
            height: 32, 
            borderRadius: 8, 
            background: themeToken.colorPrimary, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 16,
            marginRight: collapsed ? 0 : 12
          }}>
            T
          </div>
          {!collapsed && (
            <Text strong style={{ fontSize: 18, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Trizen Admin
            </Text>
          )}
        </div>

        <div style={{ padding: '16px 8px' }}>
          <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 16px', display: collapsed ? 'none' : 'block', marginBottom: 8 }}>
            Main Menu
          </Text>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            onClick={handleMenuClick}
            items={menuItems}
            style={{ border: 'none' }}
          />
        </div>
        
        <div style={{ position: 'absolute', bottom: 0, width: '100%', borderTop: '1px solid var(--color-border)', padding: '16px 8px' }}>
          <Menu
            mode="inline"
            selectable={false}
            onClick={handleMenuClick}
            items={[{ key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true }]}
            style={{ border: 'none' }}
          />
        </div>
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-border)',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
            height: 64,
            zIndex: 9,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 40, height: 40, marginLeft: -12 }}
            />
          </div>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'info',
                  label: (
                    <div style={{ padding: '4px 0' }}>
                      <Text strong>{user?.name || 'Administrator'}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>{user?.email || 'admin@trizen.com'}</Text>
                    </div>
                  ),
                },
                { type: 'divider' },
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: 'Logout',
                  danger: true,
                  onClick: () => {
                    logout();
                    navigate('/login');
                  },
                },
              ],
            }}
            placement="bottomRight"
            trigger={['click', 'hover']}
          >
            <a onClick={(e) => e.preventDefault()} style={{ color: 'inherit', cursor: 'pointer' }}>
              <Space>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: themeToken.colorPrimary }} />
                <span style={{ display: 'none' }} className="admin-name">{user?.name || 'Administrator'}</span>
                <DownOutlined style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }} />
              </Space>
            </a>
          </Dropdown>
        </Header>

        <Content className="page-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
