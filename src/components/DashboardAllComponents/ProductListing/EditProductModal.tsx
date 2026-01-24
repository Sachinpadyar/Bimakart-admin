//@ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Modal, Row, Col, Input, Select, Button, Switch, Checkbox, Typography, Upload, notification, Spin } from 'antd';
import { ArrowUp, X, FileText, Image as ImageIcon } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import type { UploadProps } from 'antd';
import { useUpdateProductMutation, useGetBaseProductsQuery } from '../../../redux/api/productsApi';
import { useUploadFileMutation } from '../../../redux/api/uploadApi';
import { useGetFieldsQuery } from '../../../redux/api/fieldsApi';
// Salesforce imports removed

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

    // Base Products Query
    const { data: baseProductsResponse, isLoading: isBaseProductsLoading } = useGetBaseProductsQuery(undefined);
    const baseProductsList = baseProductsResponse?.data || [];


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

            // Use signed URLs for preview if available, otherwise fallback (which likely won't show if private)
            setUploadedIcon(product.policyIconUrl || product.policyIcon || null);
            setUploadedIconKey(product.policyIcon || null); // Keep the key for submission if no new upload

            setUploadedFlyer(product.policyFlyerUrl || product.policyFlyer || null);
            setUploadedFlyerKey(product.policyFlyer || null);

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


    const getFileName = (url: string) => {
        if (!url) return '';
        // If it's a signed URL from product, user might want to show the original clean name
        const cleanUrl = url.split('?')[0];
        const parts = cleanUrl.split('__');
        if (parts.length > 1) return parts[1];
        return cleanUrl.split('/').pop() || cleanUrl;
    };

    const getDisplayUrl = (url: string | null) => {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('blob:')) return url;
        return `https://bimakart-directory.s3.ap-south-1.amazonaws.com/${url}`;
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
            sellingPrice: Number(formData.sellingPrice),
            policyIcon: uploadedIconKey || (uploadedIcon === product.policyIconUrl ? product.policyIcon : uploadedIcon) || '',
            policyFlyer: uploadedFlyerKey || (uploadedFlyer === product.policyFlyerUrl ? product.policyFlyer : uploadedFlyer) || '',
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
                            <ReactQuill
                                theme="snow"
                                value={formData.detailedDescription}
                                onChange={(value) => handleInputChange('detailedDescription', value)}
                                placeholder="Enter Detailed Description..."
                                modules={{
                                    toolbar: [
                                        [{ 'header': [1, 2, 3, false] }],
                                        ['bold', 'italic', 'underline'],
                                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                        ['link'],
                                        [{ 'color': [] }, { 'background': [] }]
                                    ]
                                }}
                                formats={[
                                    'header',
                                    'bold', 'italic', 'underline',
                                    'list', 'bullet',
                                    'link',
                                    'color', 'background'
                                ]}
                                style={{
                                    backgroundColor: '#fff',
                                    borderRadius: '6px'
                                }}
                            />
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
                                loading={isBaseProductsLoading}
                                maxTagCount="responsive"
                            >
                                {baseProductsList.map((p: any) => (
                                    <Option key={p._id} value={p._id}>{p.name}</Option>
                                ))}
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

                <div className="product-media" style={{ margin: '24px 0' }}>
                    <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>Media</Text>
                    <Row gutter={24}>
                        <Col span={12}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text style={{ marginBottom: 8, fontWeight: 500 }}>Policy Icon</Text>
                                <Upload {...iconUploadProps} disabled={isIconUploading} style={{ width: '100%' }}>
                                    <div style={{
                                        border: '1px dashed #d9d9d9',
                                        borderRadius: 8,
                                        padding: 20,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        background: '#fafafa',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: 140,
                                        width: '100%'
                                    }}>
                                        {isIconUploading ? (
                                            <Spin />
                                        ) : uploadedIcon ? (
                                            <>
                                                <img src={getDisplayUrl(uploadedIcon)} style={{ height: 60, objectFit: 'contain', marginBottom: 12 }} />
                                                <div style={{ fontSize: 12, color: '#666', wordBreak: 'break-all', padding: '0 8px', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {getFileName(uploadedIcon)}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: '50%', background: '#fff',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    border: '1px solid #eee', marginBottom: 12
                                                }}>
                                                    <ArrowUp size={20} color="#666" />
                                                </div>
                                                <div style={{ color: '#666' }}>Click to Upload</div>
                                            </>
                                        )}
                                    </div>
                                </Upload>
                            </div>
                        </Col>
                        <Col span={12}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text style={{ marginBottom: 8, fontWeight: 500 }}>Policy Flyer</Text>
                                <Upload {...flyerUploadProps} disabled={isFlyerUploading} style={{ width: '100%' }}>
                                    <div style={{
                                        border: '1px dashed #d9d9d9',
                                        borderRadius: 8,
                                        padding: 20,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        background: '#fafafa',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: 140,
                                        width: '100%'
                                    }}>
                                        {isFlyerUploading ? (
                                            <Spin />
                                        ) : uploadedFlyer ? (
                                            <>
                                                {uploadedFlyer.toLowerCase().includes('.pdf') ? (
                                                    <FileText size={50} color="#555" style={{ marginBottom: 12 }} />
                                                ) : (
                                                    <img src={getDisplayUrl(uploadedFlyer)} style={{ height: 60, objectFit: 'contain', marginBottom: 12 }} />
                                                )}
                                                <div style={{ fontSize: 12, color: '#666', wordBreak: 'break-all', padding: '0 8px', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {getFileName(uploadedFlyer)}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: '50%', background: '#fff',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    border: '1px solid #eee', marginBottom: 12
                                                }}>
                                                    <ArrowUp size={20} color="#666" />
                                                </div>
                                                <div style={{ color: '#666' }}>Click to Upload</div>
                                            </>
                                        )}
                                    </div>
                                </Upload>
                            </div>
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
