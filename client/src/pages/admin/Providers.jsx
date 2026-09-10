import { useState, useEffect } from 'react';
import { Table, Input, Select, Button, Typography, Space, message, Avatar } from 'antd';
import { EyeOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import adminService from '../../services/admin.service';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';

const { Title } = Typography;
const { Option } = Select;

const VALID_CATEGORIES = [
  'Cleaning', 'Plumbing', 'Electrical', 'Carpentry', 'Painting', 
  'Appliance Repair', 'Pest Control', 'Landscaping', 'Moving'
];

const Providers = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  
  // Filters
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(searchParams.get('status') || undefined);
  const [category, setCategory] = useState(undefined);

  const fetchProviders = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (status) params.status = status;
      if (category) params.category = category;

      const result = await adminService.getProviders(params);
      setData(result.providers);
      setPagination({
        current: result.pagination.page,
        pageSize: result.pagination.limit,
        total: result.pagination.total
      });
    } catch (error) {
      message.error('Failed to fetch providers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, category]); // Re-fetch on filter changes

  const handleTableChange = (newPagination) => {
    fetchProviders(newPagination.current, newPagination.pageSize);
  };

  const handleSearch = (value) => {
    setSearch(value);
    fetchProviders(1, pagination.pageSize);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus(undefined);
    setCategory(undefined);
    fetchProviders(1, pagination.pageSize);
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
            size={40}
            style={{ backgroundColor: 'var(--color-primary-alpha)', color: 'var(--color-primary)' }}
          />
          <div>
            <a 
              onClick={(e) => {
                e.preventDefault();
                navigate(`/admin/providers/${record._id}`);
              }}
              style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--color-text)', display: 'block' }}
            >
              {record.name}
            </a>
            <Typography.Text type="secondary" style={{ fontSize: '0.8rem' }}>
              {record.email}
            </Typography.Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      title: 'Categories',
      key: 'categories',
      render: (_, record) => {
        const cats = record.profile?.categories || [];
        return cats.length > 0 ? cats.join(', ') : '-';
      }
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
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
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.02em' }}>Provider Management</Title>
        <Typography.Text type="secondary" style={{ fontSize: '1rem' }}>Review and manage service provider accounts</Typography.Text>
      </div>
      
      <div style={{ 
        marginBottom: 24, 
        padding: 16, 
        background: '#fff', 
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--color-border)'
      }}>
        <Space style={{ flexWrap: 'wrap' }} size="middle">
          <Input.Search
            placeholder="Search name or email"
            allowClear
            onSearch={handleSearch}
            style={{ width: 280 }}
            size="middle"
          />
          <Select
            placeholder="Filter by Status"
            allowClear
            value={status}
            onChange={setStatus}
            style={{ width: 160 }}
            size="middle"
          >
            <Option value="draft">Draft</Option>
            <Option value="pending">Pending</Option>
            <Option value="approved">Approved</Option>
            <Option value="rejected">Rejected</Option>
          </Select>
          <Select
            placeholder="Filter by Category"
            allowClear
            value={category}
            onChange={setCategory}
            style={{ width: 200 }}
            size="middle"
          >
            {VALID_CATEGORIES.map(cat => (
              <Option key={cat} value={cat}>{cat}</Option>
            ))}
          </Select>
          <Button onClick={clearFilters} size="middle">Clear Filters</Button>
        </Space>
      </div>

      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="_id"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: <EmptyState description="No providers found." /> }}
      />
    </div>
  );
};

export default Providers;
