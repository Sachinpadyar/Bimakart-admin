import React, { useState } from "react";
import {
    useCreateFieldMutation,
    useGetFieldsQuery,
    useDeleteFieldMutation,
    useUpdateFieldMutation,
} from "../../../redux/api/fieldsApi";
import {
    Card,
    Input,
    Select,
    Button,
    Table,
    Typography,
    Space,
    Row,
    Col,
    message,
    Modal,
    Radio,
} from "antd";
import { EditOutlined, DeleteOutlined, CloseOutlined } from "@ant-design/icons";
import DeleteConfirmModal from "../../ui/DeleteConfirmModal";
import "./Fileds.css";

const { Text } = Typography;
const { Option } = Select;

const Fileds = () => {
    // State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedField, setSelectedField] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Radio states
    const [radioValue, setRadioValue] = useState(null); // "Yes" | "No"
    const [radioOptionalValue, setRadioOptionalValue] = useState(""); // value to store in DB

    // Form State
    const [fieldName, setFieldName] = useState("");
    const [selectedDataType, setSelectedDataType] = useState(null);
    const [options, setOptions] = useState(["Option 1"]);
    const [placeholder, setPlaceholder] = useState(""); // used as label for radio optional input

    // Queries & Mutations
    const [createField, { isLoading: isCreating }] = useCreateFieldMutation();
    const [updateField, { isLoading: isUpdating }] = useUpdateFieldMutation();
    const [deleteField] = useDeleteFieldMutation();
    const { data: fieldsData, isLoading: isFieldsLoading } = useGetFieldsQuery();

    // --- Options Logic ---
    const handleDataTypeChange = (value) => {
        setSelectedDataType(value);

        if (value === "radio") {
            setOptions(["Yes", "No"]); // only for UI
        } else if (["dropdown", "checkbox", "text"].includes(value)) {
            setOptions(["Option 1"]);
        } else {
            setOptions([]);
        }

        // reset extra fields
        setPlaceholder("");
        setRadioValue(null);
        setRadioOptionalValue("");
    };

    const handleAddOption = () => {
        setOptions([...options, `Option ${options.length + 1}`]);
    };

    const handleRemoveOption = (index) => {
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    // --- Action Handlers ---
    const handleEdit = (record) => {
        setEditingId(record._id || record.id || record.key);
        setFieldName(record.fieldName);
        setSelectedDataType(record.dataType);

        if (["dropdown", "checkbox", "text"].includes(record.dataType)) {
            if (Array.isArray(record.options) && record.options.length > 0) {
                setOptions(record.options);
            } else {
                setOptions(["Option 1"]);
            }
            setRadioValue(null);
            setRadioOptionalValue("");
        } else if (record.dataType === "radio") {
            // DB stores: ["Yes"] OR ["Yes","some text"]
            setRadioValue(record.options?.[0] || null);
            setRadioOptionalValue(record.options?.[1] || "");
            setOptions(["Yes", "No"]); // UI fixed
        } else {
            setOptions([]);
            setRadioValue(null);
            setRadioOptionalValue("");
        }

        setPlaceholder(record.placeholder || "");
        setIsEditModalOpen(true);
    };

    const handleCancelEdit = () => {
        setIsEditModalOpen(false);
        setEditingId(null);
        resetForm();
    };

    const resetForm = () => {
        setFieldName("");
        setSelectedDataType(null);
        setOptions(["Option 1"]);
        setPlaceholder("");
        setRadioValue(null);
        setRadioOptionalValue("");
    };

    const handleDelete = (record) => {
        setSelectedField(record);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedField) {
            try {
                const idToDelete = selectedField._id || selectedField.id || selectedField.key;
                await deleteField(idToDelete).unwrap();
                message.success("Field deleted successfully");
                setIsDeleteModalOpen(false);
                setSelectedField(null);
            } catch (error) {
                message.error("Failed to delete field");
                console.error("Delete error:", error);
            }
        }
    };

    // --- Submit Handlers ---
    const getPayload = () => {
        const trimmedPlaceholder = placeholder?.trim();
        return {
            fieldName,
            dataType: selectedDataType,

            // ✅ radio stores only selected + optional value
            options:
                selectedDataType === "radio"
                    ? [
                        radioValue,
                        ...(trimmedPlaceholder ? [trimmedPlaceholder] : []),
                    ]
                    : ["dropdown", "checkbox", "text"].includes(selectedDataType)
                        ? options.filter((opt) => opt.trim() !== "")
                        : undefined,

            // ✅ for radio, DO NOT send placeholder separately
            placeholder:
                selectedDataType === "radio"
                    ? undefined
                    : ["email", "number"].includes(selectedDataType)
                        ? placeholder
                        : undefined,
        };
    };

    const handleCreate = async () => {
        if (!fieldName || !selectedDataType) {
            message.error("Please fill in all required fields");
            return;
        }
        if (selectedDataType === "radio" && !placeholder.trim()) {
            message.error("Please enter text for radio");
            return;
        }


        try {
            await createField(getPayload()).unwrap();
            message.success("Field created successfully");
            resetForm();
        } catch (error) {
            message.error(
                "Failed to create field: " + (error?.data?.message || error.message)
            );
        }
    };

    const handleUpdate = async () => {
        if (!fieldName || !selectedDataType) {
            message.error("Please fill in all required fields");
            return;
        }
        if (selectedDataType === "radio" && !radioValue) {
            message.error("Please select Yes or No");
            return;
        }

        try {
            await updateField({ id: editingId, ...getPayload() }).unwrap();
            message.success("Field updated successfully");
            handleCancelEdit();
        } catch (error) {
            message.error(
                "Failed to update field: " + (error?.data?.message || error.message)
            );
        }
    };

    // --- Render Helpers ---
    const renderOptionsInputs = () => {
        if (!selectedDataType) return null;

        if (selectedDataType === "radio") {
            return (
                <div style={{ marginTop: 16 }}>
                    <Text strong>Options:</Text>

                    <Radio.Group
                        value={radioValue}
                        onChange={(e) => setRadioValue(e.target.value)}
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            gap: 8,
                            marginTop: 8,
                        }}
                    >
                        <Radio value="Yes">Yes</Radio>
                        <Radio value="No">No</Radio>
                    </Radio.Group>

                    {/* ✅ Stored optional value (shows only if label provided) */}
                    {placeholder?.trim() ? (
                        <div style={{ marginTop: 12 }}>
                            <Input
                                placeholder={placeholder} // label shown here
                                value={radioOptionalValue} // ✅ stored
                                onChange={(e) => setRadioOptionalValue(e.target.value)}
                            />
                        </div>
                    ) : null}
                </div>
            );
        }

        if (["dropdown", "checkbox", "text"].includes(selectedDataType)) {
            return (
                <div style={{ marginTop: 16 }}>
                    <Text strong>Options:</Text>

                    <div className="options-container">
                        {options.map((opt, index) => (
                            <div key={index} className="option-row">
                                <span className="option-icon-container">
                                    {selectedDataType === "checkbox" ? (
                                        <div className="checkbox-square" />
                                    ) : (
                                        <span className="option-number">{index + 1}.</span>
                                    )}
                                </span>

                                <Input
                                    placeholder={`Option ${index + 1}`}
                                    value={opt}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    className="option-google-input"
                                    variant="borderless"
                                />

                                {options.length > 1 && (
                                    <CloseOutlined
                                        onClick={() => handleRemoveOption(index)}
                                        className="delete-option-btn"
                                    />
                                )}
                            </div>
                        ))}

                        <div className="option-row add-option-row" onClick={handleAddOption}>
                            <span className="option-icon-container">
                                {selectedDataType === "checkbox" ? (
                                    <div className="checkbox-square" />
                                ) : (
                                    <span className="option-number">{options.length + 1}.</span>
                                )}
                            </span>
                            <span className="add-option-text">Add option</span>
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    // Reusable Form Content
    const renderFormContent = () => (
        <Row gutter={[24, 24]}>
            <Col span={12}>
                <label className="field-label">
                    Field Name<span className="required">*</span>
                </label>
                <Input
                    placeholder="Enter Field Name..."
                    size="large"
                    style={{ borderRadius: "6px" }}
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                />
            </Col>

            <Col span={12}>
                <label className="field-label">
                    Data Type<span className="required">*</span>
                </label>
                <Select
                    placeholder="Select Data Type"
                    size="large"
                    style={{ width: "100%", borderRadius: "6px" }}
                    onChange={handleDataTypeChange}
                    value={selectedDataType}
                >
                    <Option value="text">Text</Option>
                    <Option value="dropdown">Dropdown</Option>
                    <Option value="radio">Radio Button</Option>
                    <Option value="checkbox">Checkbox</Option>
                    <Option value="email">Email</Option>
                    <Option value="number">Number</Option>
                </Select>
            </Col>

            <Col span={24}>{renderOptionsInputs()}</Col>

            {/* ✅ Label input for radio optional field */}
            {["email", "number", "radio"].includes(selectedDataType) && (
                <Col span={24}>
                    <label className="field-label">
                        {selectedDataType === "radio"
                            ? "Optional Input Label (Leave empty to disable)"
                            : "Placeholder"}
                    </label>
                    <Input
                        placeholder={
                            selectedDataType === "radio"
                                ? "Enter label for extra input (e.g. Reason)..."
                                : "Enter Placeholder..."
                        }
                        size="large"
                        style={{ borderRadius: "6px" }}
                        value={placeholder}
                        onChange={(e) => {
                            const v = e.target.value;
                            setPlaceholder(v);

                            // ✅ if label removed => disable optional input and clear stored value
                            if (selectedDataType === "radio" && !v.trim()) {
                                setRadioOptionalValue("");
                            }
                        }}
                    />
                </Col>
            )}
        </Row>
    );

    const columns = [
        { title: "Field Name", dataIndex: "fieldName", key: "fieldName" },
        { title: "Data Type", dataIndex: "dataType", key: "dataType" },
        {
            key: "action",
            width: 100,
            align: "right",
            render: (_, record) => (
                <Space size="middle">
                    <EditOutlined className="action-btn" onClick={() => handleEdit(record)} />
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
                <div className="SectionMainHeading">Manage Contact Form Fields</div>
                <Text className="fields-page-subtitle">
                    Add and manage custom fields for your contact form
                </Text>
            </div>

            <div className="MaxWidthContainer">
                <Space direction="vertical" size={24} style={{ width: "100%" }}>
                    <Card
                        className="custom-card"
                        title={<span style={{ fontSize: "16px", fontWeight: 500 }}>Add New Field</span>}
                        bordered={false}
                    >
                        {renderFormContent()}
                        <div style={{ textAlign: "right", marginTop: "16px" }}>
                            <Button
                                type="primary"
                                size="large"
                                className="add-field-btn"
                                onClick={handleCreate}
                                loading={isCreating}
                            >
                                Add Field
                            </Button>
                        </div>
                    </Card>

                    <Card
                        className="custom-card"
                        title={<span style={{ fontSize: "16px", fontWeight: 500 }}>Existing Fields</span>}
                        bordered={false}
                    >
                        <Table
                            columns={columns}
                            dataSource={Array.isArray(fieldsData) ? fieldsData : fieldsData?.data || []}
                            loading={isFieldsLoading}
                            pagination={false}
                            className="custom-table"
                            rowClassName={() => "editable-row"}
                            rowKey={(record) => record._id || record.id || record.key}
                        />
                    </Card>
                </Space>
            </div>

            <Modal
                title="Update Field"
                open={isEditModalOpen}
                onCancel={handleCancelEdit}
                onOk={handleUpdate}
                confirmLoading={isUpdating}
                okText="Update"
                cancelText="Cancel"
            >
                {renderFormContent()}
            </Modal>

            <DeleteConfirmModal
                open={isDeleteModalOpen}
                onCancel={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Field"
                message={`Are you sure you want to delete the field "${selectedField?.fieldName}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default Fileds;
