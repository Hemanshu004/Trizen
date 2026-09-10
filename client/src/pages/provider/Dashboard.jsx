import { useEffect, useState } from 'react';
import { Card, Typography, Row, Col, Progress, Button, Alert } from 'antd';
import { ArrowRightOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import providerService from '../../services/provider.service';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingState from '../../components/common/LoadingState';

const { Title, Paragraph, Text } = Typography;

const ProviderDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await providerService.getStatus();
        setStatusData(data);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <Alert message={error} type="error" showIcon />;
  }

  const { status, profileComplete, missingFields, rejectionRemark } = statusData;

  // Rough completeness calculation based on missing fields length (assumes ~6 required logical blocks)
  const calculatePercentage = () => {
    if (profileComplete) return 100;
    const totalFields = 6; 
    const missingCount = missingFields ? missingFields.length : totalFields;
    const completed = Math.max(0, totalFields - missingCount);
    return Math.round((completed / totalFields) * 100);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Dashboard</Title>
        <StatusBadge status={status} />
      </div>

      {status === 'rejected' && rejectionRemark && (
        <Alert
          message="Application Rejected"
          description={`Reason: ${rejectionRemark}`}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[24, 24]}>
        <Col xs={24} md={16}>
          <Card title="Application Progress" bordered={false}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
              <Progress 
                type="circle" 
                percent={calculatePercentage()} 
                status={profileComplete ? "success" : "active"}
                size={150}
              />
              <Title level={4} style={{ marginTop: 24 }}>
                {profileComplete ? 'Profile Complete' : 'Profile Incomplete'}
              </Title>
              <Paragraph type="secondary" style={{ textAlign: 'center', maxWidth: 400 }}>
                {status === 'draft' && !profileComplete && 'Complete all required fields in your profile to submit your application.'}
                {status === 'draft' && profileComplete && 'Your profile is ready. You can now submit your application for review.'}
                {status === 'pending' && 'Your application is currently being reviewed by our team.'}
                {status === 'approved' && 'Your application has been approved!'}
                {status === 'rejected' && 'Please update your profile based on the feedback and resubmit.'}
              </Paragraph>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="Quick Actions" bordered={false}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Button 
                type="primary" 
                icon={<EditOutlined />} 
                onClick={() => navigate('/provider/profile')}
                block
              >
                {status === 'draft' || status === 'rejected' ? 'Edit Profile' : 'View Profile'}
              </Button>
              
              <Button 
                onClick={() => navigate('/provider/application')}
                block
              >
                View Application Status <ArrowRightOutlined />
              </Button>
            </div>
          </Card>

          <Card title="Provider Details" bordered={false} style={{ marginTop: 24 }}>
            <p><Text type="secondary">Name: </Text> <Text strong>{user.name}</Text></p>
            <p><Text type="secondary">Email: </Text> <Text strong>{user.email}</Text></p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProviderDashboard;
