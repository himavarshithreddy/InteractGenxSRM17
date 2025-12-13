'use client';

import { useEffect, useState } from 'react';
import { marketingAPI } from '../../lib/api';
import Layout from '../../components/Layout';
import EditModal from '../../components/EditModal';

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('campaigns');
  const [editModal, setEditModal] = useState({ isOpen: false, type: null, data: null });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'campaigns') {
        const response = await marketingAPI.getCampaigns();
        setCampaigns(response.data);
      } else {
        const response = await marketingAPI.getPromotions();
        setPromotions(response.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  const handleEdit = (type, item) => {
    setEditModal({ isOpen: true, type, data: item });
  };

  const handleSave = async (formData) => {
    try {
      setSaving(true);
      if (editModal.type === 'campaign') {
        await marketingAPI.updateCampaign(editModal.data.id, formData);
      } else if (editModal.type === 'promotion') {
        await marketingAPI.updatePromotion(editModal.data.id, formData);
      }
      setEditModal({ isOpen: false, type: null, data: null });
      fetchData();
    } catch (err) {
      console.error('Error saving:', err);
      alert('Error saving changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'badge-success',
      draft: 'badge-secondary',
      paused: 'badge-warning',
      completed: 'badge-info',
    };
    return badges[status] || 'badge-secondary';
  };

  const campaignFields = [
    { name: 'name', label: 'Campaign Name', type: 'text', required: true },
    { name: 'type', label: 'Type', type: 'select', required: true, options: [
      { value: 'email', label: 'Email' },
      { value: 'social', label: 'Social Media' },
      { value: 'display', label: 'Display Ads' },
      { value: 'search', label: 'Search Ads' },
    ]},
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'draft', label: 'Draft' },
      { value: 'active', label: 'Active' },
      { value: 'paused', label: 'Paused' },
      { value: 'completed', label: 'Completed' },
    ]},
    { name: 'budget', label: 'Budget', type: 'number', step: '0.01', required: true },
    { name: 'spent', label: 'Spent', type: 'number', step: '0.01', required: true },
    { name: 'impressions', label: 'Impressions', type: 'number', required: true },
    { name: 'clicks', label: 'Clicks', type: 'number', required: true },
    { name: 'conversions', label: 'Conversions', type: 'number', required: true },
    { name: 'start_date', label: 'Start Date', type: 'date', required: true },
    { name: 'end_date', label: 'End Date', type: 'date', required: true },
  ];

  const promotionFields = [
    { name: 'name', label: 'Promotion Name', type: 'text', required: true },
    { name: 'code', label: 'Promo Code', type: 'text', required: true },
    { name: 'discount_type', label: 'Discount Type', type: 'select', required: true, options: [
      { value: 'percentage', label: 'Percentage' },
      { value: 'fixed', label: 'Fixed Amount' },
    ]},
    { name: 'discount_value', label: 'Discount Value', type: 'number', step: '0.01', required: true },
    { name: 'min_purchase', label: 'Min Purchase', type: 'number', step: '0.01', required: true },
    { name: 'max_discount', label: 'Max Discount', type: 'number', step: '0.01' },
    { name: 'usage_limit', label: 'Usage Limit', type: 'number' },
    { name: 'used_count', label: 'Used Count', type: 'number', required: true },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'expired', label: 'Expired' },
    ]},
    { name: 'start_date', label: 'Start Date', type: 'date', required: true },
    { name: 'end_date', label: 'End Date', type: 'date', required: true },
  ];

  return (
    <Layout title="Marketing">
      <div className="fade-in">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'campaigns' ? 'active' : ''}`}
            onClick={() => setActiveTab('campaigns')}
          >
            Campaigns
          </button>
          <button
            className={`tab ${activeTab === 'promotions' ? 'active' : ''}`}
            onClick={() => setActiveTab('promotions')}
          >
            Promotions
          </button>
        </div>

        {activeTab === 'campaigns' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Marketing Campaigns</h2>
            </div>
            {loading ? (
              <div className="loading">Loading campaigns...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Budget</th>
                      <th>Spent</th>
                      <th>Impressions</th>
                      <th>Clicks</th>
                      <th>Conversions</th>
                      <th>CTR</th>
                      <th>Period</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign) => {
                      const ctr = campaign.impressions > 0 
                        ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) + '%'
                        : '0%';
                      return (
                        <tr key={campaign.id}>
                          <td><strong>{campaign.name}</strong></td>
                          <td>{campaign.type}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(campaign.status)}`}>
                              {campaign.status}
                            </span>
                          </td>
                          <td><strong>${campaign.budget.toFixed(2)}</strong></td>
                          <td><strong>${campaign.spent.toFixed(2)}</strong></td>
                          <td>{campaign.impressions.toLocaleString()}</td>
                          <td>{campaign.clicks.toLocaleString()}</td>
                          <td><strong>{campaign.conversions}</strong></td>
                          <td>{ctr}</td>
                          <td>
                            {campaign.start_date && campaign.end_date
                              ? `${new Date(campaign.start_date).toLocaleDateString()} - ${new Date(campaign.end_date).toLocaleDateString()}`
                              : 'N/A'}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleEdit('campaign', campaign)}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'promotions' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Promotions & Discounts</h2>
            </div>
            {loading ? (
              <div className="loading">Loading promotions...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Code</th>
                      <th>Discount</th>
                      <th>Min Purchase</th>
                      <th>Usage</th>
                      <th>Status</th>
                      <th>Valid Period</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promotions.map((promo) => {
                      const discount = promo.discount_type === 'percentage'
                        ? `${promo.discount_value}%`
                        : `$${promo.discount_value}`;
                      const usage = promo.usage_limit
                        ? `${promo.used_count}/${promo.usage_limit}`
                        : `${promo.used_count} (unlimited)`;
                      return (
                        <tr key={promo.id}>
                          <td><strong>{promo.name}</strong></td>
                          <td><code style={{ 
                            background: 'var(--gray-100)', 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: '600',
                            color: 'var(--primary)'
                          }}>{promo.code}</code></td>
                          <td><strong>{discount}</strong></td>
                          <td>${promo.min_purchase.toFixed(2)}</td>
                          <td>{usage}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(promo.status)}`}>
                              {promo.status}
                            </span>
                          </td>
                          <td>
                            {promo.start_date && promo.end_date
                              ? `${new Date(promo.start_date).toLocaleDateString()} - ${new Date(promo.end_date).toLocaleDateString()}`
                              : 'N/A'}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleEdit('promotion', promo)}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <EditModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, type: null, data: null })}
          title={editModal.type === 'campaign' ? 'Edit Campaign' : 'Edit Promotion'}
          fields={editModal.type === 'campaign' ? campaignFields : promotionFields}
          data={editModal.data}
          onSave={handleSave}
          loading={saving}
        />
      </div>
    </Layout>
  );
}
