import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function TakesellPricesCalculator() {
  const [fabrics, setFabrics] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [priceMode, setPriceMode] = useState("retail");
  const [quantities, setQuantities] = useState({});
  const [showAll, setShowAll] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const products = [
    { key: "sofa", label: "Sofa Cover" },
    { key: "chair", label: "Chair Cover" },
    { key: "table", label: "T-Table Cover" },
    { key: "cushion_16_16", label: "Cushion 16×16" },
    { key: "cushion_18_18", label: "Cushion 18×18" },
    { key: "cushion_20_20", label: "Cushion 20×20" },
    { key: "cushion_24_24", label: "Cushion 24×24" },
    { key: "cushion_30_30", label: "Cushion 30×30" },
    { key: "bed", label: "Bed Cover" },
    { key: "dining", label: "Dining Table Cover" },
    { key: "tul", label: "Tul Cover" },
    { key: "box", label: "Box Cover" },
    { key: "tv", label: "TV Cover" },
    { key: "ac", label: "AC Cover" },
    { key: "foam", label: "Foam Cover" },
  ];

  const emptyPrices = products.reduce((acc, p) => {
    acc[p.key] = { retail: 0, wholesale: 0 };
    return acc;
  }, {});
  const [formValues, setFormValues] = useState({
    name: "",
    prices: { ...emptyPrices },
  });

  const [deletePasswordInput, setDeletePasswordInput] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "fabrics"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFabrics(data);
      if (data.length === 0) setSelectedIndex(0);
      else if (selectedIndex >= data.length)
        setSelectedIndex(data.length - 1);
    });
    return unsub;
  }, []);

  const selectedFabric = fabrics[selectedIndex] || null;

  async function updatePrice(product, field, value) {
    if (!selectedFabric) return;
    const parsed = parseFloat(value);
    const sanitized = Number.isNaN(parsed) ? 0 : parsed;
    const updatedPrices = {
      ...selectedFabric.prices,
      [product]: {
        ...selectedFabric.prices?.[product],
        [field]: sanitized,
      },
    };
    await updateDoc(doc(db, "fabrics", selectedFabric.id), {
      prices: updatedPrices,
    });
    setFabrics((old) =>
      old.map((f, i) =>
        i === selectedIndex ? { ...f, prices: updatedPrices } : f
      )
    );
  }

  function updateQuantity(product, value) {
    const parsed = parseInt(value, 10);
    setQuantities((q) => ({
      ...q,
      [product]: Number.isNaN(parsed) ? 0 : parsed,
    }));
  }

  function openAddModal() {
    setFormValues({ name: "", prices: { ...emptyPrices } });
    setShowAddModal(true);
  }

  async function saveNewFabric() {
    const name = (formValues.name || "").trim();
    if (!name) {
      alert("Please provide a fabric name.");
      return;
    }
    const prices = {};
    for (const k of Object.keys(formValues.prices)) {
      prices[k] = {
        retail: Number(formValues.prices[k].retail) || 0,
        wholesale: Number(formValues.prices[k].wholesale) || 0,
      };
    }
    await addDoc(collection(db, "fabrics"), { name, prices });
    setShowAddModal(false);
    setFormValues({ name: "", prices: { ...emptyPrices } });
    setTimeout(() => {
      setSelectedIndex((prev) => Math.max(0, fabrics.length));
    }, 300);
  }

  function openEditModal() {
    if (!selectedFabric) return;
    const clonePrices = {};
    for (const k of Object.keys(emptyPrices)) {
      clonePrices[k] = {
        retail: selectedFabric.prices?.[k]?.retail ?? 0,
        wholesale: selectedFabric.prices?.[k]?.wholesale ?? 0,
      };
    }
    setFormValues({ name: selectedFabric.name, prices: clonePrices });
    setShowEditModal(true);
  }

  async function saveEditFabric() {
    if (!selectedFabric) return;
    const name = (formValues.name || "").trim();
    if (!name) {
      alert("Fabric name cannot be empty.");
      return;
    }
    const prices = {};
    for (const k of Object.keys(formValues.prices)) {
      prices[k] = {
        retail: Number(formValues.prices[k].retail) || 0,
        wholesale: Number(formValues.prices[k].wholesale) || 0,
      };
    }
    await updateDoc(doc(db, "fabrics", selectedFabric.id), { name, prices });
    setShowEditModal(false);
  }

  function openDeleteModal() {
    setDeletePasswordInput("");
    setDeleteError("");
    setShowDeleteModal(true);
  }

  async function confirmDeleteFabric() {
    if (!selectedFabric) return;
    if (deletePasswordInput !== selectedFabric.name) {
      setDeleteError("Password does not match the fabric full name.");
      return;
    }
    await deleteDoc(doc(db, "fabrics", selectedFabric.id));
    setShowDeleteModal(false);
    setFabrics((old) => old.filter((_, i) => i !== selectedIndex));
    setSelectedIndex((s) => Math.max(0, s - 1));
  }

  function productTotal(productKey) {
    const price = selectedFabric?.prices?.[productKey]?.[priceMode] || 0;
    const qty = quantities[productKey] || 0;
    return price * qty;
  }

  const grandTotal = products.reduce((s, p) => s + productTotal(p.key), 0);
  const visibleProducts = showAll ? products : products.slice(0, 4);

  if (!selectedFabric)
    return (
      <div className="text-center mt-10 text-gray-600">
        Loading fabrics...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Takesell Prices Calculator</h1>

      <div className="flex gap-4 flex-col md:flex-row items-start">
        {/* Sidebar */}
        <div className="w-full md:w-1/3 bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700">
            Select Fabric
          </label>
          <select
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
            className="mt-2 w-full p-2 border rounded"
          >
            {fabrics.map((f, i) => (
              <option key={f.id || f.name} value={i}>
                {f.name}
              </option>
            ))}
          </select>

          {/* Replaced quick input with three buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={openAddModal}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add
            </button>
            <button
              onClick={openEditModal}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={!selectedFabric}
            >
              Edit
            </button>
            <button
              onClick={openDeleteModal}
              className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              disabled={fabrics.length === 1}
            >
              Delete
            </button>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium">Price Mode</label>
            <div className="mt-2 flex gap-2 items-center">
              <button
                onClick={() => setPriceMode("retail")}
                className={`px-3 py-2 rounded ${
                  priceMode === "retail" ? "bg-green-600 text-white" : "border"
                }`}
              >
                Retail
              </button>
              <button
                onClick={() => setPriceMode("wholesale")}
                className={`px-3 py-2 rounded ${
                  priceMode === "wholesale" ? "bg-green-600 text-white" : "border"
                }`}
              >
                Wholesale
              </button>

              {/* --- Grand Total Sidebar --- */}
              <div className="ml-auto text-right">
                <div className="text-xs text-gray-500">Grand Total</div>
                <div className="font-bold text-lg">
                  Tk {grandTotal.toLocaleString()}
                </div>
              </div>
            </div>
          </div>


          {/* --- Itemized Breakdown --- */}
          {products.some(p => (quantities[p.key] || 0) > 0) && (
            <div className="mt-4 border-t border-gray-200 pt-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Itemized Price Summary</h4>
              <div className="max-h-40 overflow-auto text-sm">
                {products.map((p) => {
                  const qty = quantities[p.key] || 0;
                  if (qty === 0) return null; // Qty 0 Shows Items if Item > 0
                  const price = selectedFabric.prices?.[p.key]?.[priceMode] || 0;
                  const total = price * qty;
                  const unitLabel = p.key === "sofa" ? "Seats" : "Pcs"; // For sofa Shows seats
                  return (
                    <div key={p.key} className="flex justify-between mb-1">
                      <span>{selectedFabric.name} {p.label} {qty} {unitLabel}</span>
                      <span>Tk {total.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


        </div>

        {/* Main Section */}
        <div className="flex-1 bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-3">
            Prices for:{" "}
            <span className="text-indigo-600">{selectedFabric.name}</span>
          </h2>

          <div className="space-y-4">
            {visibleProducts.map((p) => (
              <div
                key={p.key}
                className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center"
              >
                <div className="md:col-span-2 font-medium">{p.label}</div>

                <div className="flex gap-2 items-center md:col-span-2">
                  <div className="flex-1">
                    <label className="text-xs">Retail (Tk)</label>
                    <input
                      type="number"
                      value={selectedFabric.prices[p.key]?.retail ?? 0}
                      onChange={(e) =>
                        updatePrice(p.key, "retail", e.target.value)
                      }
                      className="w-full p-2 border rounded"
                      disabled
                    />
                  </div>

                  <div className="flex-1">
                    <label className="text-xs">Wholesale (Tk)</label>
                    <input
                      type="number"
                      value={selectedFabric.prices[p.key]?.wholesale ?? 0}
                      onChange={(e) =>
                        updatePrice(p.key, "wholesale", e.target.value)
                      }
                      className="w-full p-2 border rounded"
                      disabled
                    />
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="text-xs">Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={quantities[p.key] || ""}
                    onChange={(e) => updateQuantity(p.key, e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div className="md:col-span-1 text-right font-semibold">
                  Tk {productTotal(p.key).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {products.length > 4 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAll((p) => !p)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              >
                {showAll ? "Hide Extra Items" : "Show More Items"}
              </button>
            </div>
          )}

          <div className="mt-6 p-4 bg-white rounded shadow-sm flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Selected price mode</div>
              <div className="font-bold text-xl">
                {priceMode === "retail" ? "Retail" : "Wholesale"}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-600">Grand Total</div>
              <div className="font-bold text-2xl">
                Tk {grandTotal.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-10 border-t border-gray-200 bg-gray-50 text-center py-4 text-sm text-gray-600">
        <p>
          © {new Date().getFullYear()} | Developed by{" "}
          <span className="font-semibold text-gray-800"><a href="https://www.facebook.com/obaydullah.obaydullah.3">MD Obaydullah</a></span>
        </p>
        <div className="mt-2 flex justify-center space-x-4 text-gray-500">
          <a
            href="https://github.com/devobaydullah94"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-800 transition-colors"
          >
          <i className="fa-brands fa-github" style={{ margin: "0 5px" }}></i>
            GitHub
          </a>
          <a
            href="https://www.facebook.com/obaydullah.obaydullah.3"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-800 transition-colors"
          >
          <i className="fa-brands fa-facebook" style={{ margin: "0 5px" }}></i>
            Facebook
          </a>
          <a
            href="https://devobaydullah.netlify.app"
            target="_blank"
            className="hover:text-gray-800 transition-colors"
            rel="noreferrer"
          >
          <i className="fa-solid fa-laptop-code" style={{ margin: "0 5px" }}></i>
            Portfolio
          </a>
          <a
            href="https://creatario.net"
            target="_blank"
            className="hover:text-gray-800 transition-colors"
            rel="noreferrer"
          >
          <i className="fa-solid fa-globe" style={{ margin: "0 5px" }}></i>
            Website
          </a>
        </div>
      </footer>


      {/* ---------------- Add Modal ---------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-3xl bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-3">Add New Fabric</h3>

            <label className="block text-sm mb-1">Fabric Name</label>
            <input
              value={formValues.name}
              onChange={(e) =>
                setFormValues({ ...formValues, name: e.target.value })
              }
              className="w-full p-2 border rounded mb-4"
            />

            {/* Table heading */}
            <div className="grid grid-cols-3 font-semibold text-gray-700 border-b pb-1 mb-2">
              <div>Fabric Item</div>
              <div className="text-center">Retail (Tk)</div>
              <div className="text-center">Wholesale (Tk)</div>
            </div>

            <div className="max-h-72 overflow-auto space-y-3">
              {products.map((p) => (
                <div
                  key={p.key}
                  className="grid grid-cols-3 gap-2 items-center"
                >
                  <div className="font-medium">{p.label}</div>
                  <input
                    type="number"
                    placeholder="Retail"
                    value={formValues.prices[p.key].retail}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        prices: {
                          ...formValues.prices,
                          [p.key]: {
                            ...formValues.prices[p.key],
                            retail: e.target.value,
                          },
                        },
                      })
                    }
                    className="p-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Wholesale"
                    value={formValues.prices[p.key].wholesale}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        prices: {
                          ...formValues.prices,
                          [p.key]: {
                            ...formValues.prices[p.key],
                            wholesale: e.target.value,
                          },
                        },
                      })
                    }
                    className="p-2 border rounded"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={saveNewFabric}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save Fabric
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Edit Modal ---------------- */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-3xl bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-3">Edit Fabric</h3>

            <label className="block text-sm mb-1">Fabric Name</label>
            <input
              value={formValues.name}
              onChange={(e) =>
                setFormValues({ ...formValues, name: e.target.value })
              }
              className="w-full p-2 border rounded mb-4"
            />

            {/* Table heading */}
            <div className="grid grid-cols-3 font-semibold text-gray-700 border-b pb-1 mb-2">
              <div>Fabric Item</div>
              <div className="text-center">Retail (Tk)</div>
              <div className="text-center">Wholesale (Tk)</div>
            </div>

            <div className="max-h-72 overflow-auto space-y-3">
              {products.map((p) => (
                <div
                  key={p.key}
                  className="grid grid-cols-3 gap-2 items-center"
                >
                  <div className="font-medium">{p.label}</div>
                  <input
                    type="number"
                    placeholder="Retail"
                    value={formValues.prices[p.key].retail}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        prices: {
                          ...formValues.prices,
                          [p.key]: {
                            ...formValues.prices[p.key],
                            retail: e.target.value,
                          },
                        },
                      })
                    }
                    className="p-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Wholesale"
                    value={formValues.prices[p.key].wholesale}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        prices: {
                          ...formValues.prices,
                          [p.key]: {
                            ...formValues.prices[p.key],
                            wholesale: e.target.value,
                          },
                        },
                      })
                    }
                    className="p-2 border rounded"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={saveEditFabric}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Delete Modal ---------------- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-2 text-red-700">
              Delete Fabric: {selectedFabric.name}
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              Type the full fabric name to confirm deletion:
            </p>
            <input
              type="text"
              value={deletePasswordInput}
              onChange={(e) => setDeletePasswordInput(e.target.value)}
              className="w-full p-2 border rounded mb-2"
              placeholder="Enter fabric name"
            />
            {deleteError && (
              <p className="text-sm text-red-600 mb-2">{deleteError}</p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteFabric}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
