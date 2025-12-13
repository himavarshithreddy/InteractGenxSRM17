'use client';

import { useEffect, useState } from 'react';
import { logisticsAPI } from '../../lib/api';
import Layout from '../../components/Layout';
import EditModal from '../../components/EditModal';

export default function LogisticsPage() {
  const [shipments, setShipments] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [shipmentStats, setShipmentStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('shipments');
  const [editModal, setEditModal] = useState({ isOpen: false, type: null, data: null });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'shipments') {
        const [shipmentsRes, statsRes] = await Promise.all([
          logisticsAPI.getShipments(),
          logisticsAPI.getShipmentStats()
        ]);
        setShipments(shipmentsRes.data);
        setShipmentStats(statsRes.data);
      } else {
        const response = await logisticsAPI.getWarehouses();
        setWarehouses(response.data);
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
      if (editModal.type === 'shipment') {
        await logisticsAPI.updateShipment(editModal.data.id, formData);
      } else if (editModal.type === 'warehouse') {
        await logisticsAPI.updateWarehouse(editModal.data.id, formData);
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
      pending: 'badge-warning',
      in_transit: 'badge-info',
      delivered: 'badge-success',
      cancelled: 'badge-danger',
    };
    return badges[status] || 'badge-secondary';
  };

  const getCapacityPercentage = (current, capacity) => {
    return ((current / capacity) * 100).toFixed(1);
  };

  const shipmentFields = [
    { name: 'tracking_number', label: 'Tracking Number', type: 'text' },
    { name: 'carrier', label: 'Carrier', type: 'select', required: true, options: [
      { value: 'FedEx', label: 'FedEx' },
      { value: 'UPS', label: 'UPS' },
      { value: 'DHL', label: 'DHL' },
      { value: 'USPS', label: 'USPS' },
    ]},
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'pending', label: 'Pending' },
      { value: 'in_transit', label: 'In Transit' },
      { value: 'delivered', label: 'Delivered' },
      { value: 'cancelled', label: 'Cancelled' },
    ]},
    { name: 'origin_address', label: 'Origin Address', type: 'text', required: true },
    { name: 'destination_address', label: 'Destination Address', type: 'text', required: true },
    { name: 'estimated_delivery', label: 'Estimated Delivery', type: 'date' },
    { name: 'actual_delivery', label: 'Actual Delivery', type: 'date' },
    { name: 'shipping_cost', label: 'Shipping Cost', type: 'number', step: '0.01', required: true },
  ];

  const warehouseFields = [
    { name: 'name', label: 'Warehouse Name', type: 'text', required: true },
    { name: 'location', label: 'Location', type: 'text', required: true },
    { name: 'capacity', label: 'Capacity', type: 'number', required: true },
    { name: 'current_stock', label: 'Current Stock', type: 'number', required: true },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'maintenance', label: 'Maintenance' },
    ]},
  ];

  return (
    <Layout title="Logistics">
      <div className="fade-in">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'shipments' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipments')}
          >
            Shipments
          </button>
          <button
            className={`tab ${activeTab === 'warehouses' ? 'active' : ''}`}
            onClick={() => setActiveTab('warehouses')}
          >
            Warehouses
          </button>
        </div>

        {activeTab === 'shipments' && (
          <>
            {shipmentStats.length > 0 && (
              <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                {shipmentStats.map((stat) => (
                  <div key={stat.status} className="stat-card">
                    <h3>{stat.status.replace('_', ' ').toUpperCase()}</h3>
                    <div className="value">{stat.count}</div>
                    <div className="change">Total Cost: ${stat.total_cost?.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Shipments</h2>
              </div>
              {loading ? (
                <div className="loading">Loading shipments...</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Tracking #</th>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Carrier</th>
                        <th>Status</th>
                        <th>Origin</th>
                        <th>Destination</th>
                        <th>Est. Delivery</th>
                        <th>Cost</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shipments.map((shipment) => (
                        <tr key={shipment.id}>
                          <td><code style={{ 
                            background: 'var(--gray-100)', 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: '600'
                          }}>{shipment.tracking_number || 'N/A'}</code></td>
                          <td><strong>{shipment.order_number}</strong></td>
                          <td>{shipment.customer_name}</td>
                          <td>{shipment.carrier}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(shipment.status)}`}>
                              {shipment.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.875rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {shipment.origin_address}
                          </td>
                          <td style={{ fontSize: '0.875rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {shipment.destination_address}
                          </td>
                          <td>
                            {shipment.estimated_delivery
                              ? new Date(shipment.estimated_delivery).toLocaleDateString()
                              : 'N/A'}
                          </td>
                          <td><strong>${shipment.shipping_cost.toFixed(2)}</strong></td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleEdit('shipment', shipment)}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'warehouses' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Warehouses</h2>
            </div>
            {loading ? (
              <div className="loading">Loading warehouses...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {warehouses.map((warehouse) => {
                  const capacityPercent = getCapacityPercentage(warehouse.current_stock, warehouse.capacity);
                  const capacityColor = capacityPercent > 90 ? 'var(--danger)' : capacityPercent > 70 ? 'var(--warning)' : 'var(--success)';
                  return (
                    <div key={warehouse.id} className="stat-card" style={{ marginBottom: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                          {warehouse.name}
                        </h3>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleEdit('warehouse', warehouse)}
                        >
                          Edit
                        </button>
                      </div>
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '0.25rem', fontWeight: '500' }}>
                          📍 Location
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-700)' }}>
                          {warehouse.location}
                        </div>
                      </div>
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '0.5rem', fontWeight: '500' }}>
                          Capacity
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                          {warehouse.current_stock.toLocaleString()} / {warehouse.capacity.toLocaleString()}
                        </div>
                        <div style={{
                          width: '100%',
                          height: '12px',
                          background: 'var(--gray-200)',
                          borderRadius: 'var(--radius-full)',
                          marginBottom: '0.5rem',
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          <div style={{
                            width: `${capacityPercent}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, ${capacityColor}, ${capacityColor}dd)`,
                            borderRadius: 'var(--radius-full)',
                            transition: 'width 0.3s ease',
                            boxShadow: `0 2px 8px ${capacityColor}40`
                          }} />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', fontWeight: '600' }}>
                          {capacityPercent}% utilized
                        </div>
                      </div>
                      <div>
                        <span className={`badge ${warehouse.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                          {warehouse.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <EditModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, type: null, data: null })}
          title={editModal.type === 'shipment' ? 'Edit Shipment' : 'Edit Warehouse'}
          fields={editModal.type === 'shipment' ? shipmentFields : warehouseFields}
          data={editModal.data}
          onSave={handleSave}
          loading={saving}
        />
      </div>
    </Layout>
  );
}
