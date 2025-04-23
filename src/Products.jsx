import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from './Firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import ShopkeeperLayout from './ShopkeeperLayout';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const ManageProducts = () => {
  const [user] = useAuthState(auth);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <ShopkeeperLayout>
      <div className="manage-products">
        <div className="header-row">
          <h3>Manage Products</h3>
          <Link to="/add-product" className="btn-primary">
            Add New Product
          </Link>
        </div>
        
        {loading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p>No products found. Add your first product!</p>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.id} className="product-card">
                {product.imageUrl && (
                  <img src={product.imageUrl} alt={product.name} className="product-image" />
                )}
                <div className="product-details">
                  <h4>{product.name}</h4>
                  <p>${product.price.toFixed(2)}</p>
                  <p>Stock: {product.stock}</p>
                  <div className="product-actions">
                    <Link
                      to={`/edit-product/${product.id}`}
                      className="btn-edit"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ShopkeeperLayout>
  );
};

export default ManageProducts;