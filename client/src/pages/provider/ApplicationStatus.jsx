import { useState, useEffect } from 'react';
import { Card, Typography, Button, Alert, List, Tag, message } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import providerService from '../../services/provider.service';
import { useAuth } from '../../context/AuthContext';
import LoadingState from '../../components/common/LoadingState';
import StatusBadge from '../../components/common/StatusBadge';

const { Title, Paragraph } = Typography;

const ApplicationStatus = () => {
  const { user } = useAuth(); // Need this to optionally trigger context refresh if needed, though status updates on backend
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusData, setStatusData] = useState(null);

  const fetchStatus = async () => {
    try {
      const data = await providerService.getStatus();
      setStatusData(data);
    } catch (error) {
      message.error('Failed to load application status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await providerService.submitApplication();
      message.success('Application submitted successfully!');
      
      // Reload page to reflect new context state (e.g., locking routes)
      // Since context auth only fetches on mount/login, a forced reload ensures AuthContext syncs User.status
      window.location.reload(); 
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to submit application');
      setSubmitting(false);
    }
  };

  if (loading || !statusData) {
    return <LoadingState tip="Loading Application Status..." />;
  }

  const { status, profileComplete, missingFields, rejectionRemark } = statusData;

  const renderDraftState = () => (
    <div>
      <Alert
        message="Application Not Submitted"
        description="Your application is currently in draft mode. Complete your profile to submit it for review."
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      {!profileComplete && (
        <Card title="Missing Requirements" bordered={false} size="small" style={{ marginBottom: 24 }}>
          <List
            size="small"
            dataSource={missingFields}
            renderItem={(item) => <List.Item><Tag color="red">{item}</Tag> is required</List.Item>}
          />
          <Button type="link" onClick={() => navigate('/provider/profile')} style={{ paddingLeft: 0, marginTop: 16 }}>
            Go to Profile Editor
          </Button>
        </Card>
      )}

      <Button 
        type="primary" 
        size="large" 
        icon={<SendOutlined />} 
        onClick={handleSubmit} 
        loading={submitting}
        disabled={!profileComplete}
      >
        Submit Application
      </Button>
      {!profileComplete && <span style={{ marginLeft: 16, color: '#999' }}>Profile must be complete to submit</span>}
    </div>
  );

  const renderPendingState = () => (
    <Alert
      message="Application Under Review"
      description="Your application has been submitted and is currently pending review by our team. You will be notified once a decision is made."
      type="warning"
      icon={<ClockCircleOutlined />}
      showIcon
    />
  );

  const renderApprovedState = () => (
    <Alert
      message="Application Approved"
      description="Congratulations! Your provider application has been approved. You can now start receiving service requests."
      type="success"
      icon={<CheckCircleOutlined />}
      showIcon
    />
  );

  const renderRejectedState = () => (
    <div>
      <Alert
        message="Application Rejected"
        description="Unfortunately, your application was not approved at this time."
        type="error"
        icon={<CloseCircleOutlined />}
        showIcon
        style={{ marginBottom: 24 }}
      />
      <Card title="Reviewer Remarks" bordered={false} size="small" style={{ marginBottom: 24 }}>
        <Paragraph>{rejectionRemark || "No remarks provided."}</Paragraph>
      </Card>

      {!profileComplete && (
        <Card title="Missing Requirements" bordered={false} size="small" style={{ marginBottom: 24 }}>
          <List
            size="small"
            dataSource={missingFields}
            renderItem={(item) => <List.Item><Tag color="red">{item}</Tag> is required</List.Item>}
          />
        </Card>
      )}

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Button onClick={() => navigate('/provider/profile')}>
          Edit Profile
        </Button>
        <Button 
          type="primary" 
          icon={<SendOutlined />} 
          onClick={handleSubmit} 
          loading={submitting}
          disabled={!profileComplete}
        >
          Resubmit Application
        </Button>
        {!profileComplete && <span style={{ color: '#999' }}>Profile must be complete to resubmit</span>}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Application Status</Title>
        <StatusBadge status={status} />
      </div>
      <Card bordered={false}>
        {status === 'draft' && renderDraftState()}
        {status === 'pending' && renderPendingState()}
        {status === 'approved' && renderApprovedState()}
        {status === 'rejected' && renderRejectedState()}
      </Card>
    </div>
  );
};

export default ApplicationStatus;
