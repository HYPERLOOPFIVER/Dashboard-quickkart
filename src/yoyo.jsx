import React, { useState, useEffect } from "react";
import { 
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc, 
  query, where, getDoc, setDoc, serverTimestamp 
} from "firebase/firestore";
import { 
  getAuth, createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, onAuthStateChanged, signOut 
} from "firebase/auth";
import { db } from "./firebase";

function ShopkeeperHome() {
  // Authentication state
  const [authUser, setAuthUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  // Authentication form states
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    shopName: "",
    ownerName: "",
    phone: "",
    address: "",
    city: "",
  });

  // Shop data state
  const [shopData, setShopData] = useState(null);
  
  // Existing states from previous implementation
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderTimers, setOrderTimers] = useState({});

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    quantity: "",
    description: "",
    category: "",
    image: "",
  });

  // Initialize auth
  const auth = getAuth();

  // Check auth state on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthUser(user);
        await fetchShopData(user.uid);
      } else {
        setAuthUser(null);
        setShopData(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);
  const renderEditProductModal = () => {
    if (!isEditProductModalOpen || !selectedProduct) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Edit Product</h2>
            <button className="close-button" onClick={() => setIsEditProductModalOpen(false)}>×</button>
          </div>
          <form onSubmit={handleUpdateProduct}>
            <div className="form-group">
              <label htmlFor="edit-name">Product Name</label>
              <input
                type="text"
                id="edit-name"
                value={selectedProduct.name}
                onChange={(e) => setSelectedProduct({...selectedProduct, name: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="edit-price">Price</label>
              <input
                type="number"
                id="edit-price"
                min="0"
                step="0.01"
                value={selectedProduct.price}
                onChange={(e) => setSelectedProduct({...selectedProduct, price: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="edit-quantity">Quantity</label>
              <input
                type="number"
                id="edit-quantity"
                min="0"
                value={selectedProduct.quantity}
                onChange={(e) => setSelectedProduct({...selectedProduct, quantity: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="edit-description">Description</label>
              <textarea
                id="edit-description"
                value={selectedProduct.description}
                onChange={(e) => setSelectedProduct({...selectedProduct, description: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="edit-category">Category</label>
              <input
                type="text"
                id="edit-category"
                value={selectedProduct.category}
                onChange={(e) => setSelectedProduct({...selectedProduct, category: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="edit-image">Image URL</label>
              <input
                type="text"
                id="edit-image"
                value={selectedProduct.image}
                onChange={(e) => setSelectedProduct({...selectedProduct, image: e.target.value})}
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn primary">Update Product</button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setIsEditProductModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
 const handleAddProduct = async (e) => {
    e.preventDefault();
    
    try {
      await addDoc(collection(db, "products"), {
        ...newProduct,
        price: parseFloat(newProduct.price),
        quantity: parseInt(newProduct.quantity),
        shopId: shopId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      setNewProduct({
        name: "",
        price: "",
        quantity: "",
        description: "",
        category: "",
        image: "",
      });
      
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };
  // Render Order Details Modal
  const renderOrderDetailsModal = () => {
    if (!isOrderDetailsModalOpen || !selectedOrder) return null;
    
    const remainingTime = getRemainingTime(selectedOrder.createdAt);
    
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Order Details</h2>
            <button className="close-button" onClick={() => setIsOrderDetailsModalOpen(false)}>×</button>
          </div>
          
          <div className="order-details">
            <p><strong>Order ID:</strong> {selectedOrder.id}</p>
            <p><strong>Customer:</strong> {selectedOrder.customerName}</p>
            <p><strong>Status:</strong> <span className={`status-${selectedOrder.status}`}>{selectedOrder.status}</span></p>
            <p><strong>Date:</strong> {selectedOrder.createdAt?.toDate().toLocaleString() || "N/A"}</p>
            
            {selectedOrder.status === "pending" && (
              <div className="timer-container">
                <p><strong>Time Remaining:</strong> {remainingTime} seconds</p>
                <div className="progress-bar">
                  <div className="progress" style={{ width: `${(remainingTime / 40) * 100}%` }}></div>
                </div>
              </div>
            )}
            
            <h3>Items</h3>
            <table className="order-items">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((item) => (
                  <tr key={item.productId}>
                    <td>{item.name}</td>
                    <td>${parseFloat(item.price).toFixed(2)}</td>
                    <td>{item.quantity}</td>
                    <td>${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="text-right"><strong>Total:</strong></td>
                  <td><strong>${selectedOrder.totalAmount.toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
            
            <div className="delivery-address">
              <h3>Delivery Information</h3>
              <p>{selectedOrder.address}</p>
              <p>Phone: {selectedOrder.phone}</p>
            </div>
            
            {selectedOrder.status === "pending" && (
              <div className="form-actions">
                <button 
                  className="btn primary" 
                  onClick={() => handleConfirmOrder(selectedOrder.id)}
                >
                  Accept Order
                </button>
                <button 
                  className="btn danger" 
                  onClick={() => handleCancelOrder(selectedOrder.id)}
                >
                  Reject Order
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  
  
  const getRemainingTime = (createdAt) => {
    const orderTime = createdAt?.toDate() || new Date();
    const timeElapsed = (new Date() - orderTime) / 1000;
    return Math.max(40 - timeElapsed, 0);
  };
  
  // Fetch shop data when authenticated
  const fetchShopData = async (userId) => {
    try {
      const docRef = doc(db, "shopkeepers", userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setShopData(docSnap.data());
      } else {
        console.log("No shop data found!");
      }
    } catch (error) {
      console.error("Error fetching shop data:", error);
    }
  };

  // Fetch products and orders when shop data is available
  useEffect(() => {
    if (shopData) {
      fetchProducts();
      fetchOrders();
      fetchOrderHistory();
    }
  }, [shopData]);

  // Watch for new orders
  useEffect(() => {
    const checkNewOrders = setInterval(() => {
      if (shopData) {
        fetchOrders();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkNewOrders);
  }, [shopData]);

  // Manage order timers (same as before)
  useEffect(() => {
    const timers = {};
    orders.forEach((order) => {
      if (!orderTimers[order.id] && order.status === "pending") {
        const orderTime = order.createdAt?.toDate() || new Date();
        const timeElapsed = (new Date() - orderTime) / 1000;
        
        if (timeElapsed < 40) {
          const remainingTime = 40 - timeElapsed;
          timers[order.id] = setTimeout(() => {
            handleOrderTimeout(order.id);
          }, remainingTime * 1000);
        } else {
          handleOrderTimeout(order.id);
        }
      }
    });

    return () => {
      Object.values(orderTimers).forEach((timer) => clearTimeout(timer));
    };
  }, [orders]);

  // Handle shopkeeper signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError(null);

    if (signupForm.password !== signupForm.confirmPassword) {
      setAuthError("Passwords don't match");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        signupForm.email,
        signupForm.password
      );

      // Create shopkeeper document in Firestore
      await setDoc(doc(db, "shopkeepers", userCredential.user.uid), {
        email: signupForm.email,
        shopName: signupForm.shopName,
        ownerName: signupForm.ownerName,
        phone: signupForm.phone,
        address: signupForm.address,
        city: signupForm.city,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Close signup modal and reset form
      setIsSignupModalOpen(false);
      setSignupForm({
        email: "",
        password: "",
        confirmPassword: "",
        shopName: "",
        ownerName: "",
        phone: "",
        address: "",
        city: "",
      });
    } catch (error) {
      setAuthError(error.message);
    }
  };

  // Handle shopkeeper login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError(null);

    try {
      await signInWithEmailAndPassword(
        auth,
        loginForm.email,
        loginForm.password
      );
      
      // Close login modal and reset form
      setIsLoginModalOpen(false);
      setLoginForm({ email: "", password: "" });
    } catch (error) {
      setAuthError(error.message);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Update shop profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      await updateDoc(doc(db, "shopkeepers", authUser.uid), {
        shopName: shopData.shopName,
        ownerName: shopData.ownerName,
        phone: shopData.phone,
        address: shopData.address,
        city: shopData.city,
        updatedAt: serverTimestamp(),
      });
      
      setIsProfileModalOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };
  const renderAddProductModal = () => {
    if (!isProductModalOpen) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Add New Product</h2>
            <button className="close-button" onClick={() => setIsProductModalOpen(false)}>×</button>
          </div>
          <form onSubmit={handleAddProduct}>
            <div className="form-group">
              <label htmlFor="name">Product Name</label>
              <input
                type="text"
                id="name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="price">Price</label>
              <input
                type="number"
                id="price"
                min="0"
                step="0.01"
                value={newProduct.price}
                onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="quantity">Quantity</label>
              <input
                type="number"
                id="quantity"
                min="0"
                value={newProduct.quantity}
                onChange={(e) => setNewProduct({...newProduct, quantity: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <input
                type="text"
                id="category"
                value={newProduct.category}
                onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="image">Image URL</label>
              <input
                type="text"
                id="image"
                value={newProduct.image}
                onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn primary">Add Product</button>
              <button type="button" className="btn secondary" onClick={() => setIsProductModalOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Fetch products from Firestore (updated to use shopData)
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "products"), where("shopId", "==", authUser.uid));
      const querySnapshot = await getDocs(q);
      
      const productsData = [];
      querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() });
      });
      
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending orders (updated to use shopData)
  const fetchOrders = async () => {
    try {
      const q = query(
        collection(db, "orders"),
        where("shopId", "==", authUser.uid),
        where("status", "==", "pending")
      );
      
      const querySnapshot = await getDocs(q);
      const ordersData = [];
      querySnapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() });
      });
      
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // Fetch order history (updated to use shopData)
  const fetchOrderHistory = async () => {
    try {
      const q = query(
        collection(db, "orders"),
        where("shopId", "==", authUser.uid),
        where("status", "in", ["completed", "cancelled"])
      );
      
      const querySnapshot = await getDocs(q);
      const historyData = [];
      querySnapshot.forEach((doc) => {
        historyData.push({ id: doc.id, ...doc.data() });
      });
      
      setOrderHistory(historyData);
    } catch (error) {
      console.error("Error fetching order history:", error);
    }
  };

  // Rest of the functions (handleOrderTimeout, handleAddProduct, handleUpdateProduct, 
  // handleDeleteProduct, handleConfirmOrder, handleCancelOrder, getRemainingTime) 
  // remain the same as in your original code, just update any references from shopId to authUser.uid

  // Render Login Modal
  const renderLoginModal = () => {
    if (!isLoginModalOpen) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Shopkeeper Login</h2>
            <button className="close-button" onClick={() => setIsLoginModalOpen(false)}>×</button>
          </div>
          <form onSubmit={handleLogin}>
            {authError && <div className="error-message">{authError}</div>}
            
            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <input
                type="email"
                id="login-email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                type="password"
                id="login-password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                required
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn primary">Login</button>
              <button 
                type="button" 
                className="btn secondary" 
                onClick={() => {
                  setIsLoginModalOpen(false);
                  setIsSignupModalOpen(true);
                }}
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Render Signup Modal
  const renderSignupModal = () => {
    if (!isSignupModalOpen) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Shopkeeper Signup</h2>
            <button className="close-button" onClick={() => setIsSignupModalOpen(false)}>×</button>
          </div>
          <form onSubmit={handleSignup}>
            {authError && <div className="error-message">{authError}</div>}
            
            <div className="form-group">
              <label htmlFor="signup-email">Email</label>
              <input
                type="email"
                id="signup-email"
                value={signupForm.email}
                onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <input
                type="password"
                id="signup-password"
                value={signupForm.password}
                onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="signup-confirm-password">Confirm Password</label>
              <input
                type="password"
                id="signup-confirm-password"
                value={signupForm.confirmPassword}
                onChange={(e) => setSignupForm({...signupForm, confirmPassword: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="signup-shop-name">Shop Name</label>
              <input
                type="text"
                id="signup-shop-name"
                value={signupForm.shopName}
                onChange={(e) => setSignupForm({...signupForm, shopName: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="signup-owner-name">Owner Name</label>
              <input
                type="text"
                id="signup-owner-name"
                value={signupForm.ownerName}
                onChange={(e) => setSignupForm({...signupForm, ownerName: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="signup-phone">Phone Number</label>
              <input
                type="tel"
                id="signup-phone"
                value={signupForm.phone}
                onChange={(e) => setSignupForm({...signupForm, phone: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="signup-address">Address</label>
              <input
                type="text"
                id="signup-address"
                value={signupForm.address}
                onChange={(e) => setSignupForm({...signupForm, address: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="signup-city">City</label>
              <input
                type="text"
                id="signup-city"
                value={signupForm.city}
                onChange={(e) => setSignupForm({...signupForm, city: e.target.value})}
                required
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn primary">Sign Up</button>
              <button 
                type="button" 
                className="btn secondary" 
                onClick={() => {
                  setIsSignupModalOpen(false);
                  setIsLoginModalOpen(true);
                }}
              >
                Already have an account? Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Render Profile Modal
  const renderProfileModal = () => {
    if (!isProfileModalOpen || !shopData) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Shop Profile</h2>
            <button className="close-button" onClick={() => setIsProfileModalOpen(false)}>×</button>
          </div>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label htmlFor="profile-shop-name">Shop Name</label>
              <input
                type="text"
                id="profile-shop-name"
                value={shopData.shopName}
                onChange={(e) => setShopData({...shopData, shopName: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="profile-owner-name">Owner Name</label>
              <input
                type="text"
                id="profile-owner-name"
                value={shopData.ownerName}
                onChange={(e) => setShopData({...shopData, ownerName: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="profile-email">Email</label>
              <input
                type="email"
                id="profile-email"
                value={authUser.email}
                disabled
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="profile-phone">Phone Number</label>
              <input
                type="tel"
                id="profile-phone"
                value={shopData.phone}
                onChange={(e) => setShopData({...shopData, phone: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="profile-address">Address</label>
              <input
                type="text"
                id="profile-address"
                value={shopData.address}
                onChange={(e) => setShopData({...shopData, address: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="profile-city">City</label>
              <input
                type="text"
                id="profile-city"
                value={shopData.city}
                onChange={(e) => setShopData({...shopData, city: e.target.value})}
                required
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn primary">Update Profile</button>
              <button 
                type="button" 
                className="btn secondary" 
                onClick={() => setIsProfileModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Render the rest of the modals (Add Product, Edit Product, Order Details) 
  // same as before, just update any references from shopId to authUser.uid

  // Render dashboard content
  if (loadingAuth) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!authUser) {
    return (
      <div className="auth-container">
        <div className="auth-content">
          <h1>Shopkeeper Portal</h1>
          <p>Manage your shop inventory and orders in one place</p>
          <div className="auth-buttons">
            <button 
              className="btn primary" 
              onClick={() => setIsLoginModalOpen(true)}
            >
              Login
            </button>
            <button 
              className="btn secondary" 
              onClick={() => setIsSignupModalOpen(true)}
            >
              Create Account
            </button>
          </div>
        </div>
        
        {renderLoginModal()}
        {renderSignupModal()}
      </div>
    );
  }

  return (
    <div className="shopkeeper-dashboard">
      <header className="dashboard-header">
        <div className="shop-info">
          <h1>{shopData?.shopName || "Shop Dashboard"}</h1>
          <p>{shopData?.address}, {shopData?.city}</p>
        </div>
        
        <div className="user-actions">
          <button 
            className="btn secondary" 
            onClick={() => setIsProfileModalOpen(true)}
          >
            My Profile
          </button>
          <button className="btn danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* New Orders Section */}
        <section className="orders-section">
          <div className="section-header">
            <h2>Pending Orders ({orders.length})</h2>
          </div>
          
          {loading ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="no-data">No new orders at the moment.</p>
          ) : (
            <div className="orders-grid">
              {orders.map((order) => {
                const remainingTime = getRemainingTime(order.createdAt);
                
                return (
                  <div key={order.id} className="order-card">
                    {/* Order card content same as before */}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Products Section */}
        <section className="products-section">
          <div className="section-header">
            <h2>Your Products ({products.length})</h2>
            <button 
              className="btn primary" 
              onClick={() => setIsProductModalOpen(true)}
            >
              Add New Product
            </button>
          </div>
          
          {loading ? (
            <p>Loading products...</p>
          ) : products.length === 0 ? (
            <p className="no-data">No products added yet. Click "Add New Product" to get started.</p>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <div key={product.id} className="product-card">
                  {/* Product card content same as before */}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Order History Section */}
        <section className="order-history-section">
          <div className="section-header">
            <h2>Order History</h2>
          </div>
          
          {loading ? (
            <p>Loading order history...</p>
          ) : orderHistory.length === 0 ? (
            <p className="no-data">No order history available.</p>
          ) : (
            <table className="order-history-table">
              {/* Order history table same as before */}
            </table>
          )}
        </section>
      </div>

      {/* Render all modals */}
      {renderLoginModal()}
      {renderSignupModal()}
      {renderProfileModal()}
      {renderAddProductModal()}
      {renderEditProductModal()}
      {renderOrderDetailsModal()}
    </div>
  );
}

export default ShopkeeperHome;