import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from './Firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import ShopkeeperLayout from './ShopkeeperLayout';
import { toast } from 'react-toastify';

const AddProduct = () => {
  const [user] = useAuthState(auth);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, 'products'), {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        shopId: user.uid,
        createdAt: new Date(),
        isActive: true
      });
      toast.success('Product added successfully!');
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        imageUrl: ''
      });
    } catch (error) {
      toast.error('Error adding product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ShopkeeperLayout>
      <div className="add-product">
        <h3>Add New Product</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Price ($)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
              />
            </div>
            <div className="form-group">
              <label>Stock Quantity</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="groceries">Groceries</option>
              <option value="furniture">Furniture</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Image URL</label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Adding Product...' : 'Add Product'}
          </button>
        </form>
      </div>
    </ShopkeeperLayout>
  );
};

export default AddProduct;