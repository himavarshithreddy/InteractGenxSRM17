'use client';

import { useEffect, useState } from 'react';
import { operationsAPI } from '../../lib/api';
import Layout from '../../components/Layout';
import EditModal from '../../components/EditModal';

export default function OperationsPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orderStats, setOrderStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [editModal, setEditModal] = useState({ isOpen: false, type: null, data: null });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'orders') {
        const [ordersRes, statsRes] = await Promise.all([
          operationsAPI.getOrders({ limit: 50 }),
          operationsAPI.getOrderStats()
        ]);
        setOrders(ordersRes.data);
        setOrderStats(statsRes.data);
      } else {
        const customersRes = await operationsAPI.getCustomers({ limit: 50 });
        setCustomers(customersRes.data);
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
      if (editModal.type === 'order') {
        await operationsAPI.updateOrder(editModal.data.id, formData);
      } else if (editModal.type === 'customer') {
        await operationsAPI.updateCustomer(editModal.data.id, formData);
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
      completed: 'badge-success',
      processing: 'badge-info',
      pending: 'badge-warning',
      shipped: 'badge-info',
      cancelled: 'badge-danger',
    };
    return badges[status] || 'badge-secondary';
  };

  const getPaymentBadge = (status) => {
    return status === 'paid' ? 'badge-success' : 'badge-warning';
  };

  const orderFields = [
    { name: 'order_number', label: 'Order Number', type: 'text', required: true },
    { name: 'customer_name', label: 'Customer Name', type: 'text', required: true },
    { name: 'customer_email', label: 'Customer Email', type: 'email', required: true },
    { name: 'total_amount', label: 'Total Amount', type: 'number', step: '0.01', required: true },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'pending', label: 'Pending' },
      { value: 'processing', label: 'Processing' },
      { value: 'shipped', label: 'Shipped' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ]},
    { name: 'payment_status', label: 'Payment Status', type: 'select', required: true, options: [
      { value: 'paid', label: 'Paid' },
      { value: 'unpaid', label: 'Unpaid' },
      { value: 'refunded', label: 'Refunded' },
    ]},
  ];

  const customerFields = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'text' },
    { name: 'total_orders', label: 'Total Orders', type: 'number', required: true },
    { name: 'total_spent', label: 'Total Spent', type: 'number', step: '0.01', required: true },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'banned', label: 'Banned' },
    ]},
  ];

  return (
    <Layout title="Operations">
      <div className="fade-in">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>
          <button
            className={`tab ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            Customers
          </button>
        </div>

        {activeTab === 'orders' && (
          <>
            {orderStats.length > 0 && (
              <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                {orderStats.map((stat) => (
                  <div key={stat.status} className="stat-card">
                    <h3>{stat.status.toUpperCase()}</h3>
                    <div className="value">{stat.count}</div>
                    <div className="change">${stat.total_revenue?.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Recent Orders</h2>
              </div>
              {loading ? (
                <div className="loading">Loading orders...</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Email</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td><strong>{order.order_number}</strong></td>
                          <td>{order.customer_name}</td>
                          <td>{order.customer_email}</td>
                          <td><strong>${order.total_amount.toFixed(2)}</strong></td>
                          <td>
                            <span className={`badge ${getStatusBadge(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${getPaymentBadge(order.payment_status)}`}>
                              {order.payment_status}
                            </span>
                          </td>
                          <td>{new Date(order.created_at).toLocaleDateString()}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleEdit('order', order)}
                              style={{ marginRight: '0.5rem' }}
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

        {activeTab === 'customers' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Customers</h2>
            </div>
            {loading ? (
              <div className="loading">Loading customers...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Total Orders</th>
                      <th>Total Spent</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id}>
                        <td><strong>{customer.name}</strong></td>
                        <td>{customer.email}</td>
                        <td>{customer.phone || 'N/A'}</td>
                        <td><strong>{customer.total_orders}</strong></td>
                        <td><strong>${customer.total_spent.toFixed(2)}</strong></td>
                        <td>
                          <span className={`badge ${customer.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                            {customer.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleEdit('customer', customer)}
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
        )}

        <EditModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, type: null, data: null })}
          title={editModal.type === 'order' ? 'Edit Order' : 'Edit Customer'}
          fields={editModal.type === 'order' ? orderFields : customerFields}
          data={editModal.data}
          onSave={handleSave}
          loading={saving}
        />
      </div>
    </Layout>
  );
}
