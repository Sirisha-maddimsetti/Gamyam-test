import React, { useState, useEffect, useMemo } from "react";
import "../styles.css";

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [view, setView] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  //Load from localStorage OR fetch from product.json
  useEffect(() => {
    const saved = localStorage.getItem("products");
    if (saved) {
      setProducts(JSON.parse(saved));
    } else {
      fetch("/product.json")
        .then((res) => res.json())
        .then((data) => {
          setProducts(data);
          localStorage.setItem("products", JSON.stringify(data)); // Save initial data
        })
        .catch((err) => console.error("Error loading product.json:", err));
    }
  }, []);

  // Update localStorage whenever products change
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem("products", JSON.stringify(products));
    }
  }, [products]);

  
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;

    const term = searchTerm.toLowerCase();

    return products.filter((p) => {
      const searchable = `
        ${p.id} ${p.name} ${p.category} ${p.price} ${p.stock} ${p.description}
        ${p.createdAt} ${(p.tags || []).join(" ")}
      `.toLowerCase();
      return searchable.includes(term);
    });
  }, [products, searchTerm]);


  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  
  const handleSave = (product) => {
    if (!product.name || !product.price || !product.category) {
      alert("Please fill all required fields!");
      return;
    }

    if (product.id) {
      // Edit existing
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? product : p))
      );
    } else {
      // Add new
      const newProduct = {
        ...product,
        id: products.length + 1,
        createdAt: new Date().toISOString(),
        isActive: true,
      };
      setProducts([...products, newProduct]);
    }
    setEditingProduct(null);
  };

  const handleReset = () => {
    localStorage.removeItem("products");
    window.location.reload();
  };

  return (
    <div className="container">
      <h1>Product Management</h1>

      
      <div className="top-bar">
        <SearchBar setSearchTerm={setSearchTerm} />
        <button onClick={() => setView(view === "list" ? "card" : "list")}>
          Toggle View ({view === "list" ? "Card" : "List"})
        </button>
        <button onClick={() => setEditingProduct({})}>➕ Add Product</button>
        <button onClick={handleReset} style={{ background: "#d9534f" }}>
          🔄 Reset Data
        </button>
      </div>

      
      {editingProduct && (
        <ProductForm
          product={editingProduct}
          onSave={handleSave}
          onCancel={() => setEditingProduct(null)}
        />
      )}

      
      {view === "list" ? (
        <ProductTable products={visibleProducts} onEdit={setEditingProduct} />
      ) : (
        <ProductCardView products={visibleProducts} onEdit={setEditingProduct} />
      )}

  
      <Pagination
        totalItems={filteredProducts.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default ProductPage;





const SearchBar = ({ setSearchTerm }) => {
  const [input, setInput] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(input), 500);
    return () => clearTimeout(timer);
  }, [input, setSearchTerm]);

  return (
    <input
      type="text"
      placeholder="Search by Name,Category,Price, Tags"
      value={input}
      onChange={(e) => setInput(e.target.value)}
    />
  );
};


const ProductTable = ({ products, onEdit }) => (
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Category</th>
        <th>Price (₹)</th>
        <th>Stock</th>
        <th>Tags</th>
        <th>Status</th>
        <th>Edit</th>
      </tr>
    </thead>
    <tbody>
      {products.length > 0 ? (
        products.map((p) => (
          <tr key={p.id}>
            <td>{p.id}</td>
            <td>{p.name}</td>
            <td>{p.category}</td>
            <td>{p.price}</td>
            <td>{p.stock}</td>
            <td>{(p.tags || []).join(", ")}</td>
            <td>{p.isActive ? "Active" : "Inactive"}</td>
            <td>
              <button onClick={() => onEdit(p)}>Edit</button>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="8" style={{ textAlign: "center", padding: "10px" }}>
            No products found
          </td>
        </tr>
      )}
    </tbody>
  </table>
);


const ProductCardView = ({ products, onEdit }) => (
  <div className="grid">
    {products.length > 0 ? (
      products.map((p) => (
        <div className="card" key={p.id}>
          <h3>{p.name}</h3>
          <p><strong>Category:</strong> {p.category}</p>
          <p><strong>Price:</strong> ₹{p.price}</p>
          <p><strong>Stock:</strong> {p.stock}</p>
          {p.tags && p.tags.length > 0 && (
            <p><strong>Tags:</strong> {p.tags.join(", ")}</p>
          )}
          <p>{p.isActive ? " Active" : " Inactive"}</p>
          <button onClick={() => onEdit(p)}>Edit</button>
        </div>
      ))
    ) : (
      <p style={{ textAlign: "center", width: "100%" }}>No products found</p>
    )}
  </div>
);


const ProductForm = ({ product, onSave, onCancel }) => {
  const [form, setForm] = useState({
    id: product.id || null,
    name: product.name || "",
    price: product.price || "",
    category: product.category || "",
    stock: product.stock || "",
    description: product.description || "",
    tags: (product.tags || []).join(", "),
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    
    if (name === "price") {
      if (!/^\d*\.?\d*$/.test(value)) return; 
    }
    if (name === "stock") {
      if (!/^\d*$/.test(value)) return; 
    }

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "*Product name is required";
    if (!form.price.trim()) newErrors.price = "*Price is required";
    if (!form.category.trim()) newErrors.category = "*Category is required";
    if (!form.stock.trim()) newErrors.stock = "*Stock is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    
    const updatedProduct = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      price: Number(form.price),
      stock: Number(form.stock),
    };

    onSave(updatedProduct);
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h3>{form.id ? "Edit Product" : "Add Product"}</h3>

      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Product Name"
        className={errors.name ? "input-error" : ""}
      />
      {errors.name && <span className="error">{errors.name}</span>}

      <input
        name="price"
        type="text"
        value={form.price}
        onChange={handleChange}
        placeholder="Price"
        className={errors.price ? "input-error" : ""}
      />
      {errors.price && <span className="error">{errors.price}</span>}

      <input
        name="category"
        value={form.category}
        onChange={handleChange}
        placeholder="Category"
        className={errors.category ? "input-error" : ""}
      />
      {errors.category && <span className="error">{errors.category}</span>}

      <input
        name="stock"
        type="text"
        value={form.stock}
        onChange={handleChange}
        placeholder="Stock"
        className={errors.stock ? "input-error" : ""}
      />
      {errors.stock && <span className="error">{errors.stock}</span>}

      <input
        name="tags"
        value={form.tags}
        onChange={handleChange}
        placeholder="Tags (comma separated)"
      />

      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Description"
      />

      <div className="form-buttons">
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};



const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={page === currentPage ? "active" : ""}
        >
          {page}
        </button>
      ))}
    </div>
  );
};
