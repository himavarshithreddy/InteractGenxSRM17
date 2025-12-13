'use client';

import { useEffect, useState } from 'react';
import { inventoryAPI } from '../../lib/api';
import Layout from '../../components/Layout';
import EditModal from '../../components/EditModal';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [productStats, setProductStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [showLowStock, setShowLowStock] = useState(false);
  const [editModal, setEditModal] = useState({ isOpen: false, data: null });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab, showLowStock]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'products') {
        const [productsRes, statsRes] = await Promise.all([
          inventoryAPI.getProducts({ low_stock: showLowStock ? 'true' : undefined }),
          inventoryAPI.getProductStats()
        ]);
        setProducts(productsRes.data);
        setProductStats(statsRes.data);
      } else {
        const response = await inventoryAPI.getStockMovements({ limit: 100 });
        setStockMovements(response.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditModal({ isOpen: true, data: product });
  };

  const handleSave = async (formData) => {
    try {
      setSaving(true);
      await inventoryAPI.updateProduct(editModal.data.id, formData);
      setEditModal({ isOpen: false, data: null });
      fetchData();
    } catch (err) {
      console.error('Error saving:', err);
      alert('Error saving changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    return status === 'active' ? 'badge-success' : 'badge-secondary';
  };

  const getStockBadge = (quantity, threshold) => {
    if (quantity <= threshold) return 'badge-danger';
    if (quantity <= threshold * 2) return 'badge-warning';
    return 'badge-success';
  };

  const productFields = [
    { name: 'sku', label: 'SKU', type: 'text', required: true },
    { name: 'name', label: 'Product Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
    { name: 'category', label: 'Category', type: 'text', required: true },
    { name: 'price', label: 'Price', type: 'number', step: '0.01', required: true },
    { name: 'cost', label: 'Cost', type: 'number', step: '0.01', required: true },
    { name: 'stock_quantity', label: 'Stock Quantity', type: 'number', required: true },
    { name: 'low_stock_threshold', label: 'Low Stock Threshold', type: 'number', required: true },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'discontinued', label: 'Discontinued' },
    ]},
  ];

  return (
    <Layout title="Inventory">
      <div className="fade-in">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="tabs" style={{ flex: 1, marginBottom: 0 }}>
            <button
              className={`tab ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              Products
            </button>
            <button
              className={`tab ${activeTab === 'movements' ? 'active' : ''}`}
              onClick={() => setActiveTab('movements')}
            >
              Stock Movements
            </button>
          </div>
          {activeTab === 'products' && (
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius)',
              border: '2px solid var(--gray-200)',
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--gray-200)'}
            >
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: '500', color: 'var(--gray-700)' }}>Show Low Stock Only</span>
            </label>
          )}
        </div>

         {activeTab === 'products' && (
           <>
             {(() => {
               const totalLowStock = productStats.reduce((sum, stat) => sum + (stat.low_stock_count || 0), 0);
               return totalLowStock > 0 && (
                 <div style={{
                   padding: '1rem 1.5rem',
                   background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                   borderRadius: 'var(--radius-lg)',
                   marginBottom: '2rem',
                   color: 'white',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '1rem',
                   boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)'
                 }}>
                   <div style={{ fontSize: '2rem' }}>⚠️</div>
                   <div style={{ flex: 1 }}>
                     <div style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                       LOW STOCK ALERT
                     </div>
                     <div style={{ fontSize: '0.875rem', opacity: 0.95 }}>
                       {totalLowStock} product{totalLowStock > 1 ? 's' : ''} {totalLowStock > 1 ? 'are' : 'is'} below the low stock threshold and need{totalLowStock === 1 ? 's' : ''} immediate restocking
                     </div>
                   </div>
                   <button
                     className="btn"
                     onClick={() => setShowLowStock(true)}
                     style={{
                       background: 'rgba(255, 255, 255, 0.2)',
                       border: '1px solid rgba(255, 255, 255, 0.3)',
                       color: 'white',
                       fontWeight: '600'
                     }}
                     onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                     onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                   >
                     View Low Stock Items
                   </button>
                 </div>
               );
             })()}
             {productStats.length > 0 && (
               <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                 {productStats.map((stat) => (
                   <div key={stat.category} className="stat-card">
                     <h3>{stat.category}</h3>
                     <div className="value">{stat.total_products}</div>
                     <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                       Total Stock: <strong>{stat.total_stock}</strong>
                     </div>
                     {stat.low_stock_count > 0 && (
                       <div style={{ 
                         marginTop: '0.5rem', 
                         padding: '0.5rem', 
                         background: 'var(--danger)15',
                         borderRadius: 'var(--radius-sm)',
                         border: '1px solid var(--danger)40'
                       }}>
                         <div style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: '700', marginBottom: '0.25rem' }}>
                           ⚠️ LOW STOCK ALERT
                         </div>
                         <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)', fontWeight: '600' }}>
                           {stat.low_stock_count} product{stat.low_stock_count > 1 ? 's' : ''} need restocking
                         </div>
                       </div>
                     )}
                   </div>
                 ))}
               </div>
             )}

            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Products</h2>
              </div>
              {loading ? (
                <div className="loading">Loading products...</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Cost</th>
                        <th>Stock</th>
                        <th>Low Stock Threshold</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td><code style={{ 
                            background: 'var(--gray-100)', 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: '600'
                          }}>{product.sku}</code></td>
                          <td><strong>{product.name}</strong></td>
                          <td>{product.category}</td>
                          <td><strong>${product.price.toFixed(2)}</strong></td>
                          <td>${product.cost.toFixed(2)}</td>
                          <td>
                            <span className={`badge ${getStockBadge(product.stock_quantity, product.low_stock_threshold)}`}>
                              {product.stock_quantity}
                            </span>
                          </td>
                          <td>{product.low_stock_threshold}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(product.status)}`}>
                              {product.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleEdit(product)}
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

        {activeTab === 'movements' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Stock Movements</h2>
            </div>
            {loading ? (
              <div className="loading">Loading stock movements...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Type</th>
                      <th>Quantity</th>
                      <th>Reason</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockMovements.map((movement) => (
                      <tr key={movement.id}>
                        <td>{new Date(movement.created_at).toLocaleString()}</td>
                        <td><strong>{movement.product_name}</strong></td>
                        <td><code style={{ 
                          background: 'var(--gray-100)', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: 'var(--radius-sm)'
                        }}>{movement.sku}</code></td>
                        <td>
                          <span className={`badge ${movement.type === 'in' ? 'badge-success' : 'badge-danger'}`}>
                            {movement.type === 'in' ? '↗ In' : '↘ Out'}
                          </span>
                        </td>
                        <td><strong>{movement.quantity}</strong></td>
                        <td>{movement.reason || 'N/A'}</td>
                        <td>{movement.reference || 'N/A'}</td>
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
          onClose={() => setEditModal({ isOpen: false, data: null })}
          title="Edit Product"
          fields={productFields}
          data={editModal.data}
          onSave={handleSave}
          loading={saving}
        />
      </div>
    </Layout>
  );
}
