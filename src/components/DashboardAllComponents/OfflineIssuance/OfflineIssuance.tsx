import React, { useState, useMemo } from 'react';
import { Typography, Card, Input, Select, Button, Spin, Empty, notification, DatePicker } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import './OfflineIssuance.css';
import { useGetPendingPolicyIssuancesQuery, useUpdatePolicyIssuanceMutation } from '../../../redux/api/policyIssuanceApi';

dayjs.extend(isBetween);

const { Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface BaseProduct {
    baseProductId: {
        _id: string;
        name: string;
    };
    isOnline: boolean;
    policyNumber: string | null;
    policyUrl: string | null;
    issuanceStatus: string;
    _id: string;
}

interface PolicyIssuance {
    _id: string;
    applicationId: {
        _id: string;
        productId: {
            _id: string;
            name: string;
        };
        agentId: {
            _id: string;
            name: string;
            mobile?: string;
        };
    };
    insuredPersonId: {
        _id: string;
        data: {
            firstName?: string;
            phoneNumber?: string;
            gender?: string;
            panNumber?: string;
            dob?: string;
        };
    };
    baseProducts: BaseProduct[];
    createdAt: string;
    policySent: boolean;
    updatedAt: string;
}

interface OfflinePolicyInput {
    [issuanceId: string]: {
        [baseProductId: string]: {
            policyNumber: string;
            policyUrl: string;
        };
    };
}

const OfflineIssuance: React.FC = () => {
    // Filter States
    const [searchText, setSearchText] = useState('');
    const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
    const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

    const [offlinePolicyInputs, setOfflinePolicyInputs] = useState<OfflinePolicyInput>({});

    const { data: response, isLoading, isError } = useGetPendingPolicyIssuancesQuery(undefined);
    const [updatePolicyIssuance, { isLoading: isUpdating }] = useUpdatePolicyIssuanceMutation();

    const issuances: PolicyIssuance[] = response?.data || [];

    // Extract Unique Policies and Agents for Filter Options
    const { policyOptions, agentOptions } = useMemo(() => {
        const basePolicies = new Map();
        const agents = new Map();

        issuances.forEach(item => {
            // Extract from baseProducts as requested
            item.baseProducts.forEach(prod => {
                if (prod.baseProductId && prod.baseProductId._id) {
                    basePolicies.set(prod.baseProductId._id, prod.baseProductId.name);
                }
            });

            const agent = item.applicationId.agentId;
            if (agent && agent._id) {
                agents.set(agent._id, agent.name);
            }
        });

        return {
            policyOptions: Array.from(basePolicies.entries()).map(([id, name]) => ({ label: name, value: id })),
            agentOptions: Array.from(agents.entries()).map(([id, name]) => ({ label: name, value: id }))
        };
    }, [issuances]);

    // Filtering Logic
    const filteredIssuances = useMemo(() => {
        return issuances.filter(item => {
            // 1. Search Text (Agent Name, Customer Name, Offline/Online Product Names)
            const searchLower = searchText.toLowerCase();
            const matchesSearch = !searchText || (
                (item.applicationId.agentId.name || '').toLowerCase().includes(searchLower) ||
                (item.insuredPersonId.data.firstName || '').toLowerCase().includes(searchLower) ||
                item.baseProducts.some(p => (p.baseProductId.name || '').toLowerCase().includes(searchLower))
            );

            // 2. Policy Filter (Multi-select)
            const matchesPolicy = selectedPolicies.length === 0 || item.baseProducts.some(p => selectedPolicies.includes(p.baseProductId._id));

            // 3. Agent Filter (Multi-select)
            const matchesAgent = selectedAgents.length === 0 || selectedAgents.includes(item.applicationId.agentId._id);

            // 4. Date Range Filter (based on createdAt)
            let matchesDate = true;
            if (dateRange && dateRange[0] && dateRange[1]) {
                const createdDate = dayjs(item.createdAt);
                matchesDate = createdDate.isBetween(dateRange[0].startOf('day'), dateRange[1].endOf('day'), null, '[]');
            } else if (dateRange && dateRange[0]) {
                const createdDate = dayjs(item.createdAt);
                matchesDate = createdDate.isSame(dateRange[0], 'day');
            }

            return matchesSearch && matchesPolicy && matchesAgent && matchesDate;
        });
    }, [issuances, searchText, selectedPolicies, selectedAgents, dateRange]);

    const handleInputChange = (issuanceId: string, baseProductId: string, field: 'policyNumber' | 'policyUrl', value: string) => {
        setOfflinePolicyInputs(prev => ({
            ...prev,
            [issuanceId]: {
                ...prev[issuanceId],
                [baseProductId]: {
                    ...prev[issuanceId]?.[baseProductId],
                    [field]: value
                }
            }
        }));
    };

    const handleSend = async (issuanceId: string, offlineProducts: BaseProduct[]) => {
        const issuanceInputs = offlinePolicyInputs[issuanceId] || {};
        const baseProductPolicies = [];

        for (const product of offlineProducts) {
            const productId = product.baseProductId._id;
            const inputs = issuanceInputs[productId];

            if (!inputs?.policyNumber || !inputs?.policyUrl) {
                notification.error({
                    message: 'Validation Error',
                    description: `Please fill in both policy number and URL for ${product.baseProductId.name}`,
                    placement: 'topRight',
                });
                return;
            }

            baseProductPolicies.push({
                baseProductId: productId,
                policyNumber: inputs.policyNumber,
                policyUrl: inputs.policyUrl
            });
        }

        try {
            await updatePolicyIssuance({
                id: issuanceId,
                baseProductPolicies
            }).unwrap();

            notification.success({
                message: 'Success',
                description: 'Policy details sent successfully!',
                placement: 'topRight',
            });

            setOfflinePolicyInputs(prev => {
                const newState = { ...prev };
                delete newState[issuanceId];
                return newState;
            });
        } catch (error: any) {
            notification.error({
                message: 'Error',
                description: error.data?.message || 'Failed to send policy details',
                placement: 'topRight',
            });
        }
    };

    const handleSendAll = async () => {
        const updatePayloads = [];

        for (const item of filteredIssuances) {
            const offlineProducts = item.baseProducts.filter(p => !p.isOnline);
            if (offlineProducts.length === 0) continue;

            const issuanceInputs = offlinePolicyInputs[item._id] || {};
            const baseProductPolicies = [];

            for (const product of offlineProducts) {
                const productId = product.baseProductId._id;
                const inputs = issuanceInputs[productId];

                if (!inputs?.policyNumber || !inputs?.policyUrl) {
                    notification.error({
                        message: 'Validation Error',
                        description: `Missing details for ${item.insuredPersonId.data.firstName || 'Customer'} - ${product.baseProductId.name}`,
                        placement: 'topRight',
                    });
                    return;
                }

                baseProductPolicies.push({
                    baseProductId: productId,
                    policyNumber: inputs.policyNumber,
                    policyUrl: inputs.policyUrl
                });
            }

            updatePayloads.push({
                id: item._id,
                baseProductPolicies
            });
        }

        if (updatePayloads.length === 0) {
            notification.info({ message: 'No offline products to send' });
            return;
        }

        try {
            await Promise.all(updatePayloads.map(payload => updatePolicyIssuance(payload).unwrap()));

            notification.success({
                message: 'Success',
                description: 'All policy details sent successfully!',
                placement: 'topRight',
            });

            setOfflinePolicyInputs({});
        } catch (error: any) {
            notification.error({
                message: 'Error',
                description: error.data?.message || 'Failed to send some policy details',
                placement: 'topRight',
            });
        }
    };

    return (
        <div className="offline-issuance-wrapper MainComponentWrapper">
            <div className="offline-issuance-header">
                <div>
                    <div className='SectionMainHeading'>Offline Issuance</div>
                    <Text className="offline-issuance-subtitle">Manage insurance policies issued offline and send them to agents manually</Text>
                </div>
            </div>

            <div className="filter-bar">
                <Input
                    placeholder="Search Agent, Customer or Product..."
                    prefix={<SearchOutlined style={{ color: '#999' }} />}
                    className="search-input"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    allowClear
                />
                <Select
                    mode="multiple"
                    placeholder="Filter by Policy"
                    className="filter-select"
                    value={selectedPolicies}
                    onChange={setSelectedPolicies}
                    maxTagCount="responsive"
                    allowClear
                >
                    {policyOptions.map(opt => (
                        <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                    ))}
                </Select>
                <Select
                    mode="multiple"
                    placeholder="Filter by Agent"
                    className="filter-select"
                    value={selectedAgents}
                    onChange={setSelectedAgents}
                    maxTagCount="responsive"
                    allowClear
                >
                    {agentOptions.map(opt => (
                        <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                    ))}
                </Select>
                <RangePicker
                    className="filter-rangepicker"
                    onChange={(dates) => setDateRange(dates as any)}
                    value={dateRange}
                />
            </div>

            <Card className="offline-issuance-card">
                <div className="issuance-card-header">
                    <div className='SectionSubHeading'>Issuance List ({filteredIssuances.length})</div>
                    <Button
                        type="primary"
                        className="send-all-btn"
                        onClick={handleSendAll}
                        loading={isUpdating}
                        disabled={filteredIssuances.length === 0 || isUpdating}
                    >
                        Send All
                    </Button>
                </div>

                <div className="issuance-table-container">
                    <div className="issuance-table-header">
                        <div className="col-agent">Agent Name</div>
                        <div className="col-customer">Customer Details</div>
                        <div className="col-online">Online</div>
                        <div className="col-offline">Offline</div>
                        <div className="col-action"></div>
                    </div>

                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <Spin size="large" />
                        </div>
                    ) : isError ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <Empty description="Failed to load data" />
                        </div>
                    ) : (
                        filteredIssuances.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <Empty description="No matching issuances found" />
                            </div>
                        ) : (
                            filteredIssuances.map((item) => {
                                const onlineProducts = item.baseProducts.filter(p => p.isOnline);
                                const offlineProducts = item.baseProducts.filter(p => !p.isOnline);

                                return (
                                    <div key={item._id} className="issuance-table-row">
                                        <div className="col-agent">
                                            <div className="primary-text">{item.applicationId.agentId.name}</div>
                                            {item.applicationId.agentId.mobile && (
                                                <div className="secondary-text">{item.applicationId.agentId.mobile}</div>
                                            )}
                                        </div>
                                        <div className="col-customer">
                                            <div className="primary-text">{item.insuredPersonId.data.firstName || 'N/A'}</div>
                                            <div className="secondary-text">{item.insuredPersonId.data.phoneNumber || 'N/A'}</div>
                                            {item.insuredPersonId.data.gender && (
                                                <div className="secondary-text">Gender: {item.insuredPersonId.data.gender}</div>
                                            )}
                                            {item.insuredPersonId.data.panNumber && (
                                                <div className="secondary-text">PAN: {item.insuredPersonId.data.panNumber}</div>
                                            )}
                                            {item.insuredPersonId.data.dob && (
                                                <div className="secondary-text">DOB: {item.insuredPersonId.data.dob}</div>
                                            )}
                                            <div className="secondary-text" style={{ marginTop: '5px', opacity: 0.6 }}>
                                                Applied on: {dayjs(item.createdAt).format('DD/MM/YYYY')}
                                            </div>
                                        </div>
                                        <div className="col-online">
                                            {onlineProducts.length > 0 ? (
                                                onlineProducts.map((prod) => (
                                                    <div key={prod._id} className="product-info-block">
                                                        <div className="product-name">{prod.baseProductId.name}</div>
                                                        {prod.policyNumber && (
                                                            <div className="policy-number">Policy Number: {prod.policyNumber}</div>
                                                        )}
                                                        {prod.policyUrl && (
                                                            <div className="policy-url">{prod.policyUrl}</div>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="secondary-text">-</div>
                                            )}
                                        </div>
                                        <div className="col-offline">
                                            {offlineProducts.length > 0 ? (
                                                offlineProducts.map((prod) => (
                                                    <div key={prod._id} className="offline-input-block">
                                                        <div className="product-name">{prod.baseProductId.name}</div>
                                                        <Input
                                                            placeholder="Enter policy number"
                                                            className="offline-input"
                                                            value={offlinePolicyInputs[item._id]?.[prod.baseProductId._id]?.policyNumber || ''}
                                                            onChange={(e) => handleInputChange(item._id, prod.baseProductId._id, 'policyNumber', e.target.value)}
                                                        />
                                                        <Input
                                                            placeholder="Enter policy URL"
                                                            className="offline-input"
                                                            value={offlinePolicyInputs[item._id]?.[prod.baseProductId._id]?.policyUrl || ''}
                                                            onChange={(e) => handleInputChange(item._id, prod.baseProductId._id, 'policyUrl', e.target.value)}
                                                        />
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="secondary-text">-</div>
                                            )}
                                        </div>
                                        <div className="col-action">
                                            <Button
                                                type="primary"
                                                className="send-btn"
                                                onClick={() => handleSend(item._id, offlineProducts)}
                                                loading={isUpdating}
                                                disabled={offlineProducts.length === 0 || isUpdating}
                                            >
                                                Send
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )
                    )}
                </div>
            </Card>
        </div>
    );
};

export default OfflineIssuance;
