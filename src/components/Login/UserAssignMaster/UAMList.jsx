import React, { useEffect, useState } from "react";
import Layout from "../Layout/AdminLayout";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";
import { useNavigate } from "react-router-dom";
import { CHAPTER_STATUS } from "../Config/StatusConstants";

export default function UserAssignBookList() {
  const [books, setBooks] = useState([]);
  const [assignments, setAssignments] = useState([]);
   const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const bookSnap = await getDocs(collection(db, "books"));
    const assignSnap = await getDocs(collection(db, "chapterAssignments"));

    setBooks(bookSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setAssignments(assignSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  const calculateProgress = (book) => {
  const totalChapters = book.chapters?.length || 0;
  if (totalChapters === 0) return 0;

  const bookAssignments = assignments.filter(
    a => a.bookId === book.id
  );

  let completedChapters = 0;

  book.chapters.forEach(ch => {
    const assignment = bookAssignments.find(
      a => a.chapterNumber === ch.chapterNumber
    );

    if (
      assignment?.recording?.status >= 6 &&
      assignment?.splitting?.status >= 6 &&
      assignment?.qc?.status >= 6
    ) {
      completedChapters++;
    }
  });

  return Math.round((completedChapters / totalChapters) * 100);
};

    if (loading) {
      return (
        <Layout title="Book Assignment List" subtitle="View and check all assigned books">
          <div className="flex items-center justify-center h-[70vh]">
            <div className="w-12 h-12 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
          </div>
        </Layout>
      );
    }

  return (
    <Layout title="Book Assignment List" subtitle="View and check all assigned books">
      <div className="bg-gray-900 p-1 rounded-xl">
          <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
         
          <thead>
            <tr  className="bg-gray-800 text-gray-300 text-xs uppercase">
              <th className="py-3 text-left">Sr. No.</th>
              <th className="py-3 px-3 text-left">Book Name</th>
              <th className="py-3 px-3 text-left">Progress</th>
              <th className="py-3 px-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book, index) => {
              const progress = calculateProgress(book);

              return (
                <tr key={book.id} className="border-b border-gray-800 hover:bg-gray-800/40 text-white">
                  <td className="py-3 text-left">{index + 1}</td>
                  <td className="py-3 px-3">{book.bookName}</td>
                  <td className="py-3 px-3">
                    <div className="w-40 bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-sm ml-2">{progress}%</span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => navigate(`/BDetails/${book.id}`)}
                      className="p-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-all cursor-pointer"
                      title="Edit"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
         </div>
      </div>
    </Layout>
  );
}
