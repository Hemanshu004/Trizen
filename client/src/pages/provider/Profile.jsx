import { useState, useEffect } from 'react';
import { 
  Card, Typography, Form, Input, Button, Select, InputNumber, 
  Row, Col, message, Alert, Upload, Avatar, List, Tag, Space 
} from 'antd';
import { 
  SaveOutlined, UploadOutlined, UserOutlined, DeleteOutlined, 
  FileOutlined, FilePdfOutlined, FileImageOutlined 
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import providerService from '../../services/provider.service';
import LoadingState from '../../components/common/LoadingState';
import ConfirmModal from '../../components/common/ConfirmModal';
import StatusBadge from '../../components/common/StatusBadge';

const { Title, Text } = Typography;
const { Option } = Select;

const ProviderProfile = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validCategories, setValidCategories] = useState([]);
  
  // File states
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  
  const [documents, setDocuments] = useState([]);
  const [docUploading, setDocUploading] = useState(false);
  const [docType, setDocType] = useState('identity');

  // Deletion state
  const [docToDelete, setDocToDelete] = useState(null);

  const isReadOnly = user?.status === 'pending' || user?.status === 'approved';

  const fetchProfile = async () => {
    try {
      const data = await providerService.getProfile();
      
      form.setFieldsValue({
        name: data.user.name,
        email: data.user.email,
        phone: data.profile.phone,
        categories: data.profile.categories,
        skills: data.profile.skills,
        experience: data.profile.experience,
        address: data.profile.serviceLocation?.address,
        city: data.profile.serviceLocation?.city,
        state: data.profile.serviceLocation?.state,
        pincode: data.profile.serviceLocation?.pincode,
      });

      setValidCategories(data.meta.validCategories || []);
      setProfilePhoto(data.profile.profilePhoto?.url || null);
      setDocuments(data.profile.documents || []);
    } catch (error) {
      message.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        phone: values.phone,
        categories: values.categories,
        skills: values.skills,
        experience: values.experience,
        serviceLocation: {
          address: values.address,
          city: values.city,
          state: values.state,
          pincode: values.pincode,
        }
      };
      
      await providerService.updateProfile(payload);
      message.success('Profile updated successfully');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const data = await providerService.uploadPhoto(formData);
      setProfilePhoto(data.url);
      message.success('Profile photo uploaded successfully');
      onSuccess('ok');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to upload photo');
      onError(error);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleDocumentUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    if (documents.length >= 5) {
      message.error('Maximum limit of 5 documents reached');
      onError(new Error('Limit reached'));
      return;
    }
    setDocUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', docType);
      
      const newDocs = await providerService.uploadDocument(formData);
      setDocuments(newDocs);
      message.success('Document uploaded successfully');
      onSuccess('ok');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to upload document');
      onError(error);
    } finally {
      setDocUploading(false);
    }
  };

  const executeDeleteDocument = async () => {
    try {
      const newDocs = await providerService.deleteDocument(docToDelete);
      setDocuments(newDocs);
      message.success('Document deleted successfully');
      setDocToDelete(null);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to delete document');
      throw error; // Re-throw for ConfirmModal to keep loading state if desired, though here we want it to close on fail too if unhandled.
    }
  };

  if (loading) {
    return <LoadingState tip="Loading Profile..." />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>My Profile</Title>
        <StatusBadge status={user?.status} />
      </div>
      
      {isReadOnly && (
        <Alert 
          message="Profile Locked" 
          description={`Your profile cannot be edited or modified while your application is ${user?.status}.`}
          type="info" 
          showIcon 
          style={{ marginBottom: 24 }}
        />
      )}

      <Form form={form} layout="vertical" onFinish={onFinish} disabled={isReadOnly}>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Space direction="vertical" size="large" style={{ display: 'flex' }}>
              <Card title="Personal Information" bordered={false}>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="email" label="Email Address">
                      <Input disabled />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item 
                      name="phone" label="Phone Number" 
                      rules={[
                        { required: true, message: 'Phone number is required' },
                        { pattern: /^[0-9+\-\s()]+$/, message: 'Invalid phone format' }
                      ]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card title="Services & Experience" bordered={false}>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="categories" label="Service Categories" rules={[{ required: true }]}>
                      <Select mode="multiple" placeholder="Select categories">
                        {validCategories.map(cat => (<Option key={cat} value={cat}>{cat}</Option>))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="skills" label="Specific Skills" rules={[{ required: true }]}>
                      <Select mode="tags" placeholder="Type and press enter" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="experience" label="Years of Experience" rules={[{ required: true }]}>
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card title="Service Location" bordered={false}>
                <Row gutter={16}>
                  <Col xs={24}>
                    <Form.Item name="address" label="Street Address" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="city" label="City" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="state" label="State" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="pincode" label="Pincode" rules={[{ required: true }, { pattern: /^[1-9][0-9]{5}$/, message: 'Valid 6-digit PIN' }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {!isReadOnly && (
                <Card bordered={false}>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} size="large" block>
                    Save Profile Changes
                  </Button>
                </Card>
              )}
            </Space>
          </Col>

          <Col xs={24} lg={8}>
            <Space direction="vertical" size="large" style={{ display: 'flex' }}>
              <Card title="Profile Photo" bordered={false}>
                <div style={{ textAlign: 'center' }}>
                  <Avatar size={120} src={profilePhoto} icon={!profilePhoto && <UserOutlined />} style={{ marginBottom: 16 }} />
                  <div>
                    <Upload
                      customRequest={handlePhotoUpload}
                      showUploadList={false}
                      accept="image/jpeg,image/png,image/webp"
                      disabled={isReadOnly || photoUploading}
                    >
                      <Button icon={<UploadOutlined />} loading={photoUploading} disabled={isReadOnly}>
                        {profilePhoto ? 'Change Photo' : 'Upload Photo'}
                      </Button>
                    </Upload>
                  </div>
                  <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                    Max 5MB. JPEG, PNG, WEBP.
                  </Text>
                </div>
              </Card>

              <Card title="Verification Documents" bordered={false}>
                <List
                  size="small"
                  locale={{ emptyText: 'No documents uploaded yet.' }}
                  dataSource={documents}
                  renderItem={doc => (
                    <List.Item
                      actions={[
                        !isReadOnly && (
                          <Button 
                            key="delete"
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            size="small" 
                            onClick={() => setDocToDelete(doc._id)}
                          />
                        )
                      ]}
                    >
                      <List.Item.Meta
                        avatar={doc.url.endsWith('.pdf') ? <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f' }}/> : <FileImageOutlined style={{ fontSize: 24, color: '#1890ff' }}/>}
                        title={<a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>{doc.originalName}</a>}
                        description={<Tag color="blue">{doc.type.replace('_', ' ')}</Tag>}
                      />
                    </List.Item>
                  )}
                  style={{ marginBottom: 24 }}
                />

                {!isReadOnly && documents.length < 5 && (
                  <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Upload New Document</Text>
                    <Select
                      value={docType}
                      onChange={setDocType}
                      style={{ width: '100%', marginBottom: 16 }}
                    >
                      <Option value="identity">Identity Proof (Aadhaar/PAN)</Option>
                      <Option value="address_proof">Address Proof</Option>
                      <Option value="certification">Professional Certification</Option>
                      <Option value="other">Other</Option>
                    </Select>
                    
                    <Upload.Dragger
                      customRequest={handleDocumentUpload}
                      showUploadList={false}
                      accept="application/pdf,image/jpeg,image/png"
                      disabled={docUploading}
                    >
                      <p className="ant-upload-drag-icon"><FileOutlined /></p>
                      <p className="ant-upload-text">Click or drag file to this area to upload</p>
                      <p className="ant-upload-hint">Support for a single PDF, JPG, or PNG up to 10MB.</p>
                    </Upload.Dragger>
                    {docUploading && <LoadingState size="small" tip="Uploading..." style={{ margin: '16px 0 0 0' }} />}
                  </div>
                )}
                
                {!isReadOnly && documents.length >= 5 && (
                  <Alert type="warning" message="Maximum limit of 5 documents reached." showIcon />
                )}
              </Card>
            </Space>
          </Col>
        </Row>
      </Form>

      <ConfirmModal
        visible={!!docToDelete}
        title="Delete Document"
        content="Are you sure you want to permanently delete this verification document?"
        onConfirm={executeDeleteDocument}
        onCancel={() => setDocToDelete(null)}
        danger={true}
        okText="Delete"
      />
    </div>
  );
};

export default ProviderProfile;
