import { Card, Statistic, Skeleton } from 'antd';
import PropTypes from 'prop-types';

const StatCard = ({ title, value, icon, loading, valueColor, onClick }) => {
  return (
    <Card 
      bordered={false} 
      hoverable={!!onClick}
      onClick={onClick}
      style={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: onClick ? 'pointer' : 'default' }}
      bodyStyle={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} title={false} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            backgroundColor: `${valueColor}15` || 'var(--color-primary-alpha)',
            color: valueColor || 'var(--color-primary)',
            padding: '16px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            marginRight: '20px'
          }}>
            {icon}
          </div>
          <div>
            <div style={{ 
              color: 'var(--color-text-secondary)', 
              fontSize: '0.875rem', 
              fontWeight: 600, 
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px' 
            }}>
              {title}
            </div>
            <div style={{ 
              color: valueColor || 'var(--color-text)', 
              fontSize: '2rem', 
              fontWeight: 700, 
              lineHeight: 1 
            }}>
              {value}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  icon: PropTypes.node,
  loading: PropTypes.bool,
  valueColor: PropTypes.string,
  onClick: PropTypes.func
};

export default StatCard;
