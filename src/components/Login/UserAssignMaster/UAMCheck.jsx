import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, getDocs, updateDoc, doc,arrayUnion  } from "firebase/firestore";
import { db } from "../../../firebase";
import Layout from "../Layout/AdminLayout";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from 'react-router-dom';

export default function BookDetails() {
  const navigate = useNavigate();
  const { bookId } = useParams();

  const [loading, setLoading] = useState(false);
  const [book, setBook] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);

  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [chapterHours, setChapterHours] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const chaptersPerPage = 10;

  const totalChapters = book?.chapters?.length || 0;
  const totalPages = Math.ceil(totalChapters / chaptersPerPage);

  const indexOfLast = currentPage * chaptersPerPage;
  const indexOfFirst = indexOfLast - chaptersPerPage;

  const currentChapters = book?.chapters?.slice(
    indexOfFirst,
    indexOfLast
  );

  const addAdminHistory = async (assignmentId, action, extra = {}) => {
  await updateDoc(doc(db, "chapterAssignments", assignmentId), {
    history: arrayUnion({
      stage: "admin",
      action,
      role: "admin",
      timestamp: new Date(),
      ...extra
    })
  });
};

  useEffect(() => {
    fetchData();
  }, []);

  // ==============================
  // Fetch Data
  // ==============================
  const fetchData = async () => {
    setLoading(true);

    const [bookSnap, assignSnap, userSnap] = await Promise.all([
      getDocs(collection(db, "books")),
      getDocs(collection(db, "chapterAssignments")),
      getDocs(collection(db, "users"))
    ]);

    const bookList = bookSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const assignList = assignSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const userList = userSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    setUsers(userList);

    const foundBook = bookList.find(b => b.id === bookId);
    setBook(foundBook);

    const filteredAssignments = assignList.filter(a => a.bookId === bookId);
    setAssignments(filteredAssignments);

    setLoading(false);
  };

  // ==============================
  // Helpers
  // ==============================
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "-";
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 1: return { text: "Assigned", color: "bg-gray-600" };
      case 2: return { text: "Accepted", color: "bg-blue-600" };
      case 3: return { text: "Completed", color: "bg-yellow-600" };
      case 4: return { text: "Under QC", color: "bg-indigo-600" };
      case 5: return { text: "QC Approved", color: "bg-purple-600" };
      case 6: return { text: "Delivered", color: "bg-green-600" };
      case 8: return { text: "Declined", color: "bg-red-600" };
      default: return { text: "-", color: "bg-gray-500" };
    }
  };

  // ==============================
  // Deliver Chapter
  // ==============================
const handleFinalDeliver = async () => {
  if (!chapterHours) {
    toast.error("Enter Chapter Hours");
    return;
  }


  try {

    setLoading(true);
    await updateDoc(
      doc(db, "chapterAssignments", selectedAssignment.id),
      {
        "recording.status": 6,
        "splitting.status": 6,
        "qc.status": 6,
        hours: Number(chapterHours),
        deliveredAt: new Date()
      }
    );

    await addAdminHistory(selectedAssignment.id, "delivered", {
      hours: Number(chapterHours)
    });

    toast.success("Chapter delivered successfully.");

    setShowDeliverModal(false);
    setChapterHours("");
    setSelectedAssignment(null);
     setLoading(false);
    fetchData();


  } catch (error) {
    setLoading(false);
    toast.error("Error delivering chapter");
  }
};
  // ==============================
  // Revert Chapter
  // ==============================
const handleRevert = async (assignmentId) => {
  try {
    setLoading(true);
    await updateDoc(doc(db, "chapterAssignments", assignmentId), {
      "recording.status": 2,
      "splitting.status": 2,
      "qc.status": 1,
      adminRemark: "Reverted by Admin",
      revertedAt: new Date()
    });

    await addAdminHistory(assignmentId, "reverted", {
      remark: "Reverted by Admin"
    });

    toast.success("Chapter reverted successfully");
    setLoading(false);
    fetchData();

  } catch (error) {
     setLoading(false);
    toast.error("Error reverting chapter");
  }
};

  if (loading) {
    return (
      <Layout title="Book Details" subtitle="View and manage all Book Specific Progress">
        <div className="flex items-center justify-center h-[70vh]">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!book) return null;

  return (
    <Layout title="Book Details" subtitle="View and manage all Book Specific Progress">
      <div className="bg-gray-900 p-6 rounded-xl text-white">

        <h2 className="text-2xl font-bold mb-2">
          Book : {book.bookName}
        </h2>
        <p className="mb-6">Book Code : {book.bookCode}</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-800 text-gray-300 text-xs uppercase">
              <tr>
                <th className="py-3 px-3 text-left">Sr.</th>
                <th className="py-3 px-3 text-left">Chapter</th>
                <th className="py-3 px-3 text-left">Recording</th>
                <th className="py-3 px-3">Rec Status</th>
                <th className="py-3 px-3 text-left">Splitting</th>
                <th className="py-3 px-3">Split Status</th>
                <th className="py-3 px-3 text-left">QC</th>
                <th className="py-3 px-3">QC Status</th>
                <th className="py-3 px-3">Admin</th>
              </tr>
            </thead>

            <tbody>
              {currentChapters.map((chapter, index) => {

                const assignment = assignments.find(
                  a => a.chapterNumber === chapter.chapterNumber
                );

                const recording = assignment?.recording;
                const splitting = assignment?.splitting;
                const qc = assignment?.qc;

                const isFullyApproved =
                  recording?.status === 3 &&
                  splitting?.status === 3 &&
                  qc?.status === 3;

                return (
                  <tr key={chapter.chapterNumber}
                    className="border-b border-gray-800 hover:bg-gray-800/40">

                    <td className="py-3 px-3">{indexOfFirst + index + 1}</td>
                    <td
                      className="py-3 px-3 cursor-pointer text-blue-400 hover:underline"
                      onClick={() =>
                        navigate(`/book/${bookId}/chapter/${chapter.chapterName}/${chapter.chapterNumber}`)
                      }
                    >
                      {chapter.chapterName}
                    </td>

                    <td className="py-3 px-3">
                      {getUserName(recording?.userId)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {recording && (
                        <span className={`px-2 py-1 rounded text-xs text-white ${getStatusLabel(recording.status).color}`}>
                          {getStatusLabel(recording.status).text}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {getUserName(splitting?.userId)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {splitting && (
                        <span className={`px-2 py-1 rounded text-xs text-white ${getStatusLabel(splitting.status).color}`}>
                          {getStatusLabel(splitting.status).text}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {getUserName(qc?.userId)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {qc && (
                        <span className={`px-2 py-1 rounded text-xs text-white ${getStatusLabel(qc.status).color}`}>
                          {getStatusLabel(qc.status).text}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {isFullyApproved ? (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setShowDeliverModal(true);
                            }}
                            className="bg-green-600 px-3 py-1 rounded text-sm"
                          >
                            Deliver
                          </button>

                          <button
                            onClick={() => handleRevert(assignment.id)}
                            className="bg-yellow-600 px-3 py-1 rounded text-sm"
                          >
                            Revert
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex gap-4 pt-6 border-t border-gray-800">


          <button
            onClick={() => navigate('/UAMList')}
            className="bg-gray-800 text-white border border-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-all duration-200 flex items-center gap-2"
          >

            LIST
          </button>
        </div>


        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-800">

            <p className="text-gray-400 text-sm">
              Showing {indexOfFirst + 1} -{" "}
              {Math.min(indexOfLast, totalChapters)} of {totalChapters}
            </p>

            <div className="flex items-center gap-2">

              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 transition"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-2 rounded-lg ${currentPage === i + 1
                    ? "bg-white text-black font-semibold"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 transition"
              >
                Next
              </button>

            </div>
          </div>
        )}

        {/* Deliver Modal */}
        {showDeliverModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-xl w-96 text-white">
              <h2 className="text-xl font-bold mb-4">
                Enter Chapter Hours
              </h2>

              <input
                type="number"
                step="0.5"
                value={chapterHours}
                onChange={(e) => setChapterHours(e.target.value)}
                className="w-full bg-gray-700 p-2 rounded mb-4"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleFinalDeliver}
                  className="flex-1 bg-green-600 py-2 rounded"
                >
                  SAVE
                </button>

                <button
                  onClick={() => setShowDeliverModal(false)}
                  className="flex-1 bg-gray-600 py-2 rounded"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}