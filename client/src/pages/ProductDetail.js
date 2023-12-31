import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "react-router-dom"; // Assuming you're using react-router-dom
import { useQuery, useMutation } from "@apollo/client"; // Assuming you're using Apollo Client
import { useStoreContext } from "../utils/GlobalState"; // Assuming you have a store context
import {
  ADD_TO_CART,
  UPDATE_CART_QUANTITY,
  UPDATE_CURRENT_PRODUCT,
} from "../utils/actions";
import { idbPromise } from "../utils/helpers"; // Assuming you have a utility function for IndexedDB operations
import Auth from "../utils/auth"; // Assuming you have an Auth utility
import Button from "../components/Button/Button";
import "./ProductDetail.css";
import { QUERY_PRODUCT } from "../utils/queries";
import { EDIT_PRODUCT } from "../utils/mutations";
import { DELETE_PRODUCT} from "../utils/mutations";
import { useNavigate } from "react-router-dom";


const ProductDetail = () => {
  const { id } = useParams();
  const [cartMessage, setCartMessage] = useState("");
  const { loading, data: { product: productData } = {} } = useQuery(
    QUERY_PRODUCT,
    {
      variables: {
        id,
      },
    }
  );
  const [state, dispatch] = useStoreContext();

  useEffect(() => {
    if (productData) {
      dispatch({
        type: UPDATE_CURRENT_PRODUCT,
        currentProduct: productData,
      });
    }
  }, [productData, dispatch]);

  const { currentProduct, cart } = state;
  const addToCart = () => {
    setCartMessage("");
    const itemInCart = cart.find((cartItem) => cartItem._id === id);

    if (itemInCart) {
      dispatch({
        type: UPDATE_CART_QUANTITY,
        _id: id,
        purchaseQuantity: parseInt(itemInCart.purchaseQuantity) + 1,
      });
      idbPromise("cart", "put", {
        ...itemInCart,
        purchaseQuantity: parseInt(itemInCart.purchaseQuantity) + 1,
      });
    } else {
      dispatch({
        type: ADD_TO_CART,
        product: { ...currentProduct, purchaseQuantity: 1 },
      });
      idbPromise("cart", "put", {
        ...currentProduct,
        purchaseQuantity: 1,
      });
    }
    setCartMessage("Your item has been added to cart.");
  };

  const [isAdmin, setIsAdmin] = useState(false);
  const [productDetails, setProductDetails] = useState({
    name: "",
    description: "",
    price: 0,
  });

  useEffect(() => {
    setProductDetails({
      name: currentProduct.name,
      description: currentProduct.description,
      price: currentProduct.price,
    });
  }, [currentProduct]);

  const inputHandler = (e) => {
    console.log(e.target.name, e.target.value);
    let updatedProduct = {
      ...productDetails,
      [e.target.name]:
        isNaN(e.target.value) || e.target.name != "price"
          ? e.target.value
          : parseFloat(e.target.value),
    };
    console.log(updatedProduct);
    setProductDetails(updatedProduct);
  };

  useEffect(() => {
    const token = localStorage.getItem("id_token");
    const decoded = Auth.getDecodedToken(token);
    if (!state.user) {
      dispatch({
        type: "DECODE_TOKEN", // Replace with your actual action type
        decoded,
      });
    }
    if (state.user) {
      setIsAdmin(state.user.isAdmin);
    }
  }, [dispatch, state.user]);

  useEffect(() => {
    console.log("state", state);
  }, [state]);

  const [editProduct] = useMutation(EDIT_PRODUCT);

  const handleEdit = async () => {
    const editResponse = await editProduct({
      variables: {
        productId: currentProduct._id,
        updatedProduct: productDetails,
      },
    });
    console.log(editResponse);
  };

  const getToken = () => {
    const token = localStorage.getItem("id_token");
    const decoded = Auth.getDecodedToken(token);
    return !!decoded;
  };


  const [deleteProduct] = useMutation(DELETE_PRODUCT);

  const handleDelete = async () => {
    try {
      const deleteResponse = await deleteProduct({
        variables: {
          productId: currentProduct._id,
        },
      });
      console.log(deleteResponse);
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };
  

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleShowDeleteModal = () => {
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const navigate = useNavigate();

  const handleConfirmDelete = async () => {
    try {
      const deleteResponse = await deleteProduct({
        variables: {
          productId: currentProduct._id,
        },
      });

      console.log(deleteResponse);

      setShowDeleteModal(false);

      navigate(`/category/${currentProduct.category._id}`);
      window.location.reload();
      
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };


  return (
    <div className="product-detail-page">
      <img src={`/images/${currentProduct.image}`} alt={currentProduct.name} />
      <div className="product-detail-content">
        {isAdmin ? (
          <input
            className="product-name-input"
            value={productDetails.name}
            onChange={inputHandler}
            name="name"
          />
        ) : (
          <div className="product-name">
            {currentProduct.name && currentProduct.name.toUpperCase()}
          </div>
        )}

        {isAdmin ? (
          <textarea
            className="product-description-input"
            value={productDetails.description}
            onChange={inputHandler}
            name="description"
          />
        ) : (
          <p className="product-description">{currentProduct.description}</p>
        )}

        {isAdmin ? (
          <input
            className="product-price-input"
            type="number"
            min={0}
            value={productDetails.price}
            onChange={inputHandler}
            name="price"
          />
        ) : (
          <div className="product-price">AUD {currentProduct.price}</div>
        )}
        <Button variant="ghost" style={{ width: "100%" }} onClick={addToCart}>
          ADD TO CART
        </Button>
        {isAdmin && (
          <div className="product-delete-save">
            <Button variant="plain" onClick={handleShowDeleteModal}>
              <FontAwesomeIcon icon={faTrash} /> Delete Item
            </Button>
            <Button variant="plain" onClick={handleEdit}>
              <FontAwesomeIcon icon={faFloppyDisk} /> Save Item
            </Button>
          </div>
        )}

        {showDeleteModal && (
        <div className="delete-modal">
          <p>Are you sure you want to delete this product?</p>
          <Button variant="plain" onClick={handleConfirmDelete}>OK</Button>
          <Button variant="plain" onClick={handleCancelDelete}>Cancel</Button>
        </div>
      )}


        {cartMessage && <p>{cartMessage}</p>}
      </div>
    </div>
  );
};

export default ProductDetail;