import { useState, useEffect } from 'react';
import { Row, Col, Typography, message, Card, Progress, Table, Avatar, Button, Space } from 'antd';
import { TeamOutlined, EditOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/admin.service';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

const { Title, Text } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentProviders, setRecentProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, providersData] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getProviders({ page: 1, limit: 5 })
        ]);
        setStats(statsData);
        setRecentProviders(providersData.providers || []);
      } catch (error) {
        message.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !stats) {
    return <LoadingState tip="Loading Admin Dashboard..." />;
  }

  const total = stats.total || 0;
  
  // Safe percentage calculation
  const getPercent = (value) => {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const columns = [
    {
      title: 'Provider',
      key: 'provider',
      render: (_, record) => (
        <Space size="middle">
          <Avatar 
            src={record.profile?.profilePhoto?.url} 
            icon={!record.profile?.profilePhoto?.url && <UserOutlined />} 
            style={{ backgroundColor: 'var(--color-primary-alpha)', color: 'var(--color-primary)' }}
          />
          <div>
            <Text strong style={{ display: 'block' }}>{record.name}</Text>
            <Text type="secondary" style={{ fontSize: '0.8rem' }}>{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'status',
      render: (status) => <StatusBadge status={status} />
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          ghost 
          size="small" 
          icon={<EyeOutlined />}
          onClick={() => navigate(`/admin/providers/${record._id}`)}
          style={{ borderRadius: '6px', fontWeight: 600 }}
        >
          Review
        </Button>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <Title level={3} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.02em' }}>Admin Dashboard</Title>
        <Text type="secondary" style={{ fontSize: '1rem' }}>Overview of service provider applications</Text>
      </div>
      
      {/* 1. Stat Cards Row */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={4}>
          <StatCard 
            title="Total" 
            value={stats.total} 
            icon={<TeamOutlined />} 
            valueColor="var(--color-primary)"
            onClick={() => navigate('/admin/providers')}
          />
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <StatCard 
            title="Pending" 
            value={stats.pending} 
            valueColor="var(--color-warning)"
            icon={<ClockCircleOutlined />} 
            onClick={() => navigate('/admin/providers?status=pending')}
          />
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <StatCard 
            title="Approved" 
            value={stats.approved} 
            valueColor="var(--color-success)"
            icon={<CheckCircleOutlined />} 
            onClick={() => navigate('/admin/providers?status=approved')}
          />
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <StatCard 
            title="Rejected" 
            value={stats.rejected} 
            valueColor="var(--color-error)"
            icon={<CloseCircleOutlined />} 
            onClick={() => navigate('/admin/providers?status=rejected')}
          />
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <StatCard 
            title="Draft" 
            value={stats.draft} 
            valueColor="var(--color-draft)"
            icon={<EditOutlined />} 
            onClick={() => navigate('/admin/providers?status=draft')}
          />
        </Col>
      </Row>

      {/* 2. Overview & Distribution Row */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card 
            title="Application Overview" 
            bordered={false} 
            style={{ height: '100%', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}
          >
            {total === 0 ? (
              <EmptyState description="No provider applications yet." />
            ) : (
              <div style={{ padding: '20px 0' }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  Total Providers Distribution
                </Text>
                
                {/* Custom CSS Horizontal Stacked Bar Chart */}
                <div style={{ 
                  display: 'flex', 
                  height: '32px', 
                  borderRadius: '16px', 
                  overflow: 'hidden',
                  width: '100%',
                  marginBottom: '24px'
                }}>
                  <div style={{ width: `${getPercent(stats.approved)}%`, backgroundColor: 'var(--color-success)', transition: 'width 0.5s ease' }} title={`Approved: ${stats.approved}`} />
                  <div style={{ width: `${getPercent(stats.pending)}%`, backgroundColor: 'var(--color-warning)', transition: 'width 0.5s ease' }} title={`Pending: ${stats.pending}`} />
                  <div style={{ width: `${getPercent(stats.draft)}%`, backgroundColor: 'var(--color-draft)', transition: 'width 0.5s ease' }} title={`Draft: ${stats.draft}`} />
                  <div style={{ width: `${getPercent(stats.rejected)}%`, backgroundColor: 'var(--color-error)', transition: 'width 0.5s ease' }} title={`Rejected: ${stats.rejected}`} />
                </div>

                <Row gutter={[16, 16]}>
                  <Col span={6} xs={12} md={6}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--color-success)', marginRight: 8 }} />
                      <Text strong>Approved</Text>
                    </div>
                  </Col>
                  <Col span={6} xs={12} md={6}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--color-warning)', marginRight: 8 }} />
                      <Text strong>Pending</Text>
                    </div>
                  </Col>
                  <Col span={6} xs={12} md={6}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--color-draft)', marginRight: 8 }} />
                      <Text strong>Draft</Text>
                    </div>
                  </Col>
                  <Col span={6} xs={12} md={6}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--color-error)', marginRight: 8 }} />
                      <Text strong>Rejected</Text>
                    </div>
                  </Col>
                </Row>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title="Status Distribution" 
            bordered={false} 
            style={{ height: '100%', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}
          >
            {total === 0 ? (
              <EmptyState description="No data to distribute." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>Approved</Text>
                    <Text strong>{stats.approved} <Text type="secondary">({getPercent(stats.approved)}%)</Text></Text>
                  </div>
                  <Progress percent={getPercent(stats.approved)} strokeColor="var(--color-success)" showInfo={false} size="small" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>Pending</Text>
                    <Text strong>{stats.pending} <Text type="secondary">({getPercent(stats.pending)}%)</Text></Text>
                  </div>
                  <Progress percent={getPercent(stats.pending)} strokeColor="var(--color-warning)" showInfo={false} size="small" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>Draft</Text>
                    <Text strong>{stats.draft} <Text type="secondary">({getPercent(stats.draft)}%)</Text></Text>
                  </div>
                  <Progress percent={getPercent(stats.draft)} strokeColor="var(--color-draft)" showInfo={false} size="small" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>Rejected</Text>
                    <Text strong>{stats.rejected} <Text type="secondary">({getPercent(stats.rejected)}%)</Text></Text>
                  </div>
                  <Progress percent={getPercent(stats.rejected)} strokeColor="var(--color-error)" showInfo={false} size="small" />
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 3. Recent Providers & Quick Actions Row */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card 
            title="Provider Applications" 
            bordered={false} 
            style={{ borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}
            bodyStyle={{ padding: 0 }}
          >
            {recentProviders.length === 0 ? (
              <div style={{ padding: '40px' }}>
                <EmptyState description="No providers found." />
              </div>
            ) : (
              <Table 
                dataSource={recentProviders} 
                columns={columns} 
                rowKey="_id" 
                pagination={false}
                size="middle"
                scroll={{ x: 'max-content' }}
              />
            )}
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card 
            title="Quick Actions" 
            bordered={false} 
            style={{ borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', height: '100%' }}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                block 
                size="large"
                icon={<ClockCircleOutlined />}
                onClick={() => navigate('/admin/providers?status=pending')}
                style={{ height: '48px', justifyContent: 'flex-start', paddingLeft: '24px' }}
              >
                Review Pending Applications
              </Button>
              <Button 
                block 
                size="large"
                icon={<TeamOutlined />}
                onClick={() => navigate('/admin/providers')}
                style={{ height: '48px', justifyContent: 'flex-start', paddingLeft: '24px' }}
              >
                View All Providers
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
