// @ts-nocheck
import { useState, useEffect } from 'react';
import { Row, Col, Card, Input, InputNumber, Select, Button, Switch, Checkbox, Typography, Upload, notification, Spin, Empty } from 'antd';
import { Search, Edit, Trash2, ArrowUp, X } from 'lucide-react';
import type { UploadProps } from 'antd';
import DeleteConfirmModal from '../../ui/DeleteConfirmModal';
import './ProductListing.css';
import {
    useGetProductsQuery,
    useAddProductMutation,
    useUpdateProductMutation,
    useToggleProductStatusMutation
} from '../../../redux/api/productsApi';
import { useUploadFileMutation } from '../../../redux/api/uploadApi';
import { useGetFieldsQuery } from '../../../redux/api/fieldsApi';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;


interface FormField {
    id: string;
    label: string;
    required: boolean;
    visible: boolean;
}

// Default fields that always show in the form
const initialFormFields: FormField[] = [
    { id: 'age', label: 'Age', required: true, visible: true },
    { id: 'pan', label: 'PAN Number', required: false, visible: false },
    { id: 'vehicle', label: 'Vehicle Number', required: true, visible: true },
    { id: 'accident', label: 'Accident date', required: true, visible: true },
    { id: 'family', label: 'No. of persons in family', required: false, visible: false },
    { id: 'hospital', label: 'Hospital name', required: true, visible: true },
];

const ProductListing = () => {
    // API Queries and Mutations
    const { data: productsResponse, isLoading: isProductsLoading } = useGetProductsQuery(undefined, {
        pollingInterval: 0,
        refetchOnMountOrArgChange: true
    });

    // Helper to safely extract products array
    const productsData = productsResponse?.data || [];
    // If response is just the array (unlikely given user pattern, but handling logic)
    const products = Array.isArray(productsResponse) ? productsResponse : productsData;

    const [addProduct, { isLoading: isAdding }] = useAddProductMutation();
    const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
    const [toggleProductStatus] = useToggleProductStatusMutation();
    const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();
    const { data: fieldsResponse } = useGetFieldsQuery(undefined);

    // Extract real fields from API for mapping to backend IDs
    const apiFields = fieldsResponse?.data || [];

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [formFields, setFormFields] = useState<FormField[]>(initialFormFields);

    // Merge default fields with dynamic fields from API
    useEffect(() => {
        if (apiFields.length > 0) {
            // Map API fields to FormField structure
            const dynamicFields: FormField[] = apiFields.map((field: any) => ({
                id: field._id || field.id,
                label: field.fieldName || field.label, // API uses fieldName
                required: false,
                visible: true // Default to visible for new fields
            }));

            // Filter out any dynamic fields that might duplicate default fields by label (case-insensitive)
            const uniqueDynamicFields = dynamicFields.filter(df =>
                !initialFormFields.some(initF => initF.label.toLowerCase() === df.label.toLowerCase())
            );

            // Combine default fields + unique dynamic fields
            // Preserve existing state (checkbox/switch values) if we are editing or have toggled things
            setFormFields(prevFields => {
                // We want to keep the current state of any fields that are already in prevFields
                // But we also want to add any NEW fields from API that aren't there yet

                const combined = [...initialFormFields, ...uniqueDynamicFields];

                return combined.map(field => {
                    const existing = prevFields.find(p => p.id === field.id || p.label.toLowerCase() === field.label.toLowerCase());
                    return existing ? existing : field;
                });
            });
        }
    }, [apiFields]);
    const [formData, setFormData] = useState({
        policyName: '',
        shortDescription: '',
        detailedDescription: '',
        baseProduct: '',
        messageTemplate: '',
        sellingPrice: '',
    });
    const [charCount, setCharCount] = useState(0);
    const [uploadedIcon, setUploadedIcon] = useState<string | null>(null);
    const [uploadedFlyer, setUploadedFlyer] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [isIconUploading, setIsIconUploading] = useState(false);
    const [isFlyerUploading, setIsFlyerUploading] = useState(false);
    const maxChars = 50;


    // Filter products based on search
    const filteredProducts = products.filter((product: any) =>
        product.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle product toggle
    const handleToggleProduct = async (id: string) => {
        try {
            await toggleProductStatus(id).unwrap();
            notification.success({
                message: 'Status Updated',
                description: 'Product status has been updated successfully.',
                placement: 'topRight',
            });
        } catch (error: any) {
            notification.error({
                message: 'Error',
                description: error.data?.message || 'Failed to update status',
                placement: 'topRight',
            });
        }
    };

    // Handle field checkbox change
    const handleFieldRequiredChange = (id: string) => {
        setFormFields(formFields.map(field =>
            field.id === id ? { ...field, required: !field.required } : field
        ));
    };

    // Handle field visibility toggle
    const handleFieldVisibleChange = (id: string) => {
        setFormFields(formFields.map(field =>
            field.id === id ? { ...field, visible: !field.visible } : field
        ));
    };

    // Handle form input changes
    const handleInputChange = (field: string, value: string | number | null) => {
        const stringValue = value === null ? '' : String(value);
        setFormData({ ...formData, [field]: stringValue });
        if (field === 'detailedDescription') {
            setCharCount(stringValue.length);
        }
    };

    // Handle product delete (Keep UI but disable functionality as per analysis)
    const handleDeleteProduct = (id: string) => {
        setProductToDelete(id);
        setDeleteModalOpen(true);
    };

    // Confirm delete
    const handleConfirmDelete = () => {
        // Not implemented on API side yet
        setDeleteModalOpen(false);
        setProductToDelete(null);
        notification.info({
            message: 'feature not available',
            description: 'Delete functionality is currently disabled.',
        });
    };

    // Cancel delete
    const handleCancelDelete = () => {
        setDeleteModalOpen(false);
        setProductToDelete(null);
    };

    // Handle product edit
    const handleEditProduct = (id: string) => {
        const product = products.find((p: any) => p._id === id || p.id === id);
        if (product) {
            setEditingProductId(product._id || product.id);
            setFormData({
                policyName: product.name || '',
                shortDescription: product.shortDescription || '',
                detailedDescription: product.detailedDescription || '',
                baseProduct: product.baseProduct || '',
                messageTemplate: product.messageTemplateId || '',
                sellingPrice: product.sellingPrice ? String(product.sellingPrice) : '',
            });
            setCharCount(product.detailedDescription?.length || 0);
            setUploadedIcon(product.policyIcon || null);
            setUploadedFlyer(product.policyFlyer || null);

            // However, if we saved 'age', 'pan' etc. to the backend previously, we should attempt to restore their state.
            if (product.fields && Array.isArray(product.fields)) {
                const mergedFields = initialFormFields.map(initialField => {
                    const savedField = product.fields.find((pf: any) => {
                        const pfId = typeof pf.fieldId === 'object' ? (pf.fieldId._id || pf.fieldId.id) : pf.fieldId;
                        return pfId === initialField.id;
                    });

                    if (savedField) {
                        return {
                            ...initialField,
                            required: savedField.required,
                            visible: savedField.visible
                        };
                    }
                    return initialField;
                });
                setFormFields(mergedFields);
            } else {
                setFormFields(initialFormFields);
            }

            // Scroll to form
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Handle form reset
    const handleResetForm = () => {
        setFormData({
            policyName: '',
            shortDescription: '',
            detailedDescription: '',
            baseProduct: '',
            messageTemplate: '',
            sellingPrice: '',
        });
        setCharCount(0);
        setUploadedIcon(null);
        setUploadedFlyer(null);
        // Reset to initial fields + any loaded dynamic fields
        // We can trigger a re-sync with API data
        setFormFields(initialFormFields);
        // Force update from API effect will handle re-adding dynamic ones on next render or check
        setEditingProductId(null);
    };

    // Handle add/update product
    const handleAddProduct = async () => {
        // Validate required fields
        if (!formData.policyName.trim()) return showValidationMsg('Policy Name is required.');
        if (!formData.shortDescription.trim()) return showValidationMsg('Short Description is required.');
        if (!formData.detailedDescription.trim()) return showValidationMsg('Detailed Description is required.');
        if (!formData.baseProduct) return showValidationMsg('Base Product is required.');
        // Message Template validation removed - field is on hold
        if (!formData.sellingPrice.trim()) return showValidationMsg('Selling Price is required.');

        const sellingPriceNum = Number(formData.sellingPrice);
        if (isNaN(sellingPriceNum) || sellingPriceNum < 0) return showValidationMsg('Invalid selling price.');

        const productPayload = {
            name: formData.policyName,
            shortDescription: formData.shortDescription,
            detailedDescription: formData.detailedDescription,
            baseProduct: formData.baseProduct,
            // messageTemplateId removed - not sent in request body (on hold)
            sellingPrice: sellingPriceNum,
            policyIcon: uploadedIcon || '',
            policyFlyer: uploadedFlyer || '',
            // Map display fields to real API field IDs
            fields: formFields
                .filter(f => f.visible)
                .map(f => {
                    // Find matching field from API by label or ID
                    const apiField = apiFields.find((af: any) =>
                        (af.fieldName || af.label)?.toLowerCase() === f.label.toLowerCase() ||
                        (af._id || af.id) === f.id
                    );

                    // Only return if we have a real API field ID
                    if (apiField && (apiField._id || apiField.id)) {
                        return {
                            fieldId: apiField._id || apiField.id,
                            required: f.required,
                            visible: f.visible
                        };
                    }

                    // If no matching real field found, check if the current ID is already a valid MongoDB ID (24 hex chars)
                    // This handles dynamic fields that might be fully persisted in state with their ID
                    const isMongoId = /^[0-9a-fA-F]{24}$/.test(f.id);
                    if (isMongoId) {
                        return {
                            fieldId: f.id,
                            required: f.required,
                            visible: f.visible
                        };
                    }

                    // If it's a dummy field (like 'age') and no real field maps to it, we exclude it from the payload
                    // to avoid "Invalid field ID" errors from backend.
                    return null;
                })
                .filter(Boolean) // Remove nulls to ensure no fieldId: null is sent
        };

        try {
            if (editingProductId) {
                await updateProduct({ id: editingProductId, ...productPayload }).unwrap();
                notification.success({ message: 'Product Updated', description: 'Product updated successfully.' });
            } else {
                await addProduct(productPayload).unwrap();
                notification.success({ message: 'Product Added', description: 'Product added successfully.' });
            }
            handleResetForm();
        } catch (error: any) {
            notification.error({
                message: 'Error',
                description: error.data?.message || 'Operation failed.',
            });
        }
    };

    const showValidationMsg = (msg: string) => {
        notification.error({ message: 'Validation Error', description: msg, duration: 4 });
    };

    // Compress image to reduce size
    const compressImage = (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = (width * maxHeight) / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Could not get canvas context.'));
                        return;
                    }

                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedDataUrl);
                };
                img.onerror = reject;
                img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // Handle icon upload - using /api/upload endpoint
    const handleIconUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            showValidationMsg('Please upload an image file.');
            return false;
        }
        setIsIconUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('region', 'ap-south-1'); // AWS region for file upload

            const response = await uploadFile(formData).unwrap();

            // Assuming the API returns { url: 'uploaded-file-url' } or { data: { url: '...' } }
            const uploadedUrl = response?.url || response?.data?.url || response?.fileUrl;

            if (uploadedUrl) {
                setUploadedIcon(uploadedUrl);
                notification.success({ message: 'Upload Successful', description: 'Icon uploaded successfully.' });
            } else {
                throw new Error('No URL returned from upload');
            }
        } catch (error: any) {
            console.error(error);
            notification.error({
                message: 'Upload Failed',
                description: error.data?.message || 'Failed to upload icon.',
            });
        } finally {
            setIsIconUploading(false);
        }
        return false;
    };

    const handleIconRemove = () => setUploadedIcon(null);

    // Handle flyer upload
    const handleFlyerUpload = async (file: File) => {
        // Allow image or PDF
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            showValidationMsg('Upload image or PDF.');
            return false;
        }

        setIsFlyerUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('region', 'ap-south-1'); // AWS region for file upload

            const response = await uploadFile(formData).unwrap();

            // Assuming the API returns { url: 'uploaded-file-url' } or { data: { url: '...' } }
            const uploadedUrl = response?.url || response?.data?.url || response?.fileUrl;

            if (uploadedUrl) {
                setUploadedFlyer(uploadedUrl);
                notification.success({ message: 'Upload Successful', description: 'Flyer uploaded successfully.' });
            } else {
                throw new Error('No URL returned from upload');
            }
        } catch (error: any) {
            console.error(error);
            notification.error({
                message: 'Upload Failed',
                description: error.data?.message || 'Failed to upload flyer.',
            }); why
        } finally {
            setIsFlyerUploading(false);
        }
        return false;
    };

    const handleFlyerRemove = () => setUploadedFlyer(null);


    const iconUploadProps: UploadProps = {
        name: 'icon',
        listType: 'picture',
        showUploadList: false,
        beforeUpload: handleIconUpload,
        accept: 'image/*',
    };

    const flyerUploadProps: UploadProps = {
        name: 'flyer',
        listType: 'picture',
        showUploadList: false,
        beforeUpload: handleFlyerUpload,
        accept: 'image/*,.pdf',
    };

    return (
        <div className="product-listing-wrapper MainComponentWrapper">
            <div>
                <div className="product-listing-header">
                    <div>
                        <div className='SectionMainHeading'>Product Listing</div>
                        <Text className="product-listing-subtitle">Manage your active insurance products</Text>
                    </div>
                </div>

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={14}>
                        <Card className="product-form-card">
                            <Title level={4} className="product-form-title">
                                {editingProductId ? 'Edit Product' : 'Add New Product'}
                            </Title>

                            <div className="product-form-content">
                                {/* Media Row */}
                                <div className="product-media-row">
                                    <div className="product-icon-upload">
                                        <Text className="form-label">Policy Icon</Text>
                                        <Upload {...iconUploadProps} disabled={isIconUploading}>
                                            <div className="icon-upload-area" style={{ opacity: isIconUploading ? 0.6 : 1 }}>
                                                <Spin spinning={isIconUploading} tip="Uploading...">
                                                    <div className="icon-upload-box">
                                                        {uploadedIcon ? (
                                                            <img src={uploadedIcon} alt="Uploaded icon" className="icon-preview-large" />
                                                        ) : (
                                                            <ArrowUp size={24} />
                                                        )}
                                                    </div>
                                                </Spin>
                                                <Text className="icon-upload-label">Upload icon</Text>
                                                <Text className="icon-upload-hint">jpg or png</Text>
                                            </div>
                                        </Upload>
                                        {uploadedIcon && !isIconUploading && (
                                            <div className="icon-preview-container">
                                                <div className="icon-preview-wrapper active-preview">
                                                    <img src={uploadedIcon} alt="Icon preview" className="icon-preview-small" />
                                                    <Button type="text" icon={<X size={14} />} onClick={handleIconRemove} className="icon-remove-btn" size="small" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="product-flyer-upload">
                                        <Text className="form-label">Policy Flyer</Text>
                                        <Upload {...flyerUploadProps} disabled={isFlyerUploading}>
                                            <div className="icon-upload-area" style={{ opacity: isFlyerUploading ? 0.6 : 1 }}>
                                                <Spin spinning={isFlyerUploading} tip="Processing...">
                                                    <div className="icon-upload-box">
                                                        {uploadedFlyer ? (
                                                            uploadedFlyer.startsWith('data:application/pdf') ? <div className="pdf-preview-icon">PDF</div> : <img src={uploadedFlyer} alt="Uploaded flyer" className="icon-preview-large" />
                                                        ) : (
                                                            <ArrowUp size={24} />
                                                        )}
                                                    </div>
                                                </Spin>
                                                <Text className="icon-upload-label">Upload flyer</Text>
                                                <Text className="icon-upload-hint">jpg, png or pdf</Text>
                                            </div>
                                        </Upload>
                                        {uploadedFlyer && !isFlyerUploading && (
                                            <div className="icon-preview-container">
                                                <div className="icon-preview-wrapper active-preview">
                                                    {uploadedFlyer.startsWith('data:application/pdf') ? <div className="pdf-preview-small">PDF</div> : <img src={uploadedFlyer} alt="Flyer preview" className="icon-preview-small" />}
                                                    <Button type="text" icon={<X size={14} />} onClick={handleFlyerRemove} className="icon-remove-btn" size="small" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="product-basic-info">
                                        <div className="form-field">
                                            <Text className="form-label">Policy Name*</Text>
                                            <Input
                                                placeholder="Enter Policy Name..."
                                                value={formData.policyName}
                                                onChange={(e) => handleInputChange('policyName', e.target.value)}
                                                className="product-form-input"
                                            />
                                        </div>
                                        <div className="form-field">
                                            <Text className="form-label">Short Description*</Text>
                                            <Input
                                                placeholder="Enter Short Description..."
                                                value={formData.shortDescription}
                                                onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                                                className="product-form-input"
                                                maxLength={50}
                                            />
                                            <div style={{ textAlign: 'right' }}>
                                                <Text className="char-count">{50 - (formData.shortDescription?.length || 0)} characters remaining</Text>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Description */}
                                <div className="form-field">
                                    <Text className="form-label">Detailed Description*</Text>
                                    <TextArea
                                        placeholder="Enter Detailed Description..."
                                        value={formData.detailedDescription}
                                        onChange={(e) => handleInputChange('detailedDescription', e.target.value)}
                                        rows={3}
                                        className="product-form-textarea"
                                    />
                                </div>

                                {/* Base Product, Message Template, Selling Price */}
                                <Row gutter={12}>
                                    <Col xs={24} sm={8}>
                                        <div className="form-field">
                                            <Text className="form-label">Base Product*</Text>
                                            <Select
                                                placeholder="Select a category"
                                                value={formData.baseProduct || undefined}
                                                onChange={(value) => handleInputChange('baseProduct', value)}
                                                className="product-form-select"
                                                style={{ width: '100%' }}
                                                suffixIcon={<ArrowUp size={14} className="rotate-180" />}
                                            >
                                                <Option value="health">Health Insurance</Option>
                                                <Option value="vehicle">Vehicle Insurance</Option>
                                                <Option value="life">Life Insurance</Option>
                                            </Select>
                                        </div>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <div className="form-field">
                                            <Text className="form-label">Message Template*</Text>
                                            <Select
                                                placeholder="Select a template"
                                                value={formData.messageTemplate || undefined}
                                                onChange={(value) => handleInputChange('messageTemplate', value)}
                                                className="product-form-select"
                                                style={{ width: '100%' }}
                                                suffixIcon={<ArrowUp size={14} className="rotate-180" />}
                                            >
                                                <Option value="template1">Template 1</Option>
                                                <Option value="template2">Template 2</Option>
                                            </Select>
                                        </div>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <div className="form-field">
                                            <Text className="form-label">Selling Price*</Text>
                                            <InputNumber
                                                placeholder="Enter Selling Price"
                                                value={formData.sellingPrice ? Number(formData.sellingPrice) : null}
                                                onChange={(value) => handleInputChange('sellingPrice', value)}
                                                className="product-form-input"
                                                style={{ width: '100%' }}
                                                min={0}
                                                formatter={(value) => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                                                parser={(value) => value ? value.replace(/\$\s?|(,*)/g, '') : ''}
                                            />
                                        </div>
                                    </Col>
                                </Row>

                                {/* Fields Table */}
                                <div className="form-field">
                                    <Text className="form-label">Select which fields should be visible on the website:</Text>
                                    <div className="fields-table">
                                        <div className="fields-table-header">
                                            <div className="fields-table-col">Required</div>
                                            <div className="fields-table-col">Visible</div>
                                        </div>
                                        {formFields.map((field) => (
                                            <div key={field.id} className="fields-table-row">
                                                <div className="fields-table-col">
                                                    <Checkbox
                                                        checked={field.required}
                                                        onChange={() => handleFieldRequiredChange(field.id)}
                                                    >
                                                        {field.label}
                                                    </Checkbox>
                                                </div>
                                                <div className="fields-table-col">
                                                    <Switch
                                                        checked={field.visible}
                                                        onChange={() => handleFieldVisibleChange(field.id)}
                                                        className="field-visibility-switch"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="form-actions">
                                    <Button size="large" className="cancel-btn" onClick={handleResetForm}>
                                        {editingProductId ? 'Cancel Edit' : 'Cancel'}
                                    </Button>
                                    <Button
                                        type="primary"
                                        size="large"
                                        className="add-product-btn"
                                        onClick={handleAddProduct}
                                        loading={isAdding || isUpdating || isUploading || isIconUploading || isFlyerUploading}
                                        disabled={isAdding || isUpdating || isUploading || isIconUploading || isFlyerUploading}
                                    >
                                        {editingProductId ? 'Update Product' : 'Add Product'}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} lg={10}>
                        <Card className="product-list-card">
                            <div className="product-search">
                                <Input
                                    placeholder="Search products..."
                                    prefix={<Search size={18} />}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="product-search-input"
                                />
                            </div>

                            <div className="product-list">
                                {isProductsLoading ? (
                                    <div style={{ textAlign: 'center', padding: '40px' }}><Spin size="large" /></div>
                                ) : filteredProducts.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                                        <Text>No products found. Add a new product to get started.</Text>
                                    </div>
                                ) : (
                                    filteredProducts.map((product: any) => (
                                        <div key={product._id || product.id} className="product-item">
                                            <div className="product-item-left">
                                                {product.policyIcon && product.policyIcon.startsWith('data:') ? (
                                                    <img src={product.policyIcon} alt={product.name} className="product-icon-image" />
                                                ) : (
                                                    <div className="product-icon">{product.policyIcon || '🛡️'}</div>
                                                )}
                                                <Text className="product-name">{product.name}</Text>
                                            </div>
                                            <div className="product-item-right">
                                                <Switch
                                                    checked={product.isActive}
                                                    onChange={() => handleToggleProduct(product._id || product.id)}
                                                    className="product-toggle"
                                                />
                                                <Button
                                                    type="text"
                                                    icon={<Edit size={16} />}
                                                    onClick={() => handleEditProduct(product._id || product.id)}
                                                    className="product-action-btn"
                                                />
                                                <Button
                                                    type="text"
                                                    icon={<Trash2 size={16} />}
                                                    onClick={() => handleDeleteProduct(product._id || product.id)}
                                                    className="product-action-btn delete-btn"
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>

            <DeleteConfirmModal
                open={deleteModalOpen}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Are you sure you want to delete this product?"
                message="This action cannot be undone. Once deleted, the product will be permanently removed."
            />
        </div>
    );
};

export default ProductListing;
