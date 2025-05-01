import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, auth } from './Firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  ShoppingBag, 
  Package, 
  CheckSquare, 
  PlusCircle, 
  List, 
  Clipboard, 
  User,
  Truck,
  AlertTriangle,
  Clock,
  DollarSign,
  BarChart2
} from 'lucide-react';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [user, loadingAuth] = useAuthState(auth);
  const [shopData, setShopData] = useState(null);
  const [stats, setStats] = useState({
    products: 0,
    pendingOrders: 0,
    completedOrders: 0,
    processingOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    if (!loadingAuth && !user) {
      navigate('/auth');
    } else if (user) {
      fetchShopData();
      fetchStats();
      fetchRecentOrders();
    }
  }, [user, loadingAuth, navigate]);

  const fetchShopData = async () => {
    try {
      const docRef = doc(db, 'shopkeepers', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setShopData(docSnap.data());
      }
    } catch (error) {
      console.error('Error fetching shop data:', error);
    }
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      
      // Products count
      const productsQuery = query(
        collection(db, 'products'),
        where('shopId', '==', user.uid)
      );
      const productsSnapshot = await getDocs(productsQuery);
      
      // Pending orders count
      const pendingOrdersQuery = query(
        collection(db, 'orders'),
        where('shopId', '==', user.uid),
        where('status', '==', 'pending')
      );
      const pendingOrdersSnapshot = await getDocs(pendingOrdersQuery);
      
      // Processing orders count
      const processingOrdersQuery = query(
        collection(db, 'orders'),
        where('shopId', '==', user.uid),
        where('status', '==', 'processing')
      );
      const processingOrdersSnapshot = await getDocs(processingOrdersQuery);
      
      // Completed/Delivered orders count
      const completedOrdersQuery = query(
        collection(db, 'orders'),
        where('shopId', '==', user.uid),
        where('status', 'in', ['completed', 'delivered'])
      );
      const completedOrdersSnapshot = await getDocs(completedOrdersQuery);

      // Calculate total revenue from all completed/delivered orders
      let totalRevenue = 0;
      let monthlyRevenue = 0;
      
      // Current month boundaries for monthly revenue calculation
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      completedOrdersSnapshot.forEach((doc) => {
        const orderData = doc.data();
        totalRevenue += orderData.totalAmount || 0;
        
        // Check if order was completed in current month
        if (orderData.completedTime && 
            new Date(orderData.completedTime.toDate()) >= firstDayOfMonth) {
          monthlyRevenue += orderData.totalAmount || 0;
        }
      });
      
      setStats({
        products: productsSnapshot.size,
        pendingOrders: pendingOrdersSnapshot.size,
        processingOrders: processingOrdersSnapshot.size,
        completedOrders: completedOrdersSnapshot.size,
        totalRevenue: totalRevenue,
        monthlyRevenue: monthlyRevenue
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      // Get 5 most recent orders that need attention (pending or processing)
      const recentOrdersQuery = query(
        collection(db, 'orders'),
        where('shopId', '==', user.uid),
        where('status', 'in', ['pending', 'processing']),
        orderBy('orderTime', 'desc'),
        limit(5)
      );
      
      const snapshot = await getDocs(recentOrdersQuery);
      
      const orders = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        // Convert Firestore timestamp to JS Date if it exists
        const orderTime = data.orderTime ? data.orderTime.toDate() : null;
        
        orders.push({ 
          id: doc.id, 
          ...data,
          orderTime: orderTime
        });
      });
      
      setRecentOrders(orders);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: "status-badge pending",
      processing: "status-badge processing",
      completed: "status-badge completed",
      delivered: "status-badge delivered",
      cancelled: "status-badge cancelled"
    };
    
    return (
      <span className={statusStyles[status] || "status-badge"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loadingAuth) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="store-details">
          <h1>{shopData?.shopName || 'Your Store'}</h1>
          <p>Welcome back, {shopData?.ownerName || 'Shopkeeper'}</p>
        </div>
        <div className="header-actions">
          <button 
            className="primary-button"
            onClick={() => navigate('/add-product')}
          >
            <PlusCircle size={18} />
            Add New Product
          </button>
        </div>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon products">
            <ShoppingBag size={24} />
          </div>
          <div className="stat-content">
            <h3>Products</h3>
            <p className="stat-value">{loadingStats ? '...' : stats.products}</p>
            <p className="stat-label">Total inventory items</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon pending">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <h3>Pending Orders</h3>
            <p className="stat-value">{loadingStats ? '...' : stats.pendingOrders}</p>
            <p className="stat-label">Orders awaiting action</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon completed">
            <CheckSquare size={24} />
          </div>
          <div className="stat-content">
            <h3>Completed Orders</h3>
            <p className="stat-value">{loadingStats ? '...' : stats.completedOrders}</p>
            <p className="stat-label">Successfully delivered</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon revenue">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p className="stat-value">{loadingStats ? '...' : formatCurrency(stats.totalRevenue)}</p>
            <p className="stat-label">All-time earnings</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-main">
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Quick Actions</h2>
          </div>
          <div className="action-grid">
            <button 
              onClick={() => navigate('/add-product')}
              className="action-btn"
            >
              <PlusCircle size={20} />
              Add Product
            </button>
            
            <button 
              onClick={() => navigate('/products')}
              className="action-btn"
            >
              <List size={20} />
              Manage Products
            </button>
            
            <button 
              onClick={() => navigate('/orders')}
              className="action-btn"
            >
              <Clipboard size={20} />
              View Orders
            </button>
            
            <button 
              onClick={() => navigate('/profile')}
              className="action-btn"
            >
              <User size={20} />
              Shop Profile
            </button>
          </div>
        </div>
        
        <div className="dashboard-cols">
          <div className="dashboard-section orders-section">
            <div className="section-header">
              <h2 className="section-title">Recent Orders</h2>
              <button 
                className="view-all-btn"
                onClick={() => navigate('/orders')}
              >
                View All
              </button>
            </div>
            
            {recentOrders.length > 0 ? (
              <div className="orders-list">
                {recentOrders.map(order => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div className="order-id">
                        <h3>Order #{order.id.slice(-6)}</h3>
                        {getStatusBadge(order.status)}
                      </div>
                      <span className="order-time">
                        <Clock size={14} />
                        {order.orderTime ? order.orderTime.toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Pending'}
                      </span>
                    </div>
                    <div className="order-details">
                      <p><strong>Customer:</strong> {order.customerName}</p>
                      <p><strong>Items:</strong> {order.items?.length || 0}</p>
                      <p><strong>Total:</strong> {formatCurrency(order.totalAmount || 0)}</p>
                    </div>
                    <button 
                      onClick={() => navigate(`/orders`)}
                      className="view-order-btn"
                    >
                      Process Order
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Package size={48} />
                <p>No pending orders at the moment</p>
              </div>
            )}
          </div>
          
          <div className="dashboard-section revenue-section">
            <div className="section-header">
              <h2 className="section-title">Revenue Insights</h2>
            </div>
            <div className="revenue-stats">
              <div className="revenue-card">
                <div className="revenue-icon">
                  <DollarSign size={20} />
                </div>
                <div className="revenue-content">
                  <h4>This Month</h4>
                  <p className="revenue-amount">{formatCurrency(stats.monthlyRevenue)}</p>
                </div>
              </div>
              
              <div className="revenue-card">
                <div className="revenue-icon">
                  <Truck size={20} />
                </div>
                <div className="revenue-content">
                  <h4>Processing</h4>
                  <p className="revenue-amount">{stats.processingOrders} orders</p>
                </div>
              </div>
              
              <div className="revenue-card">
                <div className="revenue-icon">
                  <BarChart2 size={20} />
                </div>
                <div className="revenue-content">
                  <h4>Average Order</h4>
                  <p className="revenue-amount">
                    {stats.completedOrders > 0 
                      ? formatCurrency(stats.totalRevenue / stats.completedOrders) 
                      : formatCurrency(0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {stats.products < 5 && (
        <div className="alert-banner">
          <AlertTriangle size={20} />
          <span>Low inventory alert! You have less than 5 products.</span>
          <button 
            onClick={() => navigate('/add-product')}
            className="alert-action"
          >
            Add Products
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;