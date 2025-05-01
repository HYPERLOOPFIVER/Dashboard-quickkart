import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from './Firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import ShopkeeperLayout from './ShopkeeperLayout';
import { toast } from 'react-toastify';
import './ManageProduct.css';
import { Link } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiShoppingBag } from 'react-icons/fi';

const ManageProducts = () => {
  const [user] = useAuthState(auth);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'products'),
        where('shopId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const productsData = [];
      querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() });
      });
      setProducts(productsData);
    } catch (error) {
      toast.error('Error fetching products: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        toast.error('Error deleting product: ' + error.message);
      }
    }
  };

  const openEditModal = async (productId) => {
    try {
      const docRef = doc(db, 'products', productId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCurrentProduct({ id: docSnap.id, ...docSnap.data() });
        setIsModalOpen(true);
      } else {
        toast.error('Product not found');
      }
    } catch (error) {
      toast.error('Error loading product: ' + error.message);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    // Implement your save logic here
    try {
      // Update product in Firestore
      toast.success('Product updated successfully');
      fetchProducts();
      closeModal();
    } catch (error) {
      toast.error('Error updating product: ' + error.message);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (

      <div className="manage-products-container">
        <div className="manage-products-header">
          <div className="header-title">
            <FiShoppingBag size={24} />
            <h1>Manage Products</h1>
          </div>
          <div className="header-actions">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Link to="/add-product" className="btn-primary">
              <FiPlus size={18} /> Add Product
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <FiShoppingBag size={48} />
            <h3>No products found</h3>
            <p>{searchTerm ? 'No matches for your search' : 'Add your first product to get started'}</p>
            <Link to="/add-product" className="btn-primary">
              <FiPlus size={18} /> Add Product
            </Link>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image-container">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="product-image" />
                  ) : (
                    <div className="image-placeholder">
                      <FiShoppingBag size={32} />
                    </div>
                  )}
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-description">{product.description?.substring(0, 60)}{product.description?.length > 60 ? '...' : ''}</p>
                  <div className="product-meta">
                    <span className="product-price">₹{product.price.toFixed(2)}</span>
                    <span className={`product-stock ${product.stock <= 5 ? 'low-stock' : ''}`}>
                      {product.stock} in stock
                    </span>
                  </div>
                </div>
                <div className="product-actions">
                  <button
                    onClick={() => openEditModal(product.id)}
                    className="btn-edit"
                  >
                    <FiEdit2 size={16} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="btn-delete"
                  >
                    <FiTrash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Product Modal */}
        {isModalOpen && currentProduct && (
          <div className="modal-overlay">
            <div className="edit-product-modal">
              <div className="modal-header">
                <h2>Edit Product</h2>
                <button onClick={closeModal} className="close-btn">
                  <FiX size={24} />
                </button>
              </div>
              <div className="modal-content">
                <form onSubmit={handleSave}>
                  <div className="form-group">
                    <label>Product Name</label>
                    <input
                      type="text"
                      value={currentProduct.name}
                      onChange={(e) => setCurrentProduct({...currentProduct, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={currentProduct.description || ''}
                      onChange={(e) => setCurrentProduct({...currentProduct, description: e.target.value})}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Price (rs)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={currentProduct.price}
                        onChange={(e) => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Stock</label>
                      <input
                        type="number"
                        min="0"
                        value={currentProduct.stock}
                        onChange={(e) => setCurrentProduct({...currentProduct, stock: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Image URL</label>
                    <input
                      type="text"
                      value={currentProduct.imageUrl || ''}
                      onChange={(e) => setCurrentProduct({...currentProduct, imageUrl: e.target.value})}
                    />
                    {currentProduct.imageUrl && (
                      <div className="image-preview">
                        <img src={currentProduct.imageUrl} alt="Preview" />
                      </div>
                    )}
                  </div>
                  <div className="modal-actions">
                    <button type="button" onClick={closeModal} className="btn-cancel">
                      Cancel
                    </button>
                    <button type="submit" className="btn-save">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    
  );
};

export default ManageProducts;