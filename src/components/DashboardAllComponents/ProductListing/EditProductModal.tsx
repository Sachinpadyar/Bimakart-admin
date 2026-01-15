//@ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Modal, Row, Col, Input, Select, Button, Switch, Checkbox, Typography, Upload, notification, Spin } from 'antd';
import { ArrowUp, X } from 'lucide-react';
import type { UploadProps } from 'antd';
import { useUpdateProductMutation } from '../../../redux/api/productsApi';
import { useUploadFileMutation } from '../../../redux/api/uploadApi';
import { useGetFieldsQuery } from '../../../redux/api/fieldsApi';

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

interface FormField {
    id: string;
    label: string;
    required: boolean;
    visible: boolean;
}

interface EditProductModalProps {
    open: boolean;
    onCancel: () => void;
    product: any;
}

// Default fields must match main component for consistency
const initialFormFields: FormField[] = [];

const EditProductModal: React.FC<EditProductModalProps> = ({ open, onCancel, product }) => {
    const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
    const [uploadFile] = useUploadFileMutation();
    const { data: fieldsResponse } = useGetFieldsQuery(undefined);

    const apiFields = fieldsResponse?.data || [];

    const [formFields, setFormFields] = useState<FormField[]>(initialFormFields);
    const [formData, setFormData] = useState({
        policyName: '',
        shortDescription: '',
        detailedDescription: '',
        baseProduct: '',
        sellingPrice: '',
    });
    const [charCount, setCharCount] = useState(0);
    const [uploadedIcon, setUploadedIcon] = useState<string | null>(null);
    const [uploadedIconKey, setUploadedIconKey] = useState<string | null>(null);
    const [uploadedFlyer, setUploadedFlyer] = useState<string | null>(null);
    const [uploadedFlyerKey, setUploadedFlyerKey] = useState<string | null>(null);
    const [isIconUploading, setIsIconUploading] = useState(false);
    const [isFlyerUploading, setIsFlyerUploading] = useState(false);

    const maxChars = 50;
    const isInitializedRef = useRef(false);

    // Reset initialization when modal closes
    useEffect(() => {
        if (!open) {
            isInitializedRef.current = false;
        }
    }, [open]);

    // Initialize form with product data
    useEffect(() => {
        if (product && open && !isInitializedRef.current) {
            setFormData({
                policyName: product.name || '',
                shortDescription: product.shortDescription || '',
                detailedDescription: product.detailedDescription || '',
                baseProduct: product.baseProduct || [], // Default to array for multi-select
                sellingPrice: product.sellingPrice ? String(product.sellingPrice) : '',
            });
            setCharCount(product.detailedDescription?.length || 0);
            setUploadedIcon(product.policyIcon || null);
            setUploadedIconKey(null); // Reset key on open, as we rely on existing URL unless changed
            setUploadedFlyer(product.policyFlyer || null);
            setUploadedFlyerKey(null);

            // Re-initialize fields
            if (apiFields.length > 0) {
                syncFields(apiFields);
                isInitializedRef.current = true;
            }
        } else if (product && open && !isInitializedRef.current && apiFields.length === 0) {
            // Case where we are waiting for API fields
            // We can init form data but wait for fields to mark init complete
            setFormData({
                policyName: product.name || '',
                shortDescription: product.shortDescription || '',
                detailedDescription: product.detailedDescription || '',
                baseProduct: product.baseProduct || [],
                sellingPrice: product.sellingPrice ? String(product.sellingPrice) : '',
            });
        }
    }, [product, open, apiFields]);

    const syncFields = (currentApiFields: any[]) => {
        // Create base fields solely from API
        // If we have product fields, we should default specific fields to false unless found.
        // If we DON'T have product fields (maybe old data), we might default to true or false.
        // Given the user's issue, safe default is likely false usually, OR we handle it in the merge.
        const baseFields: FormField[] = currentApiFields.map((field: any) => ({
            id: field._id || field.id,
            label: field.fieldName || field.label,
            required: false,
            visible: true // Default to true, but will be overridden if product.fields exists
        }));

        setFormFields(() => {
            // If product has saved fields configuration, apply it
            if (product && product.fields && Array.isArray(product.fields)) {
                return baseFields.map(f => {
                    // Try to find matching saved field
                    const savedField = product.fields.find((pf: any) => {
                        const savedFieldId = (typeof pf.fieldId === 'object' && pf.fieldId !== null)
                            ? (pf.fieldId._id || pf.fieldId.id)
                            : pf.fieldId;
                        return savedFieldId === f.id;
                    });

                    if (savedField) {
                        return {
                            ...f,
                            required: savedField.required,
                            visible: savedField.visible
                        };
                    }
                    // If product has a fields array but this field isn't in it, it should be hidden
                    return { ...f, visible: false, required: false };
                });
            }
            return baseFields;
        });
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value });
        if (field === 'detailedDescription' && typeof value === 'string') setCharCount(value.length);
    };

    const handleIconUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) return false;
        setIsIconUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('region', 'ap-south-1');
            const res = await uploadFile(fd).unwrap();
            const uploadedKey = res?.data?.key;
            const previewUrl = res?.data?.previewUrl || res?.url || res?.data?.url;

            if (previewUrl) {
                setUploadedIcon(previewUrl);
                if (uploadedKey) setUploadedIconKey(uploadedKey);
                notification.success({ message: 'Icon Uploaded' });
            }
        } catch (e) {
            notification.error({ message: 'Upload Failed' });
        } finally {
            setIsIconUploading(false);
        }
        return false;
    };

    const handleFlyerUpload = async (file: File) => {
        setIsFlyerUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('region', 'ap-south-1');
            const res = await uploadFile(fd).unwrap();
            const uploadedKey = res?.data?.key;
            const previewUrl = res?.data?.previewUrl || res?.url || res?.data?.url;

            if (previewUrl) {
                setUploadedFlyer(previewUrl);
                if (uploadedKey) setUploadedFlyerKey(uploadedKey);
                notification.success({ message: 'Flyer Uploaded' });
            }
        } catch (e) {
            notification.error({ message: 'Upload Failed' });
        } finally {
            setIsFlyerUploading(false);
        }
        return false;
    };

    const handleSubmit = async () => {
        if (!product) return;

        const payload = {
            name: formData.policyName,
            shortDescription: formData.shortDescription,
            detailedDescription: formData.detailedDescription,
            baseProduct: formData.baseProduct,
            sellingPrice: Number(formData.sellingPrice),
            sellingPrice: Number(formData.sellingPrice),
            policyIcon: uploadedIconKey || uploadedIcon || '',
            policyFlyer: uploadedFlyerKey || uploadedFlyer || '',
            fields: formFields
                .filter(f => f.visible)
                .map(f => {
                    const apiField = apiFields.find((af: any) =>
                        (af.fieldName || af.label)?.toLowerCase() === f.label.toLowerCase() ||
                        (af._id || af.id) === f.id
                    );

                    if (apiField && (apiField._id || apiField.id)) {
                        return {
                            fieldId: apiField._id || apiField.id,
                            required: f.required,
                            visible: f.visible
                        };
                    }

                    const isMongoId = /^[0-9a-fA-F]{24}$/.test(f.id);
                    if (isMongoId) {
                        return {
                            fieldId: f.id,
                            required: f.required,
                            visible: f.visible
                        };
                    }
                    return null;
                })
                .filter(Boolean)
        };

        try {
            await updateProduct({ id: product._id || product.id, ...payload }).unwrap();
            notification.success({ message: 'Product Updated' });
            onCancel();
        } catch (error: any) {
            notification.error({ message: 'Update Failed', description: error.data?.message });
        }
    };

    const iconUploadProps: UploadProps = {
        name: 'icon', showUploadList: false, beforeUpload: handleIconUpload, accept: 'image/*',
    };
    const flyerUploadProps: UploadProps = {
        name: 'flyer', showUploadList: false, beforeUpload: handleFlyerUpload, accept: 'image/*,application/pdf',
    };

    return (
        <Modal
            title="Edit Product"
            open={open}
            onCancel={onCancel}
            footer={null}
            width={800}
            className="edit-product-modal"
        >
            <div className="product-form-container" style={{ padding: 0 }}>
                {/* Reusing simplified structure for Modal */}
                <Row gutter={24}>
                    <Col span={24}>
                        <div className="form-field">
                            <Text>Policy Name*</Text>
                            <Input value={formData.policyName} onChange={e => handleInputChange('policyName', e.target.value)} />
                        </div>
                    </Col>
                    <Col span={24}>
                        <div className="form-field">
                            <Text>Short Description*</Text>
                            <Input
                                value={formData.shortDescription}
                                onChange={e => handleInputChange('shortDescription', e.target.value)}
                                maxLength={50}
                                suffix={<span style={{ color: '#999', fontSize: 12 }}>{50 - (formData.shortDescription?.length || 0)}</span>}
                            />
                        </div>
                    </Col>
                    <Col span={24}>
                        <div className="form-field">
                            <Text>Detailed Description</Text>
                            <TextArea rows={3} value={formData.detailedDescription} onChange={e => handleInputChange('detailedDescription', e.target.value)} />
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className="form-field">
                            <Text>Base Product*</Text>
                            <Select
                                mode="multiple"
                                style={{ width: '100%' }}
                                value={formData.baseProduct}
                                onChange={v => handleInputChange('baseProduct', v)}
                                maxTagCount="responsive"
                            >
                                <Option value="health">Health Insurance</Option>
                                <Option value="vehicle">Vehicle Insurance</Option>
                                <Option value="life">Life Insurance</Option>
                            </Select>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className="form-field">
                            <Text>Selling Price*</Text>
                            <Input type="number" value={formData.sellingPrice} onChange={e => handleInputChange('sellingPrice', e.target.value)} />
                        </div>
                    </Col>
                </Row>

                <div className="product-media" style={{ margin: '20px 0' }}>
                    <Text strong>Media</Text>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Text>Policy Icon</Text>
                            <Upload {...iconUploadProps} disabled={isIconUploading}>
                                <div style={{ border: '1px dashed #d9d9d9', padding: 20, textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}>
                                    {isIconUploading ? <Spin /> : uploadedIcon ? <img src={uploadedIcon} style={{ height: 40 }} /> : <ArrowUp />}
                                    <div style={{ marginTop: 8 }}>Click to Upload</div>
                                </div>
                            </Upload>
                        </Col>
                        <Col span={12}>
                            <Text>Policy Flyer</Text>
                            <Upload {...flyerUploadProps} disabled={isFlyerUploading}>
                                <div style={{ border: '1px dashed #d9d9d9', padding: 20, textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}>
                                    {isFlyerUploading ? <Spin /> : uploadedFlyer ? (uploadedFlyer.includes('pdf') ? 'PDF' : <img src={uploadedFlyer} style={{ height: 40 }} />) : <ArrowUp />}
                                    <div style={{ marginTop: 8 }}>Click to Upload</div>
                                </div>
                            </Upload>
                        </Col>
                    </Row>
                </div>

                <div className="fields-config-section">
                    <Text strong>Form Fields</Text>
                    <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #f0f0f0', marginTop: 10 }}>
                        {formFields.map(field => (
                            <div key={field.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
                                <div style={{ flex: 1, fontWeight: 500 }}>{field.label}</div>
                                <div style={{ display: 'flex', gap: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>Required</Text>
                                        <Checkbox
                                            checked={field.required}
                                            onChange={() => setFormFields(formFields.map(f => f.id === field.id ? { ...f, required: !f.required } : f))}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>Visible</Text>
                                        <Switch
                                            size="small"
                                            checked={field.visible}
                                            onChange={() => setFormFields(formFields.map(f => f.id === field.id ? { ...f, visible: !f.visible } : f))}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginTop: 24, textAlign: 'right' }}>
                    <Button onClick={onCancel} style={{ marginRight: 12 }}>Cancel</Button>
                    <Button
                        type="primary"
                        onClick={handleSubmit}
                        loading={isUpdating || isIconUploading || isFlyerUploading}
                        disabled={isUpdating || isIconUploading || isFlyerUploading}
                    >
                        Update Product
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default EditProductModal;
