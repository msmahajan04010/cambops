import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";
import Layout from "../Layout/AdminLayout";
import { useNavigate } from "react-router-dom";
import Logo from "../../../assets/verse_logo.jpg"

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
   const [loading, setLoading] = useState(false);
const navigate = useNavigate();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
const [showPDF, setShowPDF] = useState(false);
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
      setLoading(true);
    const transSnap = await getDocs(collection(db, "transactions"));
    const userSnap = await getDocs(collection(db, "users"));
    const bookSnap = await getDocs(collection(db, "books"));

    console.log("bookSnap", transSnap, userSnap, bookSnap)

    setTransactions(
      transSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    );

    setUsers(userSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setBooks(bookSnap.docs.map(d => ({ id: d.id, ...d.data() })));
     setLoading(false);
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown";
  };

  const getBookName = (bookId) => {
    const book = books.find(b => b.id === bookId);
    return book ? book.bookName : "Unknown";
  };


  
  if (loading) {
    return (
     <Layout title="Transaction History" subtitle="View all transactions in the system">
        <div className="flex items-center justify-center h-[70vh]">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }



const handleViewInvoice = (invoice) => {
  setSelectedInvoice(invoice);
  setShowPDF(true);
};

  return (
    <Layout title="Transaction History" subtitle="View all transactions in the system">
      <div className="flex justify-between items-center mb-4">
  <h2 className="text-lg font-semibold">Transactions</h2>

  <button
    onClick={() => navigate("/TM")}
    className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-semibold"
  >
    ← Back
  </button>
</div>
      <div className="bg-gray-900 p-6 rounded-xl text-white">

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr  className="bg-gray-800 text-gray-300 text-xs uppercase">
                <th className="py-3 px-3 text-left">Invoice No</th>
                <th className="py-3 px-3 text-left">Date</th>
                <th className="py-3 px-3 text-left">User</th>
                <th className="py-3 px-3 text-left">Book</th>
                <th className="py-3 px-3 text-left">Total Amount</th>
                <th className="py-3 px-3 text-left">Items</th>
<th className="py-3 px-3 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map(t => (
                <tr key={t.id} className="border-b border-gray-800 hover:bg-gray-800/40">
                  <td className="py-3 px-3">{t.invoiceNo}</td>
                  <td className="py-3 px-3">
                    {t.createdAt?.toDate
                      ? t.createdAt.toDate().toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="py-3 px-3">{getUserName(t.userId)}</td>
                  <td className="py-3 px-3">{getBookName(t.bookId)}</td>
                  <td className="py-3 px-3">₹ {t.totalAmount?.toFixed(2)}</td>
                  <td className="py-3 px-3">{t.items?.length || 0}</td>
                  <td className="py-3 px-3">
  <button
    onClick={() => handleViewInvoice(t)}
    className="bg-white text-black px-3 py-1 rounded text-xs font-semibold"
  >
    View
  </button>
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transactions.length === 0 && (
          <div className="text-center text-gray-500 mt-6">
            No Transactions Found
          </div>
        )}

      </div>

{showPDF && selectedInvoice && (
  <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div
      id="invoice-print-area"
      className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-auto shadow-2xl"
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
    >
      <div className="p-10">

        {/* TOP HEADER BAND */}
        <div
          className="rounded-xl mb-8 px-8 py-6 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)" }}
        >
          <div className="flex items-center gap-4">
            <img
              src={Logo}
              alt="Company Logo"
              className="h-14 w-14 rounded-xl object-cover border-2 border-white/20 shadow-lg"
            />
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest">Issued by</p>
              <p className="text-white font-bold text-lg leading-tight">Phoenix Verse</p>
            </div>
          </div>

          <div className="text-right">
            <p
              className="text-4xl font-black tracking-tight"
              style={{ color: "#f0c040", letterSpacing: "-1px" }}
            >
              INVOICE
            </p>
            <p className="text-white/60 text-sm mt-1 font-mono">{selectedInvoice.invoiceNo}</p>
            <p className="text-white/40 text-xs mt-0.5">
              {selectedInvoice.createdAt?.toDate
                ? selectedInvoice.createdAt.toDate().toLocaleDateString("en-IN", {
                    year: "numeric", month: "long", day: "numeric"
                  })
                : new Date(selectedInvoice.createdAt).toLocaleDateString("en-IN", {
                    year: "numeric", month: "long", day: "numeric"
                  })}
            </p>
          </div>
        </div>

        {/* BILL TO + BOOK */}
        <div className="flex items-start justify-between mb-8 gap-6">
          <div
            className="flex-1 rounded-xl p-5 border-l-4"
            style={{ background: "#f8fafc", borderColor: "#1e3a5f" }}
          >
            <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: "#64748b" }}>
              Bill To
            </p>
            <p className="text-xl font-bold text-gray-900">{getUserName(selectedInvoice.userId)}</p>
          </div>

          <div className="rounded-xl p-5 text-right" style={{ background: "#f0f9ff", minWidth: "180px" }}>
            <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: "#64748b" }}>
              Book
            </p>
            <p className="text-gray-800 font-semibold text-sm leading-snug">
              {getBookName(selectedInvoice.bookId)}
            </p>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "#0f172a", color: "white" }}>
                <th className="text-left py-3 px-4 rounded-tl-lg font-semibold tracking-wide text-xs uppercase">Chapter</th>
                <th className="text-left py-3 px-4 font-semibold tracking-wide text-xs uppercase">Work Type</th>
                <th className="text-center py-3 px-4 font-semibold tracking-wide text-xs uppercase">Hours</th>
                <th className="text-right py-3 px-4 rounded-tr-lg font-semibold tracking-wide text-xs uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {selectedInvoice.items.map((item, idx) => (
                <tr
                  key={idx}
                  style={{
                    background: idx % 2 === 0 ? "#f8fafc" : "#ffffff",
                    borderBottom: "1px solid #e2e8f0"
                  }}
                >
                  <td className="py-3 px-4 text-gray-800 font-medium">{item.chapterName}</td>
                  <td className="py-3 px-4">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                      style={{
                        background:
                          item.workType === "recording" ? "#dbeafe" :
                          item.workType === "splitting" ? "#dcfce7" :
                          item.workType === "qc" ? "#fef9c3" : "#fce7f3",
                        color:
                          item.workType === "recording" ? "#1d4ed8" :
                          item.workType === "splitting" ? "#15803d" :
                          item.workType === "qc" ? "#92400e" : "#be185d"
                      }}
                    >
                      {item.workType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-700">{item.hours}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-gray-800">
                    ₹ {item.amount ? item.amount.toFixed(2) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTAL BAND */}
        <div
          className="rounded-xl px-6 py-5 flex items-center justify-between mb-8"
          style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)" }}
        >
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest">Total Payable</p>
            <p className="text-white/80 text-xs mt-1">
              {selectedInvoice.items.length} item{selectedInvoice.items.length > 1 ? "s" : ""}
            </p>
          </div>
          <p className="text-3xl font-black font-mono" style={{ color: "#f0c040" }}>
            ₹ {selectedInvoice.totalAmount.toFixed(2)}
          </p>
        </div>

        {/* FOOTER NOTE */}
        <div className="text-center border-t pt-6">
          <p className="text-gray-400 text-xs tracking-wide">
            This is a system-generated invoice · Phoenix Verse · {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-10 py-4 flex justify-end gap-3 rounded-b-2xl">
        <button
          onClick={() => setShowPDF(false)}
          className="px-5 py-2 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
        >
          Close
        </button>
        <button
          onClick={() => window.print()}
          className="px-6 py-2 rounded-lg text-sm font-bold text-white flex items-center gap-2 transition"
          style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print / Save PDF
        </button>
      </div>
    </div>
  </div>
)}
    </Layout>
  );
}
