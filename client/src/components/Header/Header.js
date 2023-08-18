import React, { useEffect } from "react";
import Auth from "../../utils/auth";
import { Link } from "react-router-dom";
import "./Header.css";
import { useStoreContext } from "../../utils/GlobalState";
import { DECODE_TOKEN } from "../../utils/actions";

export default function Header(props) {
  const [state, dispatch] = useStoreContext();

  useEffect(() => {
    console.log("state", state);
  }, [state]);

  const getToken = () => {
    const token = localStorage.getItem("id_token");
    let decoded = Auth.getDecodedToken(token);

  if (!state.user) {
    dispatch({
      type: DECODE_TOKEN,
      decoded,
    });
  }
  return true;
};

  const renderTopNav = () => {
    if (Auth.loggedIn() && getToken()) {
      return (
        <div className="header-top-nav">
          {state.user && state.user.isAdmin && <Link to="/addproduct"> Add product </Link>} 
          <Link to="/orderHistory">Order History</Link>
          <a href="/" onClick={() => Auth.logout()}>
            Logout
          </a>
        </div>
      );
    } else {
      return (
        <div className="header-top-nav">
          <Link to="/signup">Signup</Link>
          <Link to="/login">Login</Link>
        </div>
      );
    }
  };

  return (
    <div className="header-container">
      <div className="header-cart-bar">
        <div>Free standard delivery on orders over $79</div>
        <div>
          <Link to="/cart" className="header-cart-link">
            My Cart
          </Link>
        </div>
      </div>
      <div className="header-main">
        <div className="top">
          <Link to="/" className="logo-link">
            <div className="header-logo">Fancy Candles</div>
          </Link>
          {state.user && state.user.isAdmin && <Link to="/admin"> Admin View </Link>}
          {renderTopNav()}
        </div>
      </div>
    </div>
  );
}