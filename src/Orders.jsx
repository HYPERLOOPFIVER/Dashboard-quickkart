import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from './Firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import ShopkeeperLayout from './ShopkeeperLayout';
import { toast } from 'react-toastify';

const Orders = () => {
  const [user] = useAuthState(auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let q;
      if (filter === 'all') {
        q = query(
          collection(db, 'orders'),
          where('shopId', '==', user.uid)
        );
      } else {
        q = query(
          collection(db, 'orders'),
          where('shopId', '==', user.uid),
          where('status', '==', filter)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const ordersData = [];
      querySnapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() });
      });
      setOrders(ordersData);
    } catch (error) {
      toast.error('Error fetching orders: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        updatedAt: new Date()
      });
      toast.success(`Order marked as ${status}`);
      fetchOrders();
    } catch (error) {
      toast.error('Error updating order: ' + error.message);
    }
  };

  return (
    <ShopkeeperLayout>
      <div className="orders-page">
        <div className="header-row">
          <h3>Manage Orders</h3>
          <div className="filter-tabs">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All Orders
            </button>
            <button
              className={filter === 'pending' ? 'active' : ''}
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
            <button
              className={filter === 'completed' ? 'active' : ''}
              onClick={() => setFilter('completed')}
            >
              Completed
            </button>
          </div>
        </div>

        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p>No orders found</p>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <span>Order #{order.id.slice(0, 8)}</span>
                  <span className={`status ${order.status}`}>
                    {order.status}
                  </span>
                </div>
                <div className="order-details">
                  <p>Customer: {order.customerName}</p>
                  <p>Items: {order.items.length}</p>
                  <p>Total: ${order.totalAmount.toFixed(2)}</p>
                  <p>Date: {new Date(order.createdAt?.seconds * 1000).toLocaleString()}</p>
                </div>
                <div className="order-actions">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="btn-complete"
                    >
                      Mark as Completed
                    </button>
                  )}
                  <button className="btn-view">View Details</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ShopkeeperLayout>
  );
};

export default Orders;