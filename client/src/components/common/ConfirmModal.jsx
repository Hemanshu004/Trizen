import { useState } from 'react';
import { Modal } from 'antd';
import PropTypes from 'prop-types';

const ConfirmModal = ({ 
  visible, 
  title, 
  content, 
  onConfirm, 
  onCancel, 
  okText = 'Confirm', 
  cancelText = 'Cancel', 
  danger = false,
  children
}) => {
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={title}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={okText}
      cancelText={cancelText}
      okButtonProps={{ danger }}
      closable={!loading}
      maskClosable={!loading}
      keyboard={!loading}
      cancelButtonProps={{ disabled: loading }}
    >
      {content && <p>{content}</p>}
      {children}
    </Modal>
  );
};

ConfirmModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  content: PropTypes.node,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  okText: PropTypes.string,
  cancelText: PropTypes.string,
  danger: PropTypes.bool,
  children: PropTypes.node
};

export default ConfirmModal;
