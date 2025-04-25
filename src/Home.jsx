import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
  Clock
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
    revenue: 0
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
      
      // Completed orders count
      const completedOrdersQuery = query(
        collection(db, 'orders'),
        where('shopId', '==', user.uid),
        where('status', '==', 'completed')
      );
      const completedOrdersSnapshot = await getDocs(completedOrdersQuery);

      // Calculate revenue (example calculation)
      let totalRevenue = 0;
      completedOrdersSnapshot.forEach((doc) => {
        const orderData = doc.data();
        totalRevenue += orderData.totalAmount || 0;
      });
      
      setStats({
        products: productsSnapshot.size,
        pendingOrders: pendingOrdersSnapshot.size,
        completedOrders: completedOrdersSnapshot.size,
        revenue: totalRevenue
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const recentOrdersQuery = query(
        collection(db, 'orders'),
        where('shopId', '==', user.uid),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(recentOrdersQuery);
      
      const orders = [];
      snapshot.forEach(doc => {
        orders.push({ id: doc.id, ...doc.data() });
      });
      
      setRecentOrders(orders.slice(0, 3)); // Get only the 3 most recent orders
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
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
            <p className="stat-label">Orders to be processed</p>
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
            <Truck size={24} />
          </div>
          <div className="stat-content">
            <h3>Revenue</h3>
            <p className="stat-value">₹{loadingStats ? '...' : stats.revenue.toLocaleString()}</p>
            <p className="stat-label">Total earnings</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-main">
        <div className="dashboard-section">
          <h2 className="section-title">Quick Actions</h2>
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
        
        <div className="dashboard-section">
          <h2 className="section-title">Pending Orders</h2>
          {recentOrders.length > 0 ? (
            <div className="orders-list">
              {recentOrders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <h3>Order #{order.id.slice(-6)}</h3>
                    <span className="order-time">
                      <Clock size={14} />
                      {order.orderTime ? new Date(order.orderTime).toLocaleTimeString() : 'Pending'}
                    </span>
                  </div>
                  <div className="order-details">
                    <p><strong>Customer:</strong> {order.customerName}</p>
                    <p><strong>Items:</strong> {order.items?.length || 0}</p>
                    <p><strong>Total:</strong> ₹{order.totalAmount?.toLocaleString() || 0}</p>
                  </div>
                  <button 
                    onClick={() => navigate(`/orders/${order.id}`)}
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