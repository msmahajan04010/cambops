import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc, deleteDoc, writeBatch, arrayUnion } from "firebase/firestore";
import toast from "react-hot-toast";
import { db } from "../../../firebase";
import Layout from "../Layout/AdminLayout";

export default function MyAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [remark, setRemark] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [bookDetails, setBookDetails] = useState(null);
  const [modalMode, setModalMode] = useState(null);

  const userId = getCookie("userId");


  const userTypeId = getCookie("userTypeId");
  const [loading, setLoading] = useState(false);





  const addHistory = async (assignmentId, stage, action, extra = {}) => {
    await updateDoc(doc(db, "chapterAssignments", assignmentId), {
      history: arrayUnion({
        stage,
        action,
        userId: userId,
        role: userTypeId,
        timestamp: new Date(),
        ...extra
      })
    });
  };


  const fetchAssignments = async () => {

    const snap = await getDocs(collection(db, "chapterAssignments"));

    const allAssignments = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    console.log("allAssignments", allAssignments)
    const role = parseInt(userTypeId);
    const uid = userId;

    const filtered = allAssignments.filter(a => {
      if (role === 2) {
        return a.recording?.userId === uid;
      }

      if (role === 3) {
        return a.splitting?.userId === uid;
      }

      if (role === 4) {
        return a.qc?.userId === uid;
      }

      if (role === 5) {
        return (
          a.recording?.userId === uid ||
          a.splitting?.userId === uid
        );
      }

      return false;
    });

    setAssignments(filtered);
  };

  const handleAcceptClick = async (assignment) => {
    try {
      const bookSnap = await getDocs(collection(db, "books"));
      const books = bookSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const book = books.find(b => b.id === assignment.bookId);

      setBookDetails(book);
      setSelectedAssignment(assignment);
      setModalMode("accept");
      setShowBookModal(true);

    } catch (error) {
      console.error(error);
    }
  };


  const handleViewClick = async (assignment) => {
    try {
      const bookSnap = await getDocs(collection(db, "books"));
      const books = bookSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const book = books.find(b => b.id === assignment.bookId);

      setBookDetails(book);
      setSelectedAssignment(assignment);
      setModalMode("view");
      setShowBookModal(true);

    } catch (error) {
      console.error(error);
    }
  };

  const confirmAccept = async () => {
    if (!selectedAssignment) return;

    setLoading(true);
    const updatePayload = {};
    const historyEntries = [];

    if (selectedAssignment.recording?.userId === userId) {
      updatePayload["recording.status"] = 2;

      historyEntries.push({
        stage: "recording",
        action: "accepted",
        userId: userId,
        role: userTypeId,
        timestamp: new Date()
      });
    }

    if (selectedAssignment.splitting?.userId === userId) {
      updatePayload["splitting.status"] = 2;

      historyEntries.push({
        stage: "splitting",
        action: "accepted",
        userId: userId,
        role: userTypeId,
        timestamp: new Date()
      });
    }

    if (selectedAssignment.qc?.userId === userId) {
      updatePayload["qc.status"] = 2;

      historyEntries.push({
        stage: "qc",
        action: "accepted",
        userId: userId,
        role: userTypeId,
        timestamp: new Date()
      });
    }

    await updateDoc(doc(db, "chapterAssignments", selectedAssignment.id), {
      ...updatePayload,
      history: arrayUnion(...historyEntries)
    });

    toast.success("Chapter accepted successfully.");

    setShowBookModal(false);
    setSelectedAssignment(null);
    setBookDetails(null);
    setLoading(false);
    fetchAssignments();
  };

  const handleComplete = async (a) => {
    const updatePayload = {};
    const historyEntries = [];
    setLoading(true);

    if (a.recording?.userId === userId) {
      updatePayload["recording.status"] = 3;

      historyEntries.push({
        stage: "recording",
        action: "completed",
        userId: userId,
        role: userTypeId,
        timestamp: new Date()
      });
    }

    if (a.splitting?.userId === userId) {
      updatePayload["splitting.status"] = 3;

      historyEntries.push({
        stage: "splitting",
        action: "completed",
        userId: userId,
        role: userTypeId,
        timestamp: new Date()
      });
    }

    if (a.qc?.userId === userId) {
      updatePayload["qc.status"] = 3;

      historyEntries.push({
        stage: "qc",
        action: "completed",
        userId: userId,
        role: userTypeId,
        timestamp: new Date()
      });
    }

    await updateDoc(doc(db, "chapterAssignments", a.id), {
      ...updatePayload,
      history: arrayUnion(...historyEntries)
    });

    toast.success("Chapter completed successfully.");
    fetchAssignments();
    setLoading(false);
  };



  const handleDecline = async () => {
    if (!remark) {
      toast.error("Please enter remark");
      return;
    }
    setLoading(true);
    const updatePayload = {};
    const historyEntries = [];

    if (selectedAssignment.recording?.userId === userId) {
      updatePayload["recording.status"] = 8;

      historyEntries.push({
        stage: "recording",
        action: "declined",
        userId: userId,
        role: userTypeId,
        remark: remark,
        timestamp: new Date()
      });
    }

    if (selectedAssignment.splitting?.userId === userId) {
      updatePayload["splitting.status"] = 8;

      historyEntries.push({
        stage: "splitting",
        action: "declined",
        userId: userId,
        role: userTypeId,
        remark: remark,
        timestamp: new Date()
      });
    }

    if (selectedAssignment.qc?.userId === userId) {
      updatePayload["qc.status"] = 8;

      historyEntries.push({
        stage: "qc",
        action: "declined",
        userId: userId,
        role: userTypeId,
        remark: remark,
        timestamp: new Date()
      });
    }

    updatePayload["userRemark"] = remark;

    await updateDoc(doc(db, "chapterAssignments", selectedAssignment.id), {
      ...updatePayload,
      history: arrayUnion(...historyEntries)
    });

    toast.success("Chapter declined successfully.");

    setRemark("");
    setSelectedAssignment(null);
    setSelectedId(null);
    setLoading(false);
    fetchAssignments();
  };

  const getStatusText = (status) => {
    switch (status) {
      case 1: return "Assigned";
      case 2: return "Accepted";
      case 3: return "Completed - Waiting QC";
      case 4: return "Under QC";
      case 5: return "QC Approved";
      case 6: return "Delivered";
      case 8: return "Declined";
      default: return "-";
    }
  };

  const getCurrentStatus = (assignment) => {
    if (assignment.recording?.userId === userId) {
      return getStatusText(assignment.recording?.status);
    }

    if (assignment.splitting?.userId === userId) {
      return getStatusText(assignment.splitting?.status);
    }

    if (assignment.qc?.userId === userId) {
      return getStatusText(assignment.qc?.status);
    }

    return "-";
  };

  const getAssignmentType = (assignment) => {
    const isRec = assignment.recording?.userId === userId;
    const isSplit = assignment.splitting?.userId === userId;
    const isQc = assignment.qc?.userId === userId;

    if (isRec && isSplit) return "Recording & Splitting";
    if (isRec) return "Recording";
    if (isSplit) return "Splitting";
    if (isQc) return "QC";

    return "-";
  };

  if (loading) {
    return (
      <Layout title="My Assignments" subtitle="Assignment for the Recording/Splitting Users">
        <div className="flex items-center justify-center h-[70vh]">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Assignments" subtitle="Assignment for the Recording/Splitting Users">

      
      <div className="bg-gray-900 p-6 rounded-xl text-white">

        <div className="mb-4">
          <button
            onClick={fetchAssignments}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white font-semibold"
          >
            🔄
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">

            <thead className="bg-gray-800 text-gray-300 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 text-left">Sr. No.</th>
                <th className="py-3 px-4 text-left">Book</th>
                <th className="py-3 px-4 text-left">Chapter</th>
                <th className="py-3 px-4 text-center">Type</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Book Details</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-gray-400">
                    Click "Load My Assignments" to fetch data
                  </td>
                </tr>
              ) : (
                assignments.map((a, index) => {
                  const currentStatus = getCurrentStatus(a);

                  return (
                    <tr
                      key={a.id}
                      className="border-b border-gray-800 hover:bg-gray-800/40 transition"
                    >
                      <td className="py-3 px-4">{index + 1}</td>
                      <td className="py-3 px-4">{a.bookName}</td>
                      <td className="py-3 px-4">{a.chapterName}</td>

                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-1 rounded text-xs bg-gray-700 text-white">
                          {getAssignmentType(a)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {currentStatus}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {currentStatus === 'Accepted' ? (<button onClick={() => handleViewClick(a)}
                          className="text-blue-400 hover:text-blue-600 underline text-sm" >

                          View </button>) : (<span className="text-gray-500">-</span>)} </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">

                          {currentStatus === 'Assigned' && (
                            <>
                              {/* ACCEPT BUTTON */}
                              <button
                                onClick={() => handleAcceptClick(a)}
                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center justify-center"
                                title="Accept"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </button>

                              {/* DECLINE BUTTON */}
                              <button
                                onClick={() => {
                                  setSelectedAssignment(a);
                                  setSelectedId(a.id);
                                }}
                                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center justify-center"
                                title="Decline"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </>
                          )}

                          {currentStatus === 'Accepted' && (
                            <button
                              onClick={() => handleComplete(a)}
                              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center justify-center"
                              title="Mark as Complete"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9 12l2 2 4-4"
                                />
                                <circle cx="12" cy="12" r="9" />
                              </svg>
                            </button>
                          )}

                          {parseInt(currentStatus) >= 3 && (
                            <span className="text-gray-400 text-sm">
                              No Action
                            </span>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>

        {showBookModal && bookDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-2xl w-[500px] text-white">
              <h2 className="text-xl font-bold mb-4">Book Details</h2>

              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-gray-400">Book Name:</span>{" "}
                  <span className="font-semibold">{bookDetails.bookName}</span>
                </p>

                <p>
                  <span className="text-gray-400">Book Code:</span>{" "}
                  <span className="font-semibold">{bookDetails.bookCode}</span>
                </p>

                <p>
                  <span className="text-gray-400">Language:</span>{" "}
                  <span className="font-semibold">{bookDetails.language}</span>
                </p>

                {bookDetails.bookLink && (
                  <p>
                    <span className="text-gray-400">Reference Link:</span>{" "}
                    <a
                      href={bookDetails.bookLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline"
                    >
                      Open Link
                    </a>
                  </p>
                )}

                {bookDetails.pdfUrl && (
                  <p>
                    <span className="text-gray-400">Download PDF:</span>{" "}
                    <a
                      href={bookDetails.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="text-green-400 underline"
                    >
                      Download
                    </a>
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-6">

                {modalMode === "accept" && (
                  <>
                    <button
                      onClick={confirmAccept}
                      className="flex-1 bg-green-600 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      Confirm Accept
                    </button>

                    <button
                      onClick={() => setShowBookModal(false)}
                      className="flex-1 bg-gray-600 py-2 rounded-lg hover:bg-gray-700 transition"
                    >
                      Cancel
                    </button>
                  </>
                )}

                {modalMode === "view" && (
                  <button
                    onClick={() => setShowBookModal(false)}
                    className="w-full bg-gray-600 py-2 rounded-lg hover:bg-gray-700 transition"
                  >
                    Close
                  </button>
                )}

              </div>
            </div>
          </div>
        )}
        {/* Decline Modal */}
        {selectedId && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-xl w-96">
              <h3 className="text-lg font-bold mb-4">Decline Remark</h3>

              <textarea
                className="w-full bg-gray-700 p-2 rounded mb-4"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />

              <button
                onClick={handleDecline}
                className="w-full bg-red-500 py-2 rounded"
              >
                Submit
              </button>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}

// helper
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}
