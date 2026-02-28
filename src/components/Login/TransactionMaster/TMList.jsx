import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";
import Layout from "../Layout/AdminLayout";

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
   const [loading, setLoading] = useState(false);

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

  return (
    <Layout title="Transaction History" subtitle="View all transactions in the system">
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
    </Layout>
  );
}
