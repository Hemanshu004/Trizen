import { Spin } from 'antd';
import PropTypes from 'prop-types';

const LoadingState = ({ tip = "Loading...", size = "large", style }) => {
  return (
    <div style={{ textAlign: 'center', margin: '50px 0', ...style }}>
      <Spin size={size} tip={tip} />
    </div>
  );
};

LoadingState.propTypes = {
  tip: PropTypes.string,
  size: PropTypes.oneOf(['small', 'default', 'large']),
  style: PropTypes.object
};

export default LoadingState;
