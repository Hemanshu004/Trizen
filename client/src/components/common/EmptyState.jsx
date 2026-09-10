import { Empty } from 'antd';
import PropTypes from 'prop-types';

const EmptyState = ({ description = "No data available", image = Empty.PRESENTED_IMAGE_SIMPLE, style }) => {
  return (
    <div style={{ margin: '32px 0', ...style }}>
      <Empty image={image} description={description} />
    </div>
  );
};

EmptyState.propTypes = {
  description: PropTypes.node,
  image: PropTypes.node,
  style: PropTypes.object
};

export default EmptyState;
