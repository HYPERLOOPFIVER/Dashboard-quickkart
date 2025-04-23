import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from './Firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import './Home.css'
const Home = () => {
  const navigate = useNavigate();
  const [user, loadingAuth] = useAuthState(auth);
  const [shopData, setShopData] = useState(null);
  const [stats, setStats] = useState({
    products: 0,
    pendingOrders: 0,
    completedOrders: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loadingAuth && !user) {
      navigate('/auth');
    } else if (user) {
      fetchShopData();
      fetchStats();
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
      
      setStats({
        products: productsSnapshot.size,
        pendingOrders: pendingOrdersSnapshot.size,
        completedOrders: completedOrdersSnapshot.size
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loadingAuth) {
    return <div className="dashboard">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <h1>Welcome, {shopData?.ownerName || 'Shopkeeper'}</h1>
        <p className="shop-name">{shopData?.shopName}</p>
        
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Products</h3>
            <p>{loadingStats ? '...' : stats.products}</p>
          </div>
          
          <div className="stat-card">
            <h3>Pending Orders</h3>
            <p>{loadingStats ? '...' : stats.pendingOrders}</p>
          </div>
          
          <div className="stat-card">
            <h3>Completed Orders</h3>
            <p>{loadingStats ? '...' : stats.completedOrders}</p>
          </div>
        </div>
        
        <div className="action-buttons">
          <button 
            onClick={() => navigate('/add-product')}
            className="action-btn"
          >
            Add New Product
          </button>
          
          <button 
            onClick={() => navigate('/products')}
            className="action-btn"
          >
            Manage Products
          </button>
          
          <button 
            onClick={() => navigate('/orders')}
            className="action-btn"
          >
            View Orders
          </button>
          
          <button 
            onClick={() => navigate('/profile')}
            className="action-btn"
          >
            Shop Profile
          </button>
        </div>
        
        {/* Recent activity or quick stats can be added here */}
        <div className="recent-activity">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <button onClick={() => navigate('/orders?status=pending')}>
              Process Pending Orders ({stats.pendingOrders})
            </button>
            {stats.products < 5 && (
              <button 
                onClick={() => navigate('/add-product')}
                className="highlight"
              >
                Add More Products (Low Inventory)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;