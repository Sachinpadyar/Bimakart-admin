// @ts-nocheck
import { useState, useEffect } from 'react';
import { Row, Col, Card, Input, InputNumber, Select, Button, Switch, Checkbox, Typography, Upload, notification } from 'antd';
import { Search, Edit, Trash2, ArrowUp, X } from 'lucide-react';
import type { UploadProps } from 'antd';
import DeleteConfirmModal from '../../ui/DeleteConfirmModal';
import './ProductListing.css';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

// Dummy data - Easy to replace with API calls later
interface Product {
    id: string;
    name: string;
    icon: string;
    isActive: boolean;
    shortDescription?: string;
    detailedDescription?: string;
    baseProduct?: string;
    sellingPrice?: string;
    costPrice?: string;
    formFields?: FormField[];
}

interface FormField {
    id: string;
    label: string;
    required: boolean;
    visible: boolean;
}

const initialProducts: Product[] = [
    { id: '1', name: 'Suraksha Policy', icon: '🛡️', isActive: true },
    { id: '2', name: 'Kartavya Policy', icon: '📄', isActive: false },
    { id: '3', name: 'Rudraksh Policy', icon: '🔒', isActive: true },
    { id: '4', name: 'Road Kavach Policy', icon: '🛡️', isActive: true },
    { id: '5', name: 'Sanjeevani Policy', icon: '💊', isActive: false },
    { id: '6', name: 'Rakshak Policy', icon: '🛡️', isActive: true },
];

const initialFormFields: FormField[] = [
    { id: 'age', label: 'Age', required: true, visible: true },
    { id: 'pan', label: 'PAN Number', required: false, visible: false },
    { id: 'vehicle', label: 'Vehicle Number', required: true, visible: true },
    { id: 'accident', label: 'Accident date', required: true, visible: true },
    { id: 'family', label: 'No. of persons in family', required: false, visible: false },
    { id: 'hospital', label: 'Hospital name', required: true, visible: true },
];

const ProductListing = () => {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [searchQuery, setSearchQuery] = useState('');
    const [formFields, setFormFields] = useState<FormField[]>(initialFormFields);
    const [formData, setFormData] = useState({
        policyName: '',
        shortDescription: '',
        detailedDescription: '',
        baseProduct: '',
        sellingPrice: '',
        costPrice: '',
    });
    const [charCount, setCharCount] = useState(0);
    const [uploadedIcon, setUploadedIcon] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const maxChars = 50;

    // Load products and icon from localStorage on mount
    useEffect(() => {
        // Load products from localStorage
        try {
            const savedProducts = localStorage.getItem('products');
            if (savedProducts) {
                const parsedProducts = JSON.parse(savedProducts);
                if (Array.isArray(parsedProducts) && parsedProducts.length > 0) {
                    setProducts(parsedProducts);
                }
            }
        } catch (error) {
            console.error('Error loading products from localStorage:', error);
        }

        // Load uploaded icon from localStorage
        const savedIcon = localStorage.getItem('productIcon');
        if (savedIcon) {
            setUploadedIcon(savedIcon);
        }
    }, []);

    // Save products to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('products', JSON.stringify(products));
        } catch (error) {
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                console.error('Storage quota exceeded. Products could not be saved.');
                notification.error({
                    message: 'Storage Error',
                    description: 'Products could not be saved due to storage limit. Please clear some data.',
                    duration: 5,
                    placement: 'topRight',
                });
            } else {
                console.error('Error saving products to localStorage:', error);
            }
        }
    }, [products]);

    // Save icon to localStorage whenever it changes
    useEffect(() => {
        if (uploadedIcon) {
            try {
            localStorage.setItem('productIcon', uploadedIcon);
            } catch (error) {
                if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                    notification.error({
                        message: 'Storage Error',
                        description: 'The image is too large to save. Please try uploading a smaller image or clear your browser storage.',
                        duration: 5,
                        placement: 'topRight',
                    });
                    // Remove the icon since it couldn't be saved
                    setUploadedIcon(null);
                } else {
                    notification.error({
                        message: 'Save Error',
                        description: 'Failed to save the image. Please try again.',
                        duration: 4,
                        placement: 'topRight',
                    });
                    console.error('Error saving icon to localStorage:', error);
                }
            }
        } else {
            localStorage.removeItem('productIcon');
        }
    }, [uploadedIcon]);

    // Filter products based on search
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle product toggle
    const handleToggleProduct = (id: string) => {
        setProducts(products.map(p =>
            p.id === id ? { ...p, isActive: !p.isActive } : p
        ));
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

    // Handle product delete
    const handleDeleteProduct = (id: string) => {
        setProductToDelete(id);
        setDeleteModalOpen(true);
    };

    // Confirm delete
    const handleConfirmDelete = () => {
        if (productToDelete) {
            const product = products.find(p => p.id === productToDelete);
            setProducts(products.filter(p => p.id !== productToDelete));
            setDeleteModalOpen(false);
            setProductToDelete(null);
            notification.success({
                message: 'Product Deleted',
                description: product ? `${product.name} has been successfully deleted.` : 'Product has been deleted.',
                duration: 3,
                placement: 'topRight',
            });
        }
    };

    // Cancel delete
    const handleCancelDelete = () => {
        setDeleteModalOpen(false);
        setProductToDelete(null);
    };

    // Handle product edit
    const handleEditProduct = (id: string) => {
        const product = products.find(p => p.id === id);
        if (product) {
            setEditingProductId(id);
            setFormData({
                policyName: product.name || '',
                shortDescription: product.shortDescription || '',
                detailedDescription: product.detailedDescription || '',
                baseProduct: product.baseProduct || '',
                sellingPrice: product.sellingPrice || '',
                costPrice: product.costPrice || '',
            });
            setCharCount(product.detailedDescription?.length || 0);
            setUploadedIcon(product.icon && product.icon.startsWith('data:') ? product.icon : null);
            if (product.formFields) {
                setFormFields(product.formFields);
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
            sellingPrice: '',
            costPrice: '',
        });
        setCharCount(0);
        setUploadedIcon(null);
        setFormFields(initialFormFields);
        setEditingProductId(null);
        localStorage.removeItem('productIcon');
    };

    // Handle add/update product
    const handleAddProduct = () => {
        // Validate required fields
        if (!formData.policyName.trim()) {
            notification.error({
                message: 'Validation Error',
                description: 'Policy Name is required.',
                duration: 4,
                placement: 'topRight',
            });
            return;
        }

        if (!formData.shortDescription.trim()) {
            notification.error({
                message: 'Validation Error',
                description: 'Short Description is required.',
                duration: 4,
                placement: 'topRight',
            });
            return;
        }

        if (!formData.detailedDescription.trim()) {
            notification.error({
                message: 'Validation Error',
                description: 'Detailed Description is required.',
                duration: 4,
                placement: 'topRight',
            });
            return;
        }

        if (!formData.baseProduct) {
            notification.error({
                message: 'Validation Error',
                description: 'Base Product is required.',
                duration: 4,
                placement: 'topRight',
            });
            return;
        }

        if (!formData.sellingPrice.trim()) {
            notification.error({
                message: 'Validation Error',
                description: 'Selling Price is required.',
                duration: 4,
                placement: 'topRight',
            });
            return;
        }

        const sellingPriceNum = Number(formData.sellingPrice);
        if (isNaN(sellingPriceNum) || sellingPriceNum <= 0) {
            notification.error({
                message: 'Validation Error',
                description: 'Please enter a valid selling price (must be a positive number).',
                duration: 4,
                placement: 'topRight',
            });
            return;
        }

        if (!formData.costPrice.trim()) {
            notification.error({
                message: 'Validation Error',
                description: 'Cost Price is required.',
                duration: 4,
                placement: 'topRight',
            });
            return;
        }

        const costPriceNum = Number(formData.costPrice);
        if (isNaN(costPriceNum) || costPriceNum <= 0) {
            notification.error({
                message: 'Validation Error',
                description: 'Please enter a valid cost price (must be a positive number).',
                duration: 4,
                placement: 'topRight',
            });
            return;
        }

        // Use uploaded icon or default emoji
        const productIcon = uploadedIcon || '📄';

        if (editingProductId) {
            // Update existing product
            setProducts(products.map(p =>
                p.id === editingProductId
                    ? {
                        ...p,
                        name: formData.policyName,
                        icon: productIcon,
                        shortDescription: formData.shortDescription,
                        detailedDescription: formData.detailedDescription,
                        baseProduct: formData.baseProduct,
                        sellingPrice: formData.sellingPrice,
                        costPrice: formData.costPrice,
                        formFields: [...formFields],
                    }
                    : p
            ));
            notification.success({
                message: 'Product Updated',
                description: `${formData.policyName} has been successfully updated.`,
                duration: 3,
                placement: 'topRight',
            });
        } else {
            // Add new product at the top of the list
            const newProduct: Product = {
                id: Date.now().toString(),
                name: formData.policyName,
                icon: productIcon,
                isActive: true,
                shortDescription: formData.shortDescription,
                detailedDescription: formData.detailedDescription,
                baseProduct: formData.baseProduct,
                sellingPrice: formData.sellingPrice,
                costPrice: formData.costPrice,
                formFields: [...formFields],
            };
            // Add new product at the beginning of the array (top of the list)
            setProducts([newProduct, ...products]);
            notification.success({
                message: 'Product Added',
                description: `${formData.policyName} has been successfully added.`,
                duration: 3,
                placement: 'topRight',
            });
        }

        // Reset form
        handleResetForm();
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

                    // Calculate new dimensions
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
                        reject(new Error('Could not get canvas context. Your browser may not support image processing.'));
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

    // Handle icon upload
    const handleIconUpload = async (file: File) => {
        // Check file type
        if (!file.type.startsWith('image/')) {
            notification.error({
                message: 'Invalid File Type',
                description: 'Please upload an image file (JPG, PNG, GIF, etc.).',
                duration: 4,
                placement: 'topRight',
            });
            return false;
        }

        // Check file size (limit to 5MB before compression)
        const maxFileSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxFileSize) {
            notification.error({
                message: 'File Too Large',
                description: `The image file is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Please upload an image smaller than 5MB.`,
                duration: 5,
                placement: 'topRight',
            });
            return false;
        }

        try {
            const compressedImage = await compressImage(file);
            setUploadedIcon(compressedImage);
            notification.success({
                message: 'Image Uploaded',
                description: 'Image has been successfully uploaded and compressed.',
                duration: 3,
                placement: 'topRight',
            });
        } catch (error) {
            console.error('Error processing image:', error);
            notification.error({
                message: 'Image Processing Error',
                description: error instanceof Error
                    ? error.message
                    : 'Failed to process the image. Please try uploading a different image or check if the file is corrupted.',
                duration: 5,
                placement: 'topRight',
            });

            // Fallback to original if compression fails
            try {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) {
                setUploadedIcon(result);
                        notification.warning({
                            message: 'Image Loaded (Uncompressed)',
                            description: 'Image was loaded without compression. It may be too large to save.',
                            duration: 4,
                            placement: 'topRight',
                        });
                    }
                };
                reader.onerror = () => {
                    notification.error({
                        message: 'File Read Error',
                        description: 'Failed to read the image file. Please try uploading again.',
                        duration: 4,
                        placement: 'topRight',
                    });
                };
        reader.readAsDataURL(file);
            } catch (fallbackError) {
                notification.error({
                    message: 'Upload Failed',
                    description: 'Unable to process the image file. Please try a different image.',
                    duration: 4,
                    placement: 'topRight',
                });
            }
        }
        return false; // Prevent default upload
    };

    // Handle icon remove
    const handleIconRemove = () => {
        setUploadedIcon(null);
    };

    // Upload props
    const uploadProps: UploadProps = {
        name: 'icon',
        listType: 'picture',
        showUploadList: false,
        beforeUpload: handleIconUpload,
        accept: 'image/*',
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
                    {/* Left Section - Add New Product Form */}
                    <Col xs={24} lg={14}>
                        <Card className="product-form-card">
                            <Title level={4} className="product-form-title">
                                {editingProductId ? 'Edit Product' : 'Add New Product'}
                            </Title>

                            <div className="product-form-content">
                                {/* Upload Icon */}
                                <div className='FlexGridSet'>
                                    <div className="product-icon-upload">
                                        <Text className="form-label">Policy Icon</Text>
                                        <Upload {...uploadProps}>
                                            <div className="icon-upload-area">
                                                <div className="icon-upload-box">
                                                    {uploadedIcon ? (
                                                        <img src={uploadedIcon} alt="Uploaded icon" className="icon-preview-large" />
                                                    ) : (
                                                        <ArrowUp size={24} />
                                                    )}
                                                </div>
                                                <Text className="icon-upload-label">Upload icon</Text>
                                            </div>
                                        </Upload>
                                        {/* Small preview below upload area */}
                                        {uploadedIcon && (
                                            <div className="icon-preview-container">
                                                <div className="icon-preview-wrapper">
                                                    <img src={uploadedIcon} alt="Icon preview" className="icon-preview-small" />
                                                    <Button
                                                        type="text"
                                                        icon={<X size={14} />}
                                                        onClick={handleIconRemove}
                                                        className="icon-remove-btn"
                                                        size="small"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Policy Name */}
                                    <div className='FlexColumnGap'>
                                        <div className="form-field">
                                            <Text className="form-label">Policy Name*</Text>
                                            <Input
                                                placeholder="Enter Policy Name..."
                                                value={formData.policyName}
                                                onChange={(e) => handleInputChange('policyName', e.target.value)}
                                                className="product-form-input"
                                            />
                                        </div>

                                        {/* Short Description */}
                                        <div className="form-field">
                                            <Text className="form-label">Short Description*</Text>
                                            <Input
                                                placeholder="Enter Short Description..."
                                                value={formData.shortDescription}
                                                onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                                                className="product-form-input"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Description */}
                                <div className="form-field">
                                    <div className="form-label-row">
                                        <Text className="form-label">Detailed Description*</Text>
                                        <Text className="char-count">{maxChars - charCount} characters remaining</Text>
                                    </div>
                                    <TextArea
                                        placeholder="Enter Detailed Description..."
                                        value={formData.detailedDescription}
                                        onChange={(e) => handleInputChange('detailedDescription', e.target.value)}
                                        rows={3}
                                        maxLength={maxChars}
                                        className="product-form-textarea"
                                    />
                                </div>

                                {/* Base Product, Selling Price, Cost Price */}
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
                                            >
                                                <Option value="health">Health Insurance</Option>
                                                <Option value="vehicle">Vehicle Insurance</Option>
                                                <Option value="life">Life Insurance</Option>
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
                                                step={0.01}
                                                formatter={(value) => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                                                parser={(value) => value ? value.replace(/\$\s?|(,*)/g, '') : ''}
                                            />
                                        </div>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <div className="form-field">
                                            <Text className="form-label">Cost Price*</Text>
                                            <InputNumber
                                                placeholder="Enter Cost Price"
                                                value={formData.costPrice ? Number(formData.costPrice) : null}
                                                onChange={(value) => handleInputChange('costPrice', value)}
                                                className="product-form-input"
                                                style={{ width: '100%' }}
                                                min={0}
                                                step={0.01}
                                                formatter={(value) => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                                                parser={(value) => value ? value.replace(/\$\s?|(,*)/g, '') : ''}
                                            />
                                        </div>
                                    </Col>
                                </Row>

                                {/* Fields Visibility Table */}
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

                                {/* Action Buttons */}
                                <div className="form-actions">
                                    <Button
                                        size="large"
                                        className="cancel-btn"
                                        onClick={handleResetForm}
                                    >
                                        {editingProductId ? 'Cancel Edit' : 'Cancel'}
                                    </Button>
                                    <Button
                                        type="primary"
                                        size="large"
                                        className="add-product-btn"
                                        onClick={handleAddProduct}
                                    >
                                        {editingProductId ? 'Update Product' : 'Add Product'}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </Col>

                    {/* Right Section - Product List */}
                    <Col xs={24} lg={10}>
                        <Card className="product-list-card">
                            {/* Search Bar */}
                            <div className="product-search">
                                <Input
                                    placeholder="Search products..."
                                    prefix={<Search size={18} />}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="product-search-input"
                                />
                            </div>

                            {/* Product List */}
                            <div className="product-list">
                                {filteredProducts.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                                        <Text>No products found. Add a new product to get started.</Text>
                                    </div>
                                ) : (
                                    filteredProducts.map((product) => (
                                    <div key={product.id} className="product-item">
                                        <div className="product-item-left">
                                                {product.icon && product.icon.startsWith('data:') ? (
                                                    <img
                                                        src={product.icon}
                                                        alt={product.name}
                                                        className="product-icon-image"
                                                    />
                                                ) : (
                                            <div className="product-icon">{product.icon}</div>
                                                )}
                                            <Text className="product-name">{product.name}</Text>
                                        </div>
                                        <div className="product-item-right">
                                            <Switch
                                                checked={product.isActive}
                                                onChange={() => handleToggleProduct(product.id)}
                                                className="product-toggle"
                                            />
                                            <Button
                                                type="text"
                                                icon={<Edit size={16} />}
                                                onClick={() => handleEditProduct(product.id)}
                                                className="product-action-btn"
                                            />
                                            <Button
                                                type="text"
                                                icon={<Trash2 size={16} />}
                                                onClick={() => handleDeleteProduct(product.id)}
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

            {/* Delete Confirmation Modal */}
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
