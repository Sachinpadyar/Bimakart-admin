/**
 * DeleteConfirmModal - A reusable confirmation modal for delete actions
 * 
 * @example
 * const [modalOpen, setModalOpen] = useState(false);
 * 
 * <DeleteConfirmModal
 *   open={modalOpen}
 *   onCancel={() => setModalOpen(false)}
 *   onConfirm={() => {
 *     // Perform delete action
 *     setModalOpen(false);
 *   }}
 *   title="Are you sure want to delete this item?"
 *   message="This action cannot be undone."
 * />
 */
import React from 'react';
import { Modal } from 'antd';
import { Trash2 } from 'lucide-react';
import './DeleteConfirmModal.css';

interface DeleteConfirmModalProps {
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    loading?: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    open,
    onCancel,
    onConfirm,
    title = 'Are you sure want to delete this field?',
    message = 'This action cannot be undone. Once deleted, the data will be permanently removed.',
    loading = false,
}) => {
    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            closable={false}
            centered
            width={440}
            className="delete-confirm-modal"
        >
            <div className="delete-modal-content">
                {/* Orange Header with Icon */}
                <div className="delete-modal-header">
                    <div className="delete-icon-container">
                        <Trash2 size={24} />
                    </div>
                </div>

                {/* White Content Area */}
                <div className="delete-modal-body">
                    <h3 className="delete-modal-title">{title}</h3>
                    <p className="delete-modal-message">{message}</p>

                    {/* Action Buttons */}
                    <div className="delete-modal-actions">
                        <button
                            className="delete-modal-cancel-btn"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            className="delete-modal-confirm-btn"
                            onClick={onConfirm}
                            disabled={loading}
                        >
                            {loading ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteConfirmModal;
