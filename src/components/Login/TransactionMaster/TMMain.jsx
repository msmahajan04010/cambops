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
        <div className="flex gap-4 mt-6 pt-6 border-t border-gray-800">
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
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">

              <div className="p-12">
                {/* Header */}
                <div className="text-center mb-8 border-b-2 border-black pb-6">
                  <h1 className="text-4xl font-bold text-black mb-2">INVOICE</h1>
                  <p className="text-gray-600">Invoice No: {invoiceData.invoiceNo}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Date: {new Date().toLocaleDateString()}
                  </p>
                </div>

                {/* User Info */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-black mb-3">Bill To:</h2>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    {users
                      .filter(u => u.id === invoiceData.userId)
                      .map(u => (
                        <div key={u.id}>
                          <p className="text-lg font-semibold text-black">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-gray-600">{u.email}</p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Items */}
                <table className="w-full border-collapse mb-6">
                  <thead>
                    <tr className="bg-gray-200 text-black">
                      <th className="border p-2 ">Chapter</th>
                      <th className="border p-2">Hours</th>
                      <th className="border p-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.items.map(item => (
                      <tr key={item.id}>
                        <td className="border p-2 text-black">{item.chapterName}</td>
                        <td className="border p-2 text-black">{item.hours}</td>
                        <td className="border p-2 text-black">
                          ₹ {calculateAmount(item).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Total */}
                <div className="text-right">
                  <p className="text-2xl font-bold text-black">
                    Total: ₹ {invoiceData.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-3">
                <button
                  onClick={() => window.print()}
                  className="bg-black text-white px-6 py-2 rounded-lg"
                >
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setShowPDF(false)}
                  className="bg-gray-200 px-6 py-2 rounded-lg text-black"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
