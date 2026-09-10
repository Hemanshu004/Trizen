import { Tag } from 'antd';
import PropTypes from 'prop-types';
import { 
  CheckCircleOutlined, 
  SyncOutlined, 
  CloseCircleOutlined, 
  EditOutlined 
} from '@ant-design/icons';

const STATUS_CONFIG = {
  draft: {
    color: '#64748b',
    bgColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    icon: <EditOutlined />
  },
  pending: {
    color: '#d97706',
    bgColor: '#fef3c7',
    borderColor: '#fcd34d',
    icon: <SyncOutlined spin />
  },
  approved: {
    color: '#059669',
    bgColor: '#d1fae5',
    borderColor: '#6ee7b7',
    icon: <CheckCircleOutlined />
  },
  rejected: {
    color: '#dc2626',
    bgColor: '#fee2e2',
    borderColor: '#fca5a5',
    icon: <CloseCircleOutlined />
  }
};

const StatusBadge = ({ status, style }) => {
  const config = STATUS_CONFIG[status?.toLowerCase()] || {
    color: '#64748b',
    bgColor: '#f8fafc',
    borderColor: '#e2e8f0'
  };
  
  return (
    <Tag 
      icon={config.icon}
      style={{ 
        color: config.color,
        background: config.bgColor,
        borderColor: config.borderColor,
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        margin: 0,
        ...style 
      }}
    >
      {status || 'Unknown'}
    </Tag>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  style: PropTypes.object
};

export default StatusBadge;
