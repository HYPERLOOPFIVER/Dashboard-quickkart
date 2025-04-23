export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Shopkeeper Dashboard</h1>
      </div>
      <ul className="navbar-menu">
        <li><a href="/">Home</a></li>
        <li><a href="/add-product">Add Product</a></li>
        <li><a href="/products">Manage Products</a></li>
        <li><a href="/orders">Orders</a></li>
        <li><a href="/profile">Profile</a></li>
      </ul>
    </nav>
  );
}