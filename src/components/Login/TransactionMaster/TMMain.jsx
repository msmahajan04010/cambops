import React, { useEffect, useState } from "react";
import Layout from "../Layout/AdminLayout";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc
} from "firebase/firestore";
import { db } from "../../../firebase";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from "../../../assets/G8_logo.png"

export default function TransactionMaster() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [config, setConfig] = useState(null);

  const [selectedUser, setSelectedUser] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [showPDF, setShowPDF] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);


  const fetchInitialData = async () => {
    // Users
    const userSnap = await getDocs(collection(db, "users"));
    setUsers(userSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    // Books (only Payment Received)
    const bookSnap = await getDocs(collection(db, "books"));
    const filteredBooks = bookSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(b => b.bookStatus === 2);

    setBooks(filteredBooks);

    // Config
    const configSnap = await getDocs(collection(db, "config"));
    setConfig(configSnap.docs[0]?.data());
  };

  useEffect(() => {
    fetchInitialData();
  }, []);


  const fetchChapters = async (userId, bookId) => {
    const snap = await getDocs(collection(db, "chapterAssignments"));

    const data = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    const eligible = [];

    data.forEach(a => {
      if (a.bookId !== bookId) return;

      // Recording
      if (
        a.recording?.userId === userId &&
        a.recording?.status === 6 &&
        !a.recording?.isInvoiced
      ) {
        eligible.push({
          id: a.id + "_rec",
          chapterId: a.id,
          chapterName: a.chapterName,
          hours: a.hours,
          workType: "recording",
          selected: true
        });
      }

      // Splitting
      if (
        a.splitting?.userId === userId &&
        a.splitting?.status === 6 &&
        !a.splitting?.isInvoiced
      ) {
        eligible.push({
          id: a.id + "_split",
          chapterId: a.id,
          chapterName: a.chapterName,
          hours: a.hours,
          workType: "splitting",
          selected: true
        });
      }

      // QC
      if (
        a.qc?.userId === userId &&
        a.qc?.status === 6 &&
        !a.qc?.isInvoiced
      ) {
        eligible.push({
          id: a.id + "_qc",
          chapterId: a.id,
          chapterName: a.chapterName,
          hours: a.hours,
          workType: "qc",
          selected: true
        });
      }

      if (
        a.correction?.userId === userId &&
        a.correction?.status === 6 &&
        !a.correction?.isInvoiced
      ) {
        eligible.push({
          id: a.id + "_correction",
          chapterId: a.id,
          chapterName: a.chapterName,
          hours: a.hours,
          workType: "correction",
          selected: true
        });
      }


    });

    setTransactions(eligible);
  };

  const calculateAmount = (chapter) => {
    if (!config) return 0;

    if (chapter.workType === "recording") {
      return chapter.hours * config.recordingAmount;
    }

    if (chapter.workType === "splitting") {
      return chapter.hours * config.splittingAmount;
    }

    if (chapter.workType === "qc") {
      return chapter.hours * config.qcAmount;
    }

    if (chapter.workType === "correction") {
      return chapter.hours * config.correctionAmount;
    }


    return 0;
  };

  const calculateFinalAmount = () => {
    return transactions
      .filter(t => t.selected)
      .reduce((sum, t) => sum + calculateAmount(t), 0);
  };

  const handleGenerateInvoice = async () => {
    if (!selectedUser || !selectedBook) {
      toast.error("Select User & Book");
      return;
    }

    const selectedItems = transactions.filter(t => t.selected);

    if (selectedItems.length === 0) {
      toast.error("No chapters selected");
      return;
    }

    const invoiceNo = "INV-" + Date.now();

    const totalAmount = calculateFinalAmount();

    const invoicePayload = {
      invoiceNo,
      userId: selectedUser,
      bookId: selectedBook,
      items: selectedItems,
      totalAmount,
      createdAt: new Date()
    };

    // Save invoice
    await addDoc(collection(db, "transactions"), invoicePayload);

    // Mark chapters invoiced
    for (const item of selectedItems) {
      const updatePayload = {};

      if (item.workType === "recording") {
        updatePayload["recording.isInvoiced"] = true;
      }

      if (item.workType === "splitting") {
        updatePayload["splitting.isInvoiced"] = true;
      }

      if (item.workType === "qc") {
        updatePayload["qc.isInvoiced"] = true;
      }

      if (item.workType === "correction") {
        updatePayload["correction.isInvoiced"] = true;
      }

      await updateDoc(
        doc(db, "chapterAssignments", item.chapterId),
        updatePayload
      );
    }

    toast.success("Invoice generated successfully.");

    // 🔥 Store invoice for PDF preview
    setInvoiceData(invoicePayload);
    setShowPDF(true);

    setTransactions([]);
    setSelectedBook("");
  };

  return (
    <Layout title="Transaction Master" subtitle="View and manage all transactions in the system">
      <div className="bg-gray-900 p-3 rounded-xl text-white">

        {/* USER SELECT */}
        <div className="mb-4">
          <label>User</label>
          <select
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded"
          >
            <option value="">--Select--</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* BOOK SELECT */}
        <div className="mb-4">
          <label>Book</label>
          <select
            value={selectedBook}
            onChange={e => {
              setSelectedBook(e.target.value);
              fetchChapters(selectedUser, e.target.value);
            }}
            className="w-full p-2 bg-gray-800 rounded"
          >
            <option value="">--Select--</option>
            {books.map(b => (
              <option key={b.id} value={b.id}>
                {b.bookName}
              </option>
            ))}
          </select>
        </div>
     <div className="flex gap-4 mt-6 pt-6 mb-6 border-t border-gray-800">
          <button
            onClick={() => navigate('/TMList')}
            className="bg-gray-800 text-white border border-gray-700 px-4 py-1 rounded-lg font-semibold hover:bg-gray-700 transition-all duration-200 flex items-center gap-4"
          >

            LIST
          </button>
        </div>
        {/* TABLE */}
        {transactions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-800 text-gray-300 text-xs uppercase tracking-wider">
                <tr >

                  <th className="py-3 px-3 text-left">Chapter</th>
                  <th className="py-3 px-3 text-left">Work Type</th>
                  <th className="py-3 px-3 text-left">Hours</th>
                  <th className="py-3 px-3 text-left">Amount</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}
                    className="border-b border-gray-800 hover:bg-gray-800/40 transition">

                    <td className="py-3 px-3">{t.chapterName}</td>
                    <td className="py-3 px-3 capitalize">
                      {t.workType}
                    </td>

                    <td className="py-3 px-3">{t.hours}</td>
                    <td className="py-3 px-3">₹ {calculateAmount(t).toFixed(2)}</td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={t.selected}
                        onChange={() =>
                          setTransactions(prev =>
                            prev.map(p =>
                              p.id === t.id
                                ? { ...p, selected: !p.selected }
                                : p
                            )
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {transactions.length > 0 && (
          <>
            <div className="text-right text-2xl font-bold mb-4">
              Total: ₹ {calculateFinalAmount().toFixed(2)}
            </div>

            <button
              onClick={handleGenerateInvoice}
              className="bg-white text-black px-6 py-2 rounded"
            >
              Generate Invoice
            </button>
          </>
        )}

      {showPDF && invoiceData && (
  <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div
      id="invoice-print-area"
      className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-auto shadow-2xl"
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
    >
      {/* Printable Invoice */}
      <div className="p-10">

        {/* TOP HEADER BAND */}
        <div
          className="rounded-xl mb-8 px-8 py-6 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)" }}
        >
          {/* Logo */}
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

          {/* Invoice Badge */}
          <div className="text-right">
            <p
              className="text-4xl font-black tracking-tight"
              style={{ color: "#f0c040", letterSpacing: "-1px" }}
            >
              INVOICE
            </p>
            <p className="text-white/60 text-sm mt-1 font-mono">{invoiceData.invoiceNo}</p>
            <p className="text-white/40 text-xs mt-0.5">
              {new Date().toLocaleDateString("en-IN", {
                year: "numeric", month: "long", day: "numeric"
              })}
            </p>
          </div>
        </div>

        {/* BILL TO */}
        <div className="flex items-start justify-between mb-8 gap-6">
          <div
            className="flex-1 rounded-xl p-5 border-l-4"
            style={{ background: "#f8fafc", borderColor: "#1e3a5f" }}
          >
            <p
              className="text-xs uppercase tracking-widest font-bold mb-2"
              style={{ color: "#64748b" }}
            >
              Bill To
            </p>
            {users
              .filter(u => u.id === invoiceData.userId)
              .map(u => (
                <div key={u.id}>
                  <p className="text-xl font-bold text-gray-900">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-gray-500 text-sm mt-0.5">{u.email}</p>
                </div>
              ))}
          </div>

          <div
            className="rounded-xl p-5 text-right"
            style={{ background: "#f0f9ff", minWidth: "180px" }}
          >
            <p
              className="text-xs uppercase tracking-widest font-bold mb-2"
              style={{ color: "#64748b" }}
            >
              Book
            </p>
            <p className="text-gray-800 font-semibold text-sm leading-snug">
              {books.find(b => b.id === invoiceData.bookId)?.bookName || "—"}
            </p>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "#0f172a", color: "white" }}>
                <th className="text-left py-3 px-4 rounded-tl-lg font-semibold tracking-wide text-xs uppercase">
                  Chapter
                </th>
                <th className="text-left py-3 px-4 font-semibold tracking-wide text-xs uppercase">
                  Work Type
                </th>
                <th className="text-center py-3 px-4 font-semibold tracking-wide text-xs uppercase">
                  Hours
                </th>
                <th className="text-right py-3 px-4 rounded-tr-lg font-semibold tracking-wide text-xs uppercase">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, idx) => (
                <tr
                  key={item.id}
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
                    ₹ {calculateAmount(item).toFixed(2)}
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
              {invoiceData.items.length} item{invoiceData.items.length > 1 ? "s" : ""}
            </p>
          </div>
          <p
            className="text-3xl font-black font-mono"
            style={{ color: "#f0c040" }}
          >
            ₹ {invoiceData.totalAmount.toFixed(2)}
          </p>
        </div>

        {/* FOOTER NOTE */}
        <div className="text-center border-t pt-6">
          <p className="text-gray-400 text-xs tracking-wide">
            This is a system-generated invoice · Phoenix Verse ·{" "}
            {new Date().getFullYear()}
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

      </div>
    </Layout>
  );
}
