'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { analyticsAPI } from '../lib/api';
import Layout from '../components/Layout';

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const response = await analyticsAPI.getOverview();
      setOverview(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="loading">Loading dashboard...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Dashboard">
        <div className="error">Error: {error}</div>
      </Layout>
    );
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${overview?.totalRevenue?.toFixed(2) || '0.00'}`,
      change: '+12.5%',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      title: 'Total Orders',
      value: overview?.totalOrders || 0,
      change: '+8.2%',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      title: 'Total Customers',
      value: overview?.totalCustomers || 0,
      change: '+15.3%',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      title: 'Total Products',
      value: overview?.totalProducts || 0,
      change: '+5.1%',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
    {
      title: 'Pending Orders',
      value: overview?.pendingOrders || 0,
      change: '-3.2%',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
    {
      title: 'Low Stock Products',
      value: overview?.lowStockProducts || 0,
      change: '-2.1%',
      gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    },
    {
      title: 'Active Campaigns',
      value: overview?.activeCampaigns || 0,
      change: '+7.8%',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    },
  ];

  const navCards = [
    {
      href: '/operations',
      title: 'Operations',
      description: 'Manage orders, customers, and business operations',
      icon: '📦',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      href: '/marketing',
      title: 'Marketing',
      description: 'Campaigns, promotions, and marketing analytics',
      icon: '📢',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      href: '/inventory',
      title: 'Inventory',
      description: 'Product catalog, stock levels, and inventory management',
      icon: '📋',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      href: '/logistics',
      title: 'Logistics',
      description: 'Shipments, warehouses, and delivery management',
      icon: '🚚',
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
  ];

  return (
    <Layout title="Dashboard Overview">
      <div className="fade-in">
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            marginBottom: '2rem',
            color: 'var(--gray-900)',
            letterSpacing: '-0.025em'
          }}>
            Key Metrics
          </h2>
          <div className="stats-grid">
            {statCards.map((stat, index) => (
              <div key={index} className="stat-card">
                <h3>{stat.title}</h3>
                <div className="value" style={{
                  background: stat.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {stat.value}
                </div>
                <div className="change">
                  <span>↗</span>
                  {stat.change}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Quick Navigation</h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {navCards.map((nav) => (
              <Link
                key={nav.href}
                href={nav.href}
                className="nav-card"
                style={{
                  background: `linear-gradient(135deg, ${nav.color.includes('667eea') ? '#f0f4ff' : nav.color.includes('f093fb') ? '#fdf2f8' : nav.color.includes('4facfe') ? '#eff6ff' : '#f0fdf4'}, #ffffff)`,
                }}
              >
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem',
                  display: 'inline-block',
                  transform: 'scale(1)',
                  transition: 'transform 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {nav.icon}
                </div>
                <h3>{nav.title}</h3>
                <p>{nav.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
