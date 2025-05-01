import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './Firebase';
import { getAuth } from 'firebase/auth';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  ShoppingBag, 
  User, 
  Calendar, 
  AlertCircle,
  Search,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import './Orders.css';

const ShopkeeperOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const auth = getAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const shopkeeperId = auth.currentUser?.uid;
        if (!shopkeeperId) {
          setError("You must be logged in to view orders");
          setLoading(false);
          return;
        }

        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("shopkeeperId", "==", shopkeeperId));
        const querySnapshot = await getDocs(q);
        
        const fetchedOrders = [];
        querySnapshot.forEach((doc) => {
          // Convert Firebase timestamps to JS Date objects
          const data = doc.data();
          const createdAt = data.createdAt?.toDate?.() || new Date();
          
          fetchedOrders.push({ 
            id: doc.id, 
            ...data,
            createdAt: createdAt
          });
        });
        
        // Sort orders by date (newest first)
        fetchedOrders.sort((a, b) => b.createdAt - a.createdAt);
        
        setOrders(fetchedOrders);
      } catch (err) {
        console.error("Error fetching orders: ", err);
        setError("Failed to load orders. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      
      let updateData = {
        status: newStatus,
      };
      
      // Add timestamp based on status
      if (newStatus === "processing") {
        updateData.processingAt = new Date();
      } else if (newStatus === "shipped") {
        updateData.shippedAt = new Date();
      } else if (newStatus === "delivered") {
        updateData.deliveredAt = new Date();
      }
      
      await updateDoc(orderRef, updateData);
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, ...updateData } 
          : order
      ));
      
      // If we're viewing the order details, update selected order as well
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus, ...updateData }));
      }
      
      // Show toast notification
      showToast(`Order status updated to ${newStatus}`);
    } catch (err) {
      console.error(`Error updating order status to ${newStatus}: `, err);
      showToast(`Failed to update order status`, 'error');
    }
  };

  const confirmCashReceived = async (orderId) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        paymentStatus: "paid",
        cashReceivedAt: new Date()
      });
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, paymentStatus: "paid", cashReceivedAt: new Date() } 
          : order
      ));
      
      // If we're viewing the order details, update selected order as well
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ 
          ...prev, 
          paymentStatus: "paid", 
          cashReceivedAt: new Date() 
        }));
      }
      
      showToast("Cash payment confirmed successfully");
    } catch (err) {
      console.error("Error confirming cash payment: ", err);
      showToast("Failed to confirm cash payment", 'error');
    }
  };

  const viewOrderDetails = async (order) => {
    // For order details, we might want to get the latest data from Firestore
    try {
      const orderRef = doc(db, "orders", order.id);
      const orderSnap = await getDoc(orderRef);
      
      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        // Convert timestamps to Date objects
        const processedData = {
          ...orderData,
          id: orderSnap.id,
          createdAt: orderData.createdAt?.toDate?.() || new Date(),
          processingAt: orderData.processingAt?.toDate?.(),
          shippedAt: orderData.shippedAt?.toDate?.(),
          deliveredAt: orderData.deliveredAt?.toDate?.(),
          paidAt: orderData.paidAt?.toDate?.(),
          cashReceivedAt: orderData.cashReceivedAt?.toDate?.()
        };
        setSelectedOrder(processedData);
      } else {
        setSelectedOrder(order);
      }
    } catch (err) {
      console.error("Error fetching order details: ", err);
      setSelectedOrder(order);
    }
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  const getFilteredOrders = () => {
    if (!orders) return [];
    
    return orders.filter(order => {
      // Apply status filter
      const statusMatch = filterStatus === 'all' || order.status === filterStatus;
      
      // Apply search filter if there's a search term
      const searchMatch = !searchTerm || 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.customerPhone && order.customerPhone.includes(searchTerm));
      
      return statusMatch && searchMatch;
    });
  };

  const filteredOrders = getFilteredOrders();
  
  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending':
        return <Clock size={16} />;
      case 'processing':
        return <Package size={16} />;
      case 'shipped':
        return <Truck size={16} />;
      case 'delivered':
        return <CheckCircle size={16} />;
      case 'canceled':
        return <XCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getDeliveryAddress = (order) => {
    if (order?.deliveryAddress) {
      return order.deliveryAddress;
    } else if (order?.shippingAddress) {
      return order.shippingAddress;
    }
    return { name: 'N/A', address: 'N/A' };
  };

  if (loading) {
    return (
      <div className="orders-loading-container">
        <div className="loading-spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="orders-error-container">
        <AlertCircle size={48} />
        <h2>Oops!</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }
  
  if (orders.length === 0) {
    return (
      <div className="orders-empty-container">
        <ShoppingBag size={48} />
        <h2>No Orders Yet</h2>
        <p>You haven't received any orders yet.</p>
      </div>
    );
  }

  return (
    <div className="shopkeeper-orders-container">
      <div className="orders-header">
        <div className="header-title">
          <h1>Manage Orders</h1>
          <p>{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found</p>
        </div>
        
        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by order ID or customer name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="filter-toolbar">
        <div className="status-filters">
          <button 
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'processing' ? 'active' : ''}`}
            onClick={() => setFilterStatus('processing')}
          >
            Processing
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'shipped' ? 'active' : ''}`}
            onClick={() => setFilterStatus('shipped')}
          >
            Shipped
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'delivered' ? 'active' : ''}`}
            onClick={() => setFilterStatus('delivered')}
          >
            Delivered
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'canceled' ? 'active' : ''}`}
            onClick={() => setFilterStatus('canceled')}
          >
            Canceled
          </button>
        </div>
      </div>
      
      <div className="orders-list">
        {filteredOrders.length === 0 ? (
          <div className="empty-filtered-results">
            <AlertCircle size={24} />
            <p>No orders match your current filters</p>
            <button onClick={() => setFilterStatus('all')}>Clear Filters</button>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className={`order-card ${order.status}`}
              onClick={() => viewOrderDetails(order)}
            >
              <div className="order-card-header">
                <div className="order-id">#{order.id.slice(-6)}</div>
                <div className={`order-status ${order.status}`}>
                  {getStatusIcon(order.status)}
                  <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                </div>
              </div>
              
              <div className="order-info-grid">
                <div className="order-info-item">
                  <Calendar size={14} />
                  <div>
                    <div className="info-label">Order Date</div>
                    <div className="info-value">{formatDate(order.createdAt)}</div>
                  </div>
                </div>
                
                <div className="order-info-item">
                  <User size={14} />
                  <div>
                    <div className="info-label">Customer</div>
                    <div className="info-value">{order.customerName || 'Customer'}</div>
                  </div>
                </div>
                
                <div className="order-info-item">
                  <Package size={14} />
                  <div>
                    <div className="info-label">Items</div>
                    <div className="info-value">{order.items?.length || 0} items</div>
                  </div>
                </div>
                
                <div className="order-info-item">
                  <DollarSign size={14} />
                  <div>
                    <div className="info-label">Total</div>
                    <div className="info-value">{formatCurrency(order.totalAmount || 0)}</div>
                  </div>
                </div>
              </div>
              
              <div className="order-card-footer">
                <div className={`payment-status ${order.paymentStatus}`}>
                  {order.paymentStatus === 'paid' ? 'Payment paid' : `Payment: ${order.paymentStatus}`}
                </div>
                <div className="order-details-link">
                  View Details <ChevronRight size={16} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedOrder && (
        <div className="order-details-modal">
          <div className="modal-content">
            <div className="modal-header">
              <button className="back-button" onClick={closeOrderDetails}>
                <ArrowLeft size={20} />
              </button>
              <h2>Order #{selectedOrder.id.slice(-6)}</h2>
              <div className={`order-status-badge ${selectedOrder.status}`}>
                {getStatusIcon(selectedOrder.status)}
                <span>{selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}</span>
              </div>
            </div>
            
            {selectedOrder.status === 'canceled' ? (
              <div className="order-canceled-banner">
                <XCircle size={24} />
                <h3>Order Cancelled</h3>
              </div>
            ) : (
              <div className="order-timeline">
                <div className={`timeline-step ${selectedOrder.status !== 'canceled' ? 'active' : 'canceled'}`}>
                  <div className="timeline-icon">
                    <Clock size={16} />
                  </div>
                  <div className="timeline-content">
                    <p className="timeline-title">Order Placed</p>
                    <p className="timeline-time">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                </div>
                
                <div className={`timeline-step ${selectedOrder.status === 'processing' || selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered' ? 'active' : ''}`}>
                  <div className="timeline-icon">
                    <Package size={16} />
                  </div>
                  <div className="timeline-content">
                    <p className="timeline-title">Processing</p>
                    <p className="timeline-time">{selectedOrder.processingAt ? formatDate(selectedOrder.processingAt) : '-'}</p>
                  </div>
                </div>
                
                <div className={`timeline-step ${selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered' ? 'active' : ''}`}>
                  <div className="timeline-icon">
                    <Truck size={16} />
                  </div>
                  <div className="timeline-content">
                    <p className="timeline-title">Shipped</p>
                    <p className="timeline-time">{selectedOrder.shippedAt ? formatDate(selectedOrder.shippedAt) : '-'}</p>
                  </div>
                </div>
                
                <div className={`timeline-step ${selectedOrder.status === 'delivered' ? 'active' : ''}`}>
                  <div className="timeline-icon">
                    <CheckCircle size={16} />
                  </div>
                  <div className="timeline-content">
                    <p className="timeline-title">Delivered</p>
                    <p className="timeline-time">{selectedOrder.deliveredAt ? formatDate(selectedOrder.deliveredAt) : '-'}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="order-details-grid">
              <div className="details-section customer-section">
                <h3>Customer Details</h3>
                <div className="detail-item">
                  <User size={16} />
                  <div>
                    <p className="detail-label">Name</p>
                    <p className="detail-value">{selectedOrder.customerName || 'N/A'}</p>
                  </div>
                </div>
                
                {selectedOrder.customerPhone && (
                  <div className="detail-item">
                    <User size={16} />
                    <div>
                      <p className="detail-label">Phone</p>
                      <p className="detail-value">{selectedOrder.customerPhone}</p>
                    </div>
                  </div>
                )}
                
                {selectedOrder.customerEmail && (
                  <div className="detail-item">
                    <User size={16} />
                    <div>
                      <p className="detail-label">Email</p>
                      <p className="detail-value">{selectedOrder.customerEmail}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="details-section payment-section">
                <h3>Payment Details</h3>
                <div className="detail-item">
                  <DollarSign size={16} />
                  <div>
                    <p className="detail-label">Method</p>
                    <p className="detail-value">{selectedOrder.paymentMethod || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="detail-item">
                  <DollarSign size={16} />
                  <div>
                    <p className="detail-label">Status</p>
                    <p className={`detail-value payment-${selectedOrder.paymentStatus}`}>
                      {selectedOrder.paymentStatus?.charAt(0).toUpperCase() + selectedOrder.paymentStatus?.slice(1) || 'N/A'}
                    </p>
                  </div>
                </div>
                
                {selectedOrder.paidAt && (
                  <div className="detail-item">
                    <Calendar size={16} />
                    <div>
                      <p className="detail-label">Payment Date</p>
                      <p className="detail-value">{formatDate(selectedOrder.paidAt)}</p>
                    </div>
                  </div>
                )}
                
                {selectedOrder.cashReceivedAt && (
                  <div className="detail-item">
                    <CheckCircle size={16} />
                    <div>
                      <p className="detail-label">Cash Received</p>
                      <p className="detail-value">{formatDate(selectedOrder.cashReceivedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="details-section address-section">
              <h3>Delivery Address</h3>
              <div className="address-card">
                {(() => {
                  const address = getDeliveryAddress(selectedOrder);
                  return (
                    <>
                      <p className="address-name">{address.name}</p>
                      <p className="address-line">{address.street || address.address || 'N/A'}</p>
                      {address.city && (
                        <p className="address-line">{`${address.city}, ${address.state || ''} ${address.zip || ''}`}</p>
                      )}
                      {address.phone && <p className="address-phone">Phone: {address.phone}</p>}
                    </>
                  );
                })()}
              </div>
            </div>
            
            <div className="order-items-section">
              <h3>Order Items</h3>
              <div className="order-items-list">
                {selectedOrder.items && selectedOrder.items.map((item, index) => (
                  <div key={index} className="order-item-card">
                    <div className="item-image">
                      <img src={item.imageUrl || "/placeholder-product.jpg"} alt={item.name} />
                    </div>
                    <div className="item-details">
                      <h4>{item.name}</h4>
                      {item.sku && <p className="item-sku">SKU: {item.sku}</p>}
                      <div className="item-price-qty">
                        <span className="item-price">{formatCurrency(item.price)}</span>
                        <span className="item-qty">x {item.quantity}</span>
                      </div>
                    </div>
                    <div className="item-subtotal">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="order-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal || 0)}</span>
                </div>
                
                {selectedOrder.tax > 0 && (
                  <div className="summary-row">
                    <span>Tax</span>
                    <span>{formatCurrency(selectedOrder.tax)}</span>
                  </div>
                )}
                
                {selectedOrder.shippingCost > 0 && (
                  <div className="summary-row">
                    <span>Delivery Fee</span>
                    <span>{formatCurrency(selectedOrder.shippingCost)}</span>
                  </div>
                )}
                
                {selectedOrder.discount > 0 && (
                  <div className="summary-row discount">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                
                <div className="summary-row total">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.totalAmount || 0)}</span>
                </div>
              </div>
            </div>
            
            {selectedOrder.notes && (
              <div className="notes-section">
                <h3>Order Notes</h3>
                <p>{selectedOrder.notes}</p>
              </div>
            )}
            
            <div className="modal-actions">
              {selectedOrder.status === "pending" && (
                <button 
                  className="action-button process"
                  onClick={() => updateOrderStatus(selectedOrder.id, "processing")}
                >
                  <Package size={16} />
                  Process Order
                </button>
              )}
              
              {selectedOrder.status === "processing" && (
                <button 
                  className="action-button ship"
                  onClick={() => updateOrderStatus(selectedOrder.id, "shipped")}
                >
                  <Truck size={16} />
                  Mark as Shipped
                </button>
              )}
              
              {selectedOrder.status === "shipped" && (
                <button 
                  className="action-button deliver"
                  onClick={() => updateOrderStatus(selectedOrder.id, "delivered")}
                >
                  <CheckCircle size={16} />
                  Mark as Delivered
                </button>
              )}
              
              {selectedOrder.paymentMethod === "cash" && 
               selectedOrder.paymentStatus !== "paid" && (
                <button 
                  className="action-button cash"
                  onClick={() => confirmCashReceived(selectedOrder.id)}
                >
                  <DollarSign size={16} />
                  Confirm Cash Received
                </button>
              )}
              
              {selectedOrder.status !== "canceled" && selectedOrder.status !== "delivered" && (
                <button 
                  className="action-button cancel"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to cancel this order?")) {
                      updateOrderStatus(selectedOrder.id, "canceled");
                    }
                  }}
                >
                  <XCircle size={16} />
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopkeeperOrders;