import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc, query, where, arrayUnion } from "firebase/firestore";
import { db } from "../../../firebase";
import Layout from "../Layout/AdminLayout";
import toast from "react-hot-toast";

export default function QCModule() {
  const [assignments, setAssignments] = useState([]);
  const [remark, setRemark] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const userId = getCookie("userId");
  const [modalMode, setModalMode] = useState(null);
  const [remarkType, setRemarkType] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [bookDetails, setBookDetails] = useState(null);

  const addHistory = async (assignmentId, action, extra = {}) => {
    await updateDoc(doc(db, "chapterAssignments", assignmentId), {
      history: arrayUnion({
        stage: "qc",
        action,
        userId: userId,
        role: "qc",
        timestamp: new Date(),
        ...extra
      })
    });
  };


  const isTeamCompleted = (assignment) => {
    const recDone = assignment.recording?.status === 3;
    const splitDone = assignment.splitting?.status === 3;

    return recDone && splitDone;
  };




  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  const fetchAssignments = async () => {
    setLoading(true);
    const q = query(
      collection(db, "chapterAssignments"),
      where("qc.userId", "==", userId)
    );

    const snap = await getDocs(q);

    const data = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    setLoading(false);

    setAssignments(data);
  };

  useEffect(() => {
    fetchAssignments();
  }, []);



  const handleAcceptClick = async (assignment) => {
    try {
      const bookSnap = await getDocs(collection(db, "books"));
      const books = bookSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      const book = books.find(b => b.id === assignment.bookId);

      setBookDetails(book);
      setSelectedAssignment(assignment);
      setModalMode("accept");
      setShowBookModal(true);

    } catch (error) {
      console.error(error);
    }
  };

  const confirmQCAccept = async () => {
    if (!selectedAssignment) return;

    setLoading(true);

    await updateDoc(doc(db, "chapterAssignments", selectedAssignment.id), {
      "qc.status": 2,
      qcAcceptedAt: new Date()
    });

    await addHistory(selectedAssignment.id, "accepted");

    toast.success("QC Accepted successfully.");


    setShowBookModal(false);
    setSelectedAssignment(null);
    setBookDetails(null);
    setLoading(false);
    fetchAssignments();
  };

  const handleFinish = async (id) => {
    setLoading(true);
    await updateDoc(doc(db, "chapterAssignments", id), {
      "qc.status": 3,
      qcCompletedAt: new Date()
    });


    await addHistory(id, "approved");

    toast.success("QC Approved successfully.");
    setLoading(false);
    fetchAssignments();
  };

  const handleReassign = async () => {
    if (!remark) {
      toast.error("Please enter QC remark");
      return;
    }

    try {
      setLoading(true);
      await updateDoc(doc(db, "chapterAssignments", selectedId), {
        "recording.status": 2,
        "splitting.status": 2,
        "qc.status": 1,
        qcRemark: remark,
        qcReassignedAt: new Date()
      });

      await addHistory(selectedId, "reassigned", {
        remark: remark
      });

      toast.success("Chapter sent back for rework.");

      setRemark("");
      setSelectedId(null);
      setLoading(false);
      fetchAssignments();

    } catch (error) {
      setLoading(false);
      toast.error("Error during reassignment");
    }
  };

  const getStatusText = (status) => {
    switch (parseInt(status)) {
      case 1: return "Assigned";
      case 2: return "Accepted";
      case 3: return "Completed - Waiting QC";
      case 4: return "Under QC Observation";
      case 5: return "QC Approved";
      case 6: return "Delivered";
      default: return "-";
    }
  };

  const handleDecline = async () => {
    if (!remark) {
      toast.error("Please enter remark");
      return;
    }

    if (!selectedAssignment) return;

    try {
      setLoading(true);
      await updateDoc(
        doc(db, "chapterAssignments", selectedAssignment.id),
        {
          "qc.status": 8,
          qcRemark: remark,
          declinedAt: new Date()
        }
      );

      await addHistory(selectedAssignment.id, "declined", {
        remark: remark
      });

      toast.success("QC Declined successfully.");

      setRemark("");
      setSelectedId(null);
      setSelectedAssignment(null);
      setLoading(false);
      fetchAssignments();

    } catch (error) {
      setLoading(false);
      toast.error("Error declining chapter");
    }
  };


  if (loading) {
    return (
      <Layout title="QC Panel" subtitle="QC Module">
        <div className="flex items-center justify-center h-[70vh]">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="QC Panel" subtitle="QC Module">
      <div className="bg-gray-900 p-6 rounded-xl text-white">

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-800 text-gray-300 text-xs uppercase tracking-wider">
              <tr className="border-b border-gray-700">
                <th className="py-3 px-4 text-left">Sr</th>
                <th className="py-3 px-4 text-left">Book</th>
                <th className="py-3 px-4 text-left">Chapter</th>
                {/* <th className="py-3 px-4 text-left">User</th> */}
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {assignments.map((a, index) => (
                <tr key={a.id} className="border-b border-gray-800 hover:bg-gray-800/40 transition">
                  <td className="py-3 px-3">{index + 1}</td>
                  <td className="py-3 px-3">{a.bookName}</td>
                  <td className="py-3 px-3">{a.chapterName}</td>
                  {/* <td className="py-3 px-3">{a.userName}</td> */}
                  <td className="py-3 px-3 text-center">{getStatusText(a.qc?.status)}</td>

                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center gap-2">
                      {a.qc?.status === 1 && (
                        <>
                          {isTeamCompleted(a) ? (
                            <>
                              {/* ACCEPT */}
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

                              {/* DECLINE */}
                              <button
                                onClick={() => {
                                  setSelectedAssignment(a);
                                  setSelectedId(a.id);
                                  setRemarkType("decline");
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
                          ) : (
                            <span className="text-yellow-400 text-xs">
                              Waiting for Recording & Splitting completion
                            </span>
                          )}
                        </>
                      )}
                      {a.qc?.status === 2 && (
                        <>
                          {/* FINISH */}
                          <button
                            onClick={() => handleFinish(a.id)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center justify-center"
                            title="Finish QC"
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

                          {/* REASSIGN */}
                          <button
                            onClick={() => {
                              setSelectedAssignment(a);
                              setSelectedId(a.id);
                              setRemarkType("reassign");
                            }}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center justify-center"
                            title="Reassign"
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
                                d="M4 4v6h6M20 20v-6h-6"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M20 14a8 8 0 00-14-4m-2 4a8 8 0 0014 4"
                              />
                            </svg>
                          </button>
                        </>
                      )}


                      {a.qc?.status === 3 && (
                        <span className="text-green-400 text-sm">
                          QC APPROVED
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
                      onClick={confirmQCAccept}
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
        {/* QC Remark Modal */}
        {selectedId && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-xl w-96">
              <h3 className="text-lg font-bold mb-4">
                {remarkType === "decline" ? "Decline Remark" : "Reassign Remark"}
              </h3>

              <textarea
                className="w-full bg-gray-700 p-2 rounded mb-4"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />

              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => {
                    if (remarkType === "decline") {
                      handleDecline();
                    } else if (remarkType === "reassign") {
                      handleReassign();
                    }
                  }}
                  className="flex-1 bg-red-500 text-white py-2 rounded"
                >
                  SAVE
                </button>

                <button
                  onClick={() => {
                    setSelectedId(null);
                    setSelectedAssignment(null);
                    setRemark("");
                    setRemarkType(null);
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 rounded"
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
