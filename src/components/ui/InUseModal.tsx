import React from 'react';
import { Modal } from 'antd';
import { AlertCircle } from 'lucide-react';
import './InUseModal.css';

interface InUseModalProps {
    open: boolean;
    onOk: () => void;
    title?: string;
    message?: string;
}

const InUseModal: React.FC<InUseModalProps> = ({
    open,
    onOk,
    title = 'This field is in use',
    message = 'You cannot delete this field as it is currently being used in the contact form'
}) => {
    return (
        <Modal
            open={open}
            onCancel={onOk}
            footer={null}
            closable={false}
            centered
            width={440}
            className="in-use-modal delete-confirm-modal"
        >
            <div className="delete-modal-content">
                <div className="delete-modal-header">
                    <div className="delete-icon-container">
                        <AlertCircle size={32} />
                    </div>
                </div>

                <div className="delete-modal-body">
                    <h3 className="delete-modal-title">{title}</h3>
                    <p className="delete-modal-message">{message}</p>

                    <div className="delete-modal-actions">
                        <button
                            className="delete-modal-confirm-btn"
                            onClick={onOk}
                            style={{ margin: '0 auto', maxWidth: '200px' }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default InUseModal;
