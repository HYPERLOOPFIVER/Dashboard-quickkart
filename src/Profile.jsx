import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from './Firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import ShopkeeperLayout from './ShopkeeperLayout';
import { toast } from 'react-toastify';
import './Profile.css'; // Add your CSS styles here
const Profile = () => {
  const [user] = useAuthState(auth);
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    ownerName: '',
    shopName: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: ''
    },
    gstNumber: '',
    shopCategory: ''
  });

  useEffect(() => {
    if (user) {
      fetchShopData();
    }
  }, [user]);

  const fetchShopData = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'shopkeepers', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setShopData(data);
        setFormData({
          ownerName: data.ownerName || '',
          shopName: data.shopName || '',
          phone: data.phone || '',
          address: data.address || {
            street: '', city: '', state: '', zip: '', country: ''
          },
          gstNumber: data.gstNumber || '',
          shopCategory: data.shopCategory || ''
        });
      }
    } catch (error) {
      toast.error('Error fetching profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'shopkeepers', user.uid), formData);
      toast.success('Profile updated successfully!');
      setEditMode(false);
      fetchShopData();
    } catch (error) {
      toast.error('Error updating profile: ' + error.message);
    }
  };

  if (loading) {
    return <ShopkeeperLayout>Loading profile...</ShopkeeperLayout>;
  }

  return (

      <div className="profile-page">
        <div className="profile-header">
          <h3>Shop Profile</h3>
          <button
            onClick={() => setEditMode(!editMode)}
            className="btn-edit"
          >
            {editMode ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {editMode ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>Owner Name</label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Shop Name</label>
              <input
                type="text"
                name="shopName"
                value={formData.shopName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Street Address</label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>ZIP Code</label>
                <input
                  type="text"
                  name="address.zip"
                  value={formData.address.zip}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>GST Number</label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Shop Category</label>
              <select
                name="shopCategory"
                value={formData.shopCategory}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                <option value="grocery">Grocery</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="restaurant">Restaurant</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button type="submit" className="btn-save">
              Save Changes
            </button>
          </form>
        ) : (
          <div className="profile-details">
            <div className="detail-row">
              <span className="detail-label">Owner Name:</span>
              <span className="detail-value">{shopData.ownerName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Shop Name:</span>
              <span className="detail-value">{shopData.shopName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Phone:</span>
              <span className="detail-value">{shopData.phone}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Address:</span>
              <span className="detail-value">
                {shopData.address.street}, {shopData.address.city}, {shopData.address.state} {shopData.address.zip}, {shopData.address.country}
              </span>
            </div>
            {shopData.gstNumber && (
              <div className="detail-row">
                <span className="detail-label">GST Number:</span>
                <span className="detail-value">{shopData.gstNumber}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Shop Category:</span>
              <span className="detail-value">{shopData.shopCategory}</span>
            </div>
          </div>
        )}
      </div>

  );
};

export default Profile;