import React, { useState } from 'react';
import { Typography, Card, Input, Select, Button, Modal } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import './OfflineIssuance.css';

const { Text } = Typography;
const { Option } = Select;

const OfflineIssuance: React.FC = () => {
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const dummyData = [
        {
            key: '1',
            agent: { name: 'Priya Sharma', phone: '+91 9873632465' },
            customer: { name: 'Bhupendra Jogi', phone: '+91 9873373846', email: 'bhupendrajogi69@gmail.com' },
            online: [
                { id: 1, name: 'Base Product Name', policyNo: '564373', url: 'www.bimakart.in/ABXU54F7Q' },
                { id: 2, name: 'Base Product Name', policyNo: '564373', url: 'www.bimakart.in/ABXU54F7Q' }
            ],
            offline: [
                { id: 1, name: 'Base Product Name' },
                { id: 2, name: 'Base Product Name' }
            ]
        },
        {
            key: '2',
            agent: { name: 'Priya Sharma', phone: '+91 9873632465' },
            customer: { name: 'Bhupendra Jogi', phone: '+91 9873373846', email: 'bhupendrajogi69@gmail.com' },
            online: [
                { id: 1, name: 'Base Product Name', policyNo: '564373', url: 'www.bimakart.in/ABXU54F7Q' },
                { id: 2, name: 'Base Product Name', policyNo: '564373', url: 'www.bimakart.in/ABXU54F7Q' }
            ],
            offline: [
                { id: 1, name: 'Base Product Name' },
                { id: 2, name: 'Base Product Name' }
            ]
        }
    ];

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
                    placeholder="Search Customer..."
                    prefix={<SearchOutlined style={{ color: '#999' }} />}
                    className="search-input"
                />
                <Select placeholder="Policy Name" className="filter-select">
                    <Option value="policy1">Policy 1</Option>
                </Select>
                <Select placeholder="Agent Name" className="filter-select">
                    <Option value="agent1">Agent 1</Option>
                </Select>
                <Button
                    icon={<FilterOutlined />}
                    className="filter-icon-btn"
                    onClick={() => setIsFilterModalOpen(true)}
                />
            </div>

            <Card className="offline-issuance-card">
                <div className="issuance-card-header">
                    <div className='SectionSubHeading'>Issuance List</div>
                    <Button type="primary" className="send-all-btn">Send All</Button>
                </div>

                <div className="issuance-table-container">
                    <div className="issuance-table-header">
                        <div className="col-agent">Agent Name</div>
                        <div className="col-customer">Customer Details</div>
                        <div className="col-online">Online</div>
                        <div className="col-offline">Offline</div>
                        <div className="col-action"></div>
                    </div>
                    {dummyData.map((item) => (
                        <div key={item.key} className="issuance-table-row">
                            <div className="col-agent">
                                <div className="primary-text">{item.agent.name}</div>
                                <div className="secondary-text">{item.agent.phone}</div>
                            </div>
                            <div className="col-customer">
                                <div className="primary-text">{item.customer.name}</div>
                                <div className="secondary-text">{item.customer.phone}</div>
                                <div className="secondary-text">{item.customer.email}</div>
                            </div>
                            <div className="col-online">
                                {item.online.map((prod) => (
                                    <div key={prod.id} className="product-info-block">
                                        <div className="product-name">{prod.name}</div>
                                        <div className="policy-number">Policy Number: {prod.policyNo}</div>
                                        <div className="policy-url">{prod.url}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="col-offline">
                                {item.offline.map((prod) => (
                                    <div key={prod.id} className="offline-input-block">
                                        <div className="product-name">{prod.name}</div>
                                        <Input placeholder="Enter policy number" className="offline-input" />
                                        <Input placeholder="Enter policy URL" className="offline-input" />
                                    </div>
                                ))}
                            </div>
                            <div className="col-action">
                                <Button type="primary" className="send-btn">Send</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Modal
                title="Filter Options"
                open={isFilterModalOpen}
                onCancel={() => setIsFilterModalOpen(false)}
                footer={null}
                centered
            >
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <Text strong style={{ fontSize: '18px' }}>Coming Soon</Text>
                </div>
            </Modal>
        </div>
    );
};

export default OfflineIssuance;
