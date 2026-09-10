import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Input, message, Alert, List, Typography, Space, Row, Col, Avatar, Divider, Tag } from 'antd';
import { CheckOutlined, CloseOutlined, FileTextOutlined, ArrowLeftOutlined, DownloadOutlined, UserOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import adminService from '../../services/admin.service';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingState from '../../components/common/LoadingState';
import ConfirmModal from '../../components/common/ConfirmModal';
import EmptyState from '../../components/common/EmptyState';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ProviderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [docLoading, setDocLoading] = useState({});
  
  // Modal States
  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectionRemark, setRejectionRemark] = useState('');

  const handleDocumentAction = async (docId, actionType, originalName) => {
    try {
      setDocLoading(prev => ({ ...prev, [docId]: actionType }));
      
      const blob = await adminService.getDocumentBlob(id, docId, actionType === 'download');
      
      // If response is JSON, it means an error occurred but was parsed as blob
      if (blob.type === 'application/json') {
        const text = await blob.text();
        const error = JSON.parse(text);
        throw new Error(error.message || 'Failed to fetch document');
      }

      const url = window.URL.createObjectURL(blob);
      
      if (actionType === 'view') {
        window.open(url, '_blank');
        // Revoke after a short delay to allow browser to open it
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else if (actionType === 'download') {
        const a = document.createElement('a');
        a.href = url;
        a.download = originalName || 'document';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      message.error(`Failed to ${actionType} document: ` + (err.response?.data?.message || err.message));
    } finally {
      setDocLoading(prev => ({ ...prev, [docId]: null }));
    }
  };

  const fetchDetail = async () => {
    try {
      const result = await adminService.getProviderDetail(id);
      setData(result);
    } catch (error) {
      message.error('Failed to fetch provider details');
      navigate('/admin/providers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const executeApprove = async () => {
    try {
      await adminService.approveProvider(id);
      message.success('Provider approved successfully');
      fetchDetail(); // Refresh data
      setIsApproveModalVisible(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to approve provider');
      throw error;
    }
  };

  const executeReject = async () => {
    if (!rejectionRemark.trim()) {
      message.warning('Rejection remark is required');
      throw new Error('Validation failed');
    }
    try {
      await adminService.rejectProvider(id, rejectionRemark);
      message.success('Provider rejected successfully');
      setIsRejectModalVisible(false);
      setRejectionRemark('');
      fetchDetail(); // Refresh data
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to reject provider');
      throw error;
    }
  };

  if (loading || !data) {
    return <LoadingState tip="Loading Provider Details..." />;
  }

  const { user, profile } = data;
  const isPending = user.status === 'pending';

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="link" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/admin/providers')}
          style={{ padding: 0 }}
        >
          Back to Providers
        </Button>
      </div>

      <div style={{ marginBottom: 24, padding: 24, background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
        <Row gutter={24} align="middle">
          <Col>
            <Avatar 
              src={profile?.profilePhoto?.url} 
              icon={!profile?.profilePhoto?.url && <UserOutlined />} 
              size={100}
              shape="square"
              style={{ borderRadius: '16px', backgroundColor: 'var(--color-primary-alpha)', color: 'var(--color-primary)' }}
            />
          </Col>
          <Col flex="auto">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Title level={3} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.02em' }}>{user.name}</Title>
                <Space direction="vertical" size="small" style={{ marginTop: 8 }}>
                  <Space style={{ color: 'var(--color-text-secondary)' }}>
                    <MailOutlined /> {user.email}
                  </Space>
                  {profile?.phone && (
                    <Space style={{ color: 'var(--color-text-secondary)' }}>
                      <PhoneOutlined /> {profile.phone}
                    </Space>
                  )}
                  <div style={{ marginTop: 4 }}>
                    <StatusBadge status={user.status} />
                  </div>
                </Space>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {user.status === 'rejected' && profile?.rejectionRemark && (
        <Alert 
          message="Rejection Remark" 
          description={profile.rejectionRemark} 
          type="error" 
          showIcon 
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Space direction="vertical" size="large" style={{ display: 'flex', width: '100%' }}>
            <Card title="Basic Information" bordered={false}>
              <Descriptions column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} labelStyle={{ color: 'var(--color-text-secondary)' }}>
                <Descriptions.Item label="Name"><Text strong>{user.name}</Text></Descriptions.Item>
                <Descriptions.Item label="Email"><Text strong>{user.email}</Text></Descriptions.Item>
                <Descriptions.Item label="Phone"><Text strong>{profile?.phone || '-'}</Text></Descriptions.Item>
                <Descriptions.Item label="Registered"><Text strong>{new Date(user.createdAt).toLocaleString()}</Text></Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Services & Skills" bordered={false}>
              <Descriptions column={{ xxl: 2, xl: 2, lg: 1, md: 1, sm: 1, xs: 1 }} labelStyle={{ color: 'var(--color-text-secondary)' }}>
                <Descriptions.Item label="Categories" span={2}>
                  {profile?.categories?.length > 0 ? (
                    <Space size={[0, 8]} wrap>
                      {profile.categories.map(cat => <Tag key={cat} color="blue">{cat}</Tag>)}
                    </Space>
                  ) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Skills" span={2}>
                  {profile?.skills?.length > 0 ? (
                    <Space size={[0, 8]} wrap>
                      {profile.skills.map(skill => <Tag key={skill}>{skill}</Tag>)}
                    </Space>
                  ) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Experience"><Text strong>{profile?.experience !== undefined ? `${profile.experience} Years` : '-'}</Text></Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Service Location" bordered={false}>
              <Descriptions column={{ xxl: 2, xl: 2, lg: 1, md: 1, sm: 1, xs: 1 }} labelStyle={{ color: 'var(--color-text-secondary)' }}>
                <Descriptions.Item label="Address"><Text strong>{profile?.serviceLocation?.address || '-'}</Text></Descriptions.Item>
                <Descriptions.Item label="City"><Text strong>{profile?.serviceLocation?.city || '-'}</Text></Descriptions.Item>
                <Descriptions.Item label="State"><Text strong>{profile?.serviceLocation?.state || '-'}</Text></Descriptions.Item>
                <Descriptions.Item label="Pincode"><Text strong>{profile?.serviceLocation?.pincode || '-'}</Text></Descriptions.Item>
              </Descriptions>
            </Card>
          </Space>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" size="large" style={{ display: 'flex', width: '100%' }}>
            {isPending && (
              <Card title="Application Decision" bordered={false} bodyStyle={{ padding: '24px' }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  Review the provider's details and documents before making a decision.
                </Text>
                <Row gutter={16}>
                  <Col span={12}>
                    <Button 
                      type="primary" 
                      icon={<CheckOutlined />} 
                      onClick={() => setIsApproveModalVisible(true)} 
                      style={{ backgroundColor: 'var(--color-success)', width: '100%', height: 40 }}
                    >
                      Approve
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button 
                      type="primary" 
                      danger 
                      icon={<CloseOutlined />} 
                      onClick={() => setIsRejectModalVisible(true)}
                      style={{ width: '100%', height: 40 }}
                    >
                      Reject
                    </Button>
                  </Col>
                </Row>
              </Card>
            )}

        <Card title="Verification Documents" bordered={false}>
          {profile?.documents && profile.documents.length > 0 ? (
            <List
              itemLayout="horizontal"
              dataSource={profile.documents}
              renderItem={doc => {
                const isLoadingView = docLoading[doc._id] === 'view';
                const isLoadingDownload = docLoading[doc._id] === 'download';
                
                return (
                  <List.Item
                    actions={[
                      <Button 
                        key="view" 
                        size="small"
                        loading={isLoadingView}
                        onClick={() => handleDocumentAction(doc._id, 'view', doc.originalName)}
                      >
                        View
                      </Button>,
                      <Button 
                        key="download" 
                        size="small"
                        type="primary"
                        ghost
                        icon={<DownloadOutlined />} 
                        loading={isLoadingDownload}
                        onClick={() => handleDocumentAction(doc._id, 'download', doc.originalName)}
                      >
                        Download
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<FileTextOutlined style={{ fontSize: 24, color: 'var(--color-primary)' }} />}
                      title={<Text strong>{doc.type.toUpperCase()}</Text>}
                      description={doc.originalName}
                    />
                  </List.Item>
                );
              }}
            />
          ) : (
            <EmptyState description="No verification documents uploaded." />
          )}
        </Card>
          </Space>
        </Col>
      </Row>

      <ConfirmModal
        visible={isApproveModalVisible}
        title="Approve Provider"
        content="Are you sure you want to approve this provider application? They will be granted full access to the platform."
        onConfirm={executeApprove}
        onCancel={() => setIsApproveModalVisible(false)}
        okText="Yes, Approve"
      />

      <ConfirmModal
        visible={isRejectModalVisible}
        title="Reject Application"
        onConfirm={executeReject}
        onCancel={() => {
          setIsRejectModalVisible(false);
          setRejectionRemark('');
        }}
        danger={true}
        okText="Reject Provider"
      >
        <Typography.Paragraph>
          Please provide a clear reason for rejecting this application. The provider will see this remark.
        </Typography.Paragraph>
        <TextArea
          rows={4}
          value={rejectionRemark}
          onChange={(e) => setRejectionRemark(e.target.value)}
          placeholder="e.g. Identity document is blurred. Please upload a clear copy."
        />
      </ConfirmModal>
    </div>
  );
};

export default ProviderDetail;
