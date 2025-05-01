import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from './Firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar'; // Create a simple navbar component

const ShopkeeperLayout = ({ children }) => {
  const [user] = useAuthState(auth);
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchShopData();
    }
  }, [user, navigate]);

  const fetchShopData = async () => {
    try {
      const docRef = doc(db, 'shopkeepers', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setShopData(docSnap.data());
      }
    } catch (error) {
      console.error('Error fetching shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="shopkeeper-layout">
      <Navbar shopName={shopData?.shopName} ownerName={shopData?.ownerName} />
     
      <div className="page-content">
        {children}
      </div>
    </div>
  );
};

export default ShopkeeperLayout;