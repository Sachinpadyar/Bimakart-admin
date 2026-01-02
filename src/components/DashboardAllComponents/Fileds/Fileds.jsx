import React, { useState } from "react";
import { Card, Input, Select, Button, Table, Typography, Space, Row, Col, message } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import DeleteConfirmModal from "../../ui/DeleteConfirmModal";
import "./Fileds.css";

const { Title, Text } = Typography;
const { Option } = Select;

const Fileds = () => {
    // Mock data for the table
    const [dataSource, setDataSource] = useState([
        { key: '1', fieldName: 'Full Name', dataType: 'Text' },
        { key: '2', fieldName: 'Number of People', dataType: 'Dropdown' },
        { key: '3', fieldName: 'Type of Coverage', dataType: 'Dropdown' },
        { key: '4', fieldName: 'Payment Option', dataType: 'Radio Button' },
        { key: '5', fieldName: 'Email', dataType: 'Text' },
        { key: '6', fieldName: 'Sum insured', dataType: 'Checkbox' },
    ]);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedField, setSelectedField] = useState(null);

    const handleDelete = (record) => {
        setSelectedField(record);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (selectedField) {
            setDataSource(dataSource.filter(item => item.key !== selectedField.key));
            message.success('Field deleted successfully');
            setIsDeleteModalOpen(false);
            setSelectedField(null);
        }
    };

    const columns = [
        {
            title: 'Field Name',
            dataIndex: 'fieldName',
            key: 'fieldName',
        },
        {
            title: 'Data Type',
            dataIndex: 'dataType',
            key: 'dataType',
        },
        {
            key: 'action',
            width: 100,
            align: 'right',
            render: (_, record) => (
                <Space size="middle">
                    <EditOutlined className="action-btn" />
                    <DeleteOutlined
                        className="action-btn delete"
                        onClick={() => handleDelete(record)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div className="fields-page-container MainComponentWrapper">
            <div className="fields-page-header">
                <div className='SectionMainHeading'>Manage Contact Form Fields</div>
                <Text className="fields-page-subtitle">Add and manage custom fields for your contact form</Text>
            </div>

            <div className="MaxWidthContainer">
                <Space direction="vertical" size={24} style={{ width: '100%' }}>
                    {/* Add New Field Section */}
                    <Card className="custom-card" title={<span style={{ fontSize: '16px', fontWeight: 500 }}>Add New Field</span>} bordered={false}>
                        <Row gutter={[24, 24]}>
                            <Col xs={24} md={12}>
                                <label className="field-label">Field Name<span className="required">*</span></label>
                                <Input placeholder="Enter Field Name..." size="large" style={{ borderRadius: '6px' }} />
                            </Col>
                            <Col xs={24} md={12}>
                                <label className="field-label">Data Type<span className="required">*</span></label>
                                <Select
                                    placeholder="Select Data Type"
                                    size="large"
                                    style={{ width: '100%', borderRadius: '6px' }}
                                >
                                    <Option value="text">Text</Option>
                                    <Option value="dropdown">Dropdown</Option>
                                    <Option value="radio">Radio Button</Option>
                                    <Option value="checkbox">Checkbox</Option>
                                    <Option value="email">Email</Option>
                                    <Option value="number">Number</Option>
                                </Select>
                            </Col>
                            <Col span={24} style={{ textAlign: 'right', marginTop: '8px' }}>
                                <Button type="primary" size="large" className="add-field-btn">
                                    Add Field
                                </Button>
                            </Col>
                        </Row>
                    </Card>

                    {/* Existing Fields Section */}
                    <Card className="custom-card" title={<span style={{ fontSize: '16px', fontWeight: 500 }}>Existing Fields</span>} bordered={false}>
                        <Table
                            columns={columns}
                            dataSource={dataSource}
                            pagination={false}
                            className="custom-table"
                            rowClassName={() => 'editable-row'}
                        />
                    </Card>
                </Space>
            </div>

            <DeleteConfirmModal
                open={isDeleteModalOpen}
                onCancel={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Field"
                message={`Are you sure you want to delete the field "${selectedField?.fieldName}"? This action cannot be undone.`}
            />
        </div>
    );
}

export default Fileds;
