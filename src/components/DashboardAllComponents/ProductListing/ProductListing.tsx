// @ts-nocheck
import { useState, useEffect } from 'react';
import { Row, Col, Card, Input, InputNumber, Select, Button, Switch, Checkbox, Typography, Upload, notification, Spin, Empty } from 'antd';
import { Search, Edit, Trash2, ArrowUp, X } from 'lucide-react';
import type { UploadProps } from 'antd';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import DeleteConfirmModal from '../../ui/DeleteConfirmModal';
import './ProductListing.css';
import {
    useGetProductsQuery,
    useAddProductMutation,
    useUpdateProductMutation,
    useToggleProductStatusMutation,
    useDeleteProductMutation,
    useGetBaseProductsQuery
} from '../../../redux/api/productsApi';
import { useUploadFileMutation } from '../../../redux/api/uploadApi';
import { useGetFieldsQuery } from '../../../redux/api/fieldsApi';
import EditProductModal from './EditProductModal';
// Salesforce imports removed

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
const initialFormFields: FormField[] = [];

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
    const [deleteProduct] = useDeleteProductMutation();
    const [toggleProductStatus] = useToggleProductStatusMutation();
    const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();
    const { data: fieldsResponse } = useGetFieldsQuery(undefined);

    // Base Products Query
    const { data: baseProductsResponse, isLoading: isBaseProductsLoading } = useGetBaseProductsQuery(undefined);
    const baseProductsList = baseProductsResponse?.data || [];

    // Extract real fields from API for mapping to backend IDs

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
    const [uploadedIconKey, setUploadedIconKey] = useState<string | null>(null);
    const [uploadedFlyer, setUploadedFlyer] = useState<string | null>(null);
    const [uploadedFlyerKey, setUploadedFlyerKey] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [isIconUploading, setIsIconUploading] = useState(false);
    const [isFlyerUploading, setIsFlyerUploading] = useState(false);
    const maxChars = 50;

    useEffect(() => {
        const addTooltips = () => {
            const toolbars = document.querySelectorAll('.ql-toolbar');
            toolbars.forEach(toolbar => {
                const tooltips: Record<string, string> = {
                    '.ql-bold': 'Bold',
                    '.ql-italic': 'Italic',
                    '.ql-underline': 'Underline',
                    '.ql-list[value="ordered"]': 'Ordered List',
                    '.ql-list[value="bullet"]': 'Bullet List',
                    '.ql-link': 'Link',
                    '.ql-color': 'Text Color',
                    '.ql-background': 'Background Color',
                    '.ql-header[value="1"]': 'Heading 1',
                    '.ql-header[value="2"]': 'Heading 2',
                    '.ql-header[value="3"]': 'Heading 3',
                    '.ql-header:not([value])': 'Normal Text',
                    '.ql-clean': 'Clear Formatting',
                    '.ql-picker.ql-header': 'Select Header Size'
                };

                Object.entries(tooltips).forEach(([selector, title]) => {
                    const elements = toolbar.querySelectorAll(selector);
                    elements.forEach(el => {
                        if (!el.hasAttribute('title')) {
                            el.setAttribute('title', title);
                        }
                    });
                });
            });
        };

        const timer = setTimeout(addTooltips, 500);
        return () => clearTimeout(timer);
    }, []);


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
    // Handle form input changes
    const handleInputChange = (field: string, value: any) => {
        const processedValue = Array.isArray(value) ? value : (value === null ? '' : String(value));
        setFormData({ ...formData, [field]: processedValue });
        if (field === 'detailedDescription' && typeof processedValue === 'string') {
            setCharCount(processedValue.length);
        }
    };

    // Handle product delete (Keep UI but disable functionality as per analysis)
    const handleDeleteProduct = (id: string) => {
        setProductToDelete(id);
        setDeleteModalOpen(true);
    };

    // Confirm delete
    const handleConfirmDelete = async () => {
        if (!productToDelete) return;
        try {
            await deleteProduct(productToDelete).unwrap();
            notification.success({ message: 'Product Deleted', description: 'Product successfully deleted.' });
        } catch (error: any) {
            notification.error({ message: 'Delete Failed', description: error.data?.message || 'Failed to delete product.' });
        } finally {
            setDeleteModalOpen(false);
            setProductToDelete(null);
        }
    };

    // Cancel delete
    const handleCancelDelete = () => {
        setDeleteModalOpen(false);
        setProductToDelete(null);
    };

    // Handle product edit - Opens Modal
    const handleEditProduct = (id: string) => {
        const product = products.find((p: any) => p._id === id || p.id === id);
        if (product) {
            setEditingProduct(product);
            setEditModalOpen(true);
        }
    };

    // Handle form reset (for Add Product)
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
        setCharCount(0);
        setUploadedIcon(null);
        setUploadedIconKey(null);
        setUploadedFlyer(null);
        setUploadedFlyerKey(null);
        setUploadedFlyer(null);

        // Reset to just the dynamic fields from API since initialFormFields is empty
        const resetFields = apiFields.map((field: any) => ({
            id: field._id || field.id,
            label: field.fieldName || field.label,
            required: false,
            visible: true
        }));
        setFormFields(resetFields);
    };

    // Handle add/update product
    const handleAddProduct = async () => {
        // Validate required fields
        if (!formData.policyName.trim()) return showValidationMsg('Policy Name is required.');
        if (!formData.shortDescription.trim()) return showValidationMsg('Short Description is required.');
        // Detailed Description is now optional
        // if (!formData.detailedDescription.trim()) return showValidationMsg('Detailed Description is required.');

        if (!formData.baseProduct || (Array.isArray(formData.baseProduct) && formData.baseProduct.length === 0))
            return showValidationMsg('Base Product is required.');

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
            policyIcon: uploadedIconKey || uploadedIcon || '',
            policyFlyer: uploadedFlyerKey || uploadedFlyer || '',
            // Map display fields to real API field IDs
            fields: formFields
                .filter(f => f.visible)
                .map(f => {
                    // Find matching field from API by label or ID
                    const apiField = apiFields.find((af: any) =>
                        (af.fieldName || af.label)?.toLowerCase() === f.label.toLowerCase() ||
                        (af._id || af.id) === f.id
                    );

                    // Use real API ID if found, otherwise fall back to the local ID (e.g. 'age', 'pan')
                    const finalId = (apiField && (apiField._id || apiField.id))
                        ? (apiField._id || apiField.id)
                        : f.id;

                    return {
                        fieldId: finalId,
                        required: f.required,
                        visible: f.visible
                    };
                })
        };

        try {
            // Legacy: edit moved to modal
            await addProduct(productPayload).unwrap();
            notification.success({ message: 'Product Added', description: 'Product added successfully.' });
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

            // Handle new response format: { data: { key, previewUrl } }
            const uploadedKey = response?.data?.key;
            const previewUrl = response?.data?.previewUrl || response?.url || response?.data?.url;

            if (previewUrl) {
                setUploadedIcon(previewUrl);
                if (uploadedKey) setUploadedIconKey(uploadedKey);
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

    const handleIconRemove = () => {
        setUploadedIcon(null);
        setUploadedIconKey(null);
    };

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

            // Handle new response format: { data: { key, previewUrl } }
            const uploadedKey = response?.data?.key;
            const previewUrl = response?.data?.previewUrl || response?.url || response?.data?.url;

            if (previewUrl) {
                setUploadedFlyer(previewUrl);
                if (uploadedKey) setUploadedFlyerKey(uploadedKey);
                notification.success({ message: 'Upload Successful', description: 'Flyer uploaded successfully.' });
            } else {
                throw new Error('No URL returned from upload');
            }
        } catch (error: any) {
            console.error(error);
            notification.error({
                message: 'Upload Failed',
                description: error.data?.message || 'Failed to upload flyer.',
            });
        } finally {
            setIsFlyerUploading(false);
        }
        return false;
    };

    const handleFlyerRemove = () => {
        setUploadedFlyer(null);
        setUploadedFlyerKey(null);
    };


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
                                Add New Product
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
                                    <Text className="form-label">Detailed Description</Text>
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

                                {/* Base Product, Message Template, Selling Price */}
                                <Row gutter={12}>
                                    <Col xs={24} sm={8}>
                                        <div className="form-field">
                                            <Text className="form-label">Base Product*</Text>
                                            <Select
                                                mode="multiple"
                                                placeholder="Select a category"
                                                value={formData.baseProduct || []}
                                                onChange={(value) => handleInputChange('baseProduct', value)}
                                                loading={isBaseProductsLoading}
                                                className="product-form-select"
                                                style={{ width: '100%' }}
                                                suffixIcon={<ArrowUp size={14} className="rotate-180" />}
                                                maxTagCount="responsive"
                                            >
                                                {baseProductsList.map((p: any) => (
                                                    <Option key={p._id} value={p._id}>{p.name}</Option>
                                                ))}
                                            </Select>
                                        </div>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <div className="form-field">
                                            <Text className="form-label">Message Template</Text>
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
                                        Cancel
                                    </Button>
                                    <Button
                                        type="primary"
                                        size="large"
                                        className="add-product-btn"
                                        onClick={handleAddProduct}
                                        loading={isAdding || isUpdating || isUploading || isIconUploading || isFlyerUploading}
                                        disabled={isAdding || isUpdating || isUploading || isIconUploading || isFlyerUploading}
                                    >
                                        Add Product
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
                                                    // <div className="product-icon">{product.policyIcon || '🛡️'}</div>
                                                    <></>
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
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                itemName={products.find((p: any) => p._id === productToDelete || p.id === productToDelete)?.name || 'product'}
            />

            <EditProductModal
                open={editModalOpen}
                onCancel={() => {
                    setEditModalOpen(false);
                    setEditingProduct(null);
                }}
                product={editingProduct}
            />
        </div>
    );
};

export default ProductListing;
