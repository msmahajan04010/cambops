import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, getDocs, updateDoc, doc, arrayUnion } from "firebase/firestore";
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

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionCredit, setCompletionCredit] = useState({});

  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedAssignmentForRevert, setSelectedAssignmentForRevert] = useState(null);

  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [totalHours, setTotalHours] = useState(0);

  const currentChapters = book?.chapters?.slice(
    indexOfFirst,
    indexOfLast
  );

  const userId = getCookie("userId");
  const userName = getCookie("userName");

  const API_KEY = import.meta.env.VITE_BREVO_API_KEY

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }


  const calculateTotalHours = (h, m, s) => {
    const hh = Number(h) || 0;
    const mm = Number(m) || 0;
    const ss = Number(s) || 0;

    const totalSeconds = hh * 3600 + mm * 60 + ss;
    const hoursDecimal = totalSeconds / 3600;

    return hoursDecimal.toFixed(2);
  };

  useEffect(() => {
    const result = calculateTotalHours(hours, minutes, seconds);
    setTotalHours(result);
  }, [hours, minutes, seconds]);

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
    if (!totalHours) {
      toast.error("Enter Chapter Hours");
      return;
    }


    try {

      setLoading(true);
      const updateData = {
        "recording.status": 6,
        "splitting.status": 6,
        "qc.status": 6,
        hours: Number(totalHours),
        deliveredAt: new Date()
      };

      if (selectedAssignment?.correction?.userId) {
        updateData["correction.status"] = 6;
      }

      await updateDoc(
        doc(db, "chapterAssignments", selectedAssignment.id),
        updateData
      );

      await addAdminHistory(selectedAssignment.id, "delivered", {
        hours: Number(totalHours)
      });

      toast.success("Chapter delivered successfully.");

      setShowDeliverModal(false);
      setChapterHours("");
      setSelectedAssignment(null);
      setLoading(false);
      setTotalHours(0);
      setSeconds("");
      setHours("");
      setMinutes("");
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

      const assignment = assignments.find(a => a.id === assignmentId);

      const chapter = book.chapters.find(
        c => c.chapterNumber === assignment.chapterNumber
      );

      const roles = ["recording", "splitting", "qc", "correction"];

      for (const role of roles) {
        const roleData = assignment[role];

        if (roleData?.userId) {
          const user = users.find(u => u.id === roleData.userId);

          await sendRevertMail({
            email: user?.email,
            userName: user?.firstName,
            bookName: book.bookName,
            chapterName: chapter?.chapterName,
            role: role
          });
        }
      }

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


  const handleConfirmDeliver = () => {

    const rec = selectedAssignment?.recording?.status;
    const split = selectedAssignment?.splitting?.status;
    const qc = selectedAssignment?.qc?.status;

    setShowConfirmModal(false);

    if (
      rec === 3 &&
      split === 3 &&
      qc === 3 &&
      (
        !selectedAssignment?.correction?.userId ||
        selectedAssignment?.correction?.status === 3
      )
    ) {
      setShowDeliverModal(true);
    } else {

      setCompletionCredit({
        recording: selectedAssignment.recording.userId,
        splitting: selectedAssignment.splitting.userId,
        qc: selectedAssignment.qc.userId
      });

      setShowCompleteModal(true);
    }
  };

  const handleCreditSelect = (role, creditUserId) => {
    setCompletionCredit(prev => ({
      ...prev,
      [role]: creditUserId
    }));
  };


  const sendRevertMail = async ({ email, userName, bookName, chapterName, role }) => {
    try {
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": API_KEY
        },
        body: JSON.stringify({
          sender: {
            name: "Admin",
            email: "mayurasmahajan@gmail.com"
          },
          to: [
            {
              email: email,
              name: userName
            }
          ],
          subject: "Assigned Work Reverted",
          htmlContent: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
    <p>Dear ${userName},</p>

    <p>We are writing to inform you that your previously assigned work has been reverted by the Administrator. Please find the details of the affected assignment below:</p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 8px 12px; font-weight: bold; width: 30%;">Book:</td>
        <td style="padding: 8px 12px;">${bookName}</td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="padding: 8px 12px; font-weight: bold;">Chapter:</td>
        <td style="padding: 8px 12px;">${chapterName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; font-weight: bold;">Module:</td>
        <td style="padding: 8px 12px;">${role}</td>
      </tr>
    </table>

    <p>If you have any questions or concerns regarding this action, please do not hesitate to log in to the platform and contact the Administrator directly.</p>

    <p style="text-align: center; margin: 24px 0;">
      <a href="https://cambops.vercel.app/"
         style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Log In to CambOps
      </a>
    </p>

    <p>If the button above does not work, copy and paste the following URL into your browser:</p>
    <p style="color: #2563eb;">https://cambops.vercel.app/</p>

    <p>
      Warm regards,<br/>
      <strong>The G8 Studio Team</strong>
    </p>
  </div>
`
        })
      });
    } catch (error) {
      console.error("Mail error:", error);
    }
  };


  const handleFinishCompletion = async () => {

    try {

      const updateData = {};
      const historyEntries = [];

      ["recording", "splitting", "qc"].forEach(role => {

        const roleData = selectedAssignment[role];

        if (roleData.status !== 3) {

          updateData[`${role}.status`] = 3;
          updateData[`${role}.completedBy`] = completionCredit[role];

          historyEntries.push({
            stage: role,
            action: "completed",
            role: "admin",
            userId: roleData.userId,
            completedBy: completionCredit[role],
            timestamp: new Date()
          });

        }

      });

      await updateDoc(
        doc(db, "chapterAssignments", selectedAssignment.id),
        {
          ...updateData,
          history: arrayUnion(...historyEntries)
        }
      );

      setShowCompleteModal(false);
      setShowDeliverModal(true);

      fetchData();

    } catch (error) {
      toast.error("Error completing chapter");
    }

  };

  const handleUnassign = async () => {

    try {

      const roleData = selectedAssignmentForRevert[selectedRole];
      const removedUser = roleData.userId;

      await updateDoc(
        doc(db, "chapterAssignments", selectedAssignmentForRevert.id),
        {
          [`${selectedRole}.userId`]: null,
          [`${selectedRole}.status`]: 0,
          history: arrayUnion({
            stage: selectedRole,
            action: "unassigned",
            role: "admin",
            removedUserId: removedUser,
            adminId: userId,
            timestamp: new Date()
          })
        }
      );



      const user = users.find(u => u.id === removedUser);
      const chapter = book.chapters.find(
        c => c.chapterNumber === selectedAssignmentForRevert.chapterNumber
      );

      await sendRevertMail({
        email: user?.email,
        userName: user?.firstName,
        bookName: book.bookName,
        chapterName: chapter?.chapterName,
        role: selectedRole
      });

      toast.success(`${selectedRole} reverted successfully`);

      setShowUnassignModal(false);
      fetchData();

    } catch (error) {
      toast.error("Error reverting assignment");
    }

  };

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
                <th className="py-3 px-3 text-left">Correction</th>
                <th className="py-3 px-3">Correction Status</th>
                <th className="py-3 px-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {currentChapters.map((chapter, index) => {

                const assignment = assignments.find(
                  a => a.chapterNumber === chapter.chapterNumber
                );
                console.log("assignment", assignment)

                const recording = assignment?.recording;
                const splitting = assignment?.splitting;
                const correction = assignment?.correction;
                const qc = assignment?.qc;

                const isFullyApproved =
                  recording?.status === 3 &&
                  splitting?.status === 3 &&
                  qc?.status === 3;

                const isDelivered =
                  recording?.status === 6 &&
                  splitting?.status === 6 &&
                  qc?.status === 6;

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
                        <button
                          disabled={recording.status === 3}
                          onClick={() => {
                            setSelectedRole("recording");
                            setSelectedAssignmentForRevert(assignment);
                            setShowUnassignModal(true);
                          }}
                          className={`px-2 py-1 rounded text-xs text-white ${getStatusLabel(recording.status).color
                            } ${recording.status === 3
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:opacity-80 cursor-pointer"
                            }`}
                        >
                          {getStatusLabel(recording.status).text}
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-3">


                      {getUserName(splitting?.userId)}




                    </td>
                    <td className="py-3 px-3 text-center">
                      {splitting && (
                        <button
                          disabled={splitting.status === 3}
                          onClick={() => {
                            setSelectedRole("splitting");
                            setSelectedAssignmentForRevert(assignment);
                            setShowUnassignModal(true);
                          }}
                          className={`px-2 py-1 rounded text-xs text-white ${getStatusLabel(splitting.status).color
                            } ${splitting.status === 3
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:opacity-80 cursor-pointer"
                            }`}
                        >
                          {getStatusLabel(splitting.status).text}
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-3">


                      {getUserName(qc?.userId)}


                    </td>

                    <td className="py-3 px-3 text-center">
                      {qc && (
                        <button
                          disabled={qc.status === 3}
                          onClick={() => {
                            setSelectedRole("qc");
                            setSelectedAssignmentForRevert(assignment);
                            setShowUnassignModal(true);
                          }}
                          className={`px-2 py-1 rounded text-xs text-white ${getStatusLabel(qc.status).color
                            } ${qc.status === 3
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:opacity-80 cursor-pointer"
                            }`}
                        >
                          {getStatusLabel(qc.status).text}
                        </button>
                      )}
                    </td>


                    <td className="py-3 px-3 text-center">


                      {getUserName(correction?.userId)}


                    </td>
                    <td className="py-3 px-3 text-center">
                      {correction ? (
                        <button
                          disabled={correction.status === 3}
                          onClick={() => {
                            setSelectedRole("correction");
                            setSelectedAssignmentForRevert(assignment);
                            setShowUnassignModal(true);
                          }}
                          className={`px-2 py-1 rounded text-xs text-white ${getStatusLabel(correction.status).color
                            } ${correction.status === 3
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:opacity-80 cursor-pointer"
                            }`}
                        >
                          {getStatusLabel(correction.status).text}
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>



                    <td className="py-3 px-3 text-center">

                      {isDelivered ? (

                        <span className="text-green-400 font-semibold">
                          {assignment?.hours ? `${assignment.hours} hrs` : "-"}
                        </span>

                      ) : (

                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setShowConfirmModal(true);
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

                      )}

                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>


        {showUnassignModal && (

          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">

            <div className="bg-gray-800 p-6 rounded-xl w-96 text-white">

              <h2 className="text-lg font-bold mb-4">
                Are you sure you want to revert this module from user ?
              </h2>

              <div className="flex gap-3">

                <button
                  onClick={handleUnassign}
                  className="flex-1 bg-red-600 py-2 rounded"
                >
                  YES
                </button>

                <button
                  onClick={() => setShowUnassignModal(false)}
                  className="flex-1 bg-gray-600 py-2 rounded"
                >
                  NO
                </button>

              </div>

            </div>
          </div>

        )}


        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-xl w-96 text-white">

              <h2 className="text-lg font-bold mb-4">
                Are you sure you want to deliver this chapter ?
              </h2>

              <div className="flex gap-3">

                <button
                  onClick={handleConfirmDeliver}
                  className="flex-1 bg-green-600 py-2 rounded"
                >
                  YES
                </button>

                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 bg-gray-600 py-2 rounded"
                >
                  NO
                </button>

              </div>

            </div>
          </div>
        )}

        {showCompleteModal && (

          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">

            <div className="bg-gray-800 p-6 rounded-xl w-[500px] text-white">

              <h2 className="text-xl font-bold mb-4">
                Complete Pending Work
              </h2>

              {["recording", "splitting", "qc"].map(role => {

                const roleData = selectedAssignment[role];

                return (

                  <div key={role} className="flex items-center justify-between mb-3">

                    <div className="capitalize">
                      {role}
                    </div>

                    <div className="flex gap-2">

                      <button
                        onClick={() => handleCreditSelect(role, roleData.userId)}
                        className={`px-3 py-1 rounded ${completionCredit[role] === roleData.userId
                          ? "bg-green-600"
                          : "bg-gray-600"
                          }`}
                      >
                        {getUserName(roleData.userId)}
                      </button>

                      <button
                        onClick={() => handleCreditSelect(role, userId)}
                        className={`px-3 py-1 rounded ${completionCredit[role] === userId
                            ? "bg-green-600"
                            : "bg-gray-600"
                          }`}
                      >
                        {userName}
                      </button>
                    </div>

                  </div>

                );

              })}

              <div className="flex gap-3 mt-4">

                <button
                  onClick={handleFinishCompletion}
                  className="flex-1 bg-green-600 py-2 rounded"
                >
                  Finish
                </button>

                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1 bg-gray-600 py-2 rounded"
                >
                  Cancel
                </button>

              </div>

            </div>
          </div>

        )}

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

        {showDeliverModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-xl w-[420px] text-white">

              <h2 className="text-xl font-bold mb-4">
                Enter Chapter Duration
              </h2>

              {/* Hours Minutes Seconds */}
              <div className="grid grid-cols-3 gap-3 mb-4">

                <div>
                  <label className="text-xs text-gray-400">Hours</label>
                  <input
                    type="number"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="w-full bg-gray-700 p-2 rounded"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400">Minutes</label>
                  <input
                    type="number"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    className="w-full bg-gray-700 p-2 rounded"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400">Seconds</label>
                  <input
                    type="number"
                    value={seconds}
                    onChange={(e) => setSeconds(e.target.value)}
                    className="w-full bg-gray-700 p-2 rounded"
                  />
                </div>

              </div>

              {/* Total Hours */}
              <div className="mb-4">
                <label className="text-xs text-gray-400">Total Hours</label>
                <input
                  type="text"
                  value={totalHours}
                  readOnly
                  className="w-full bg-gray-700 p-2 rounded text-green-400 font-semibold"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">

                <button
                  onClick={() => handleFinalDeliver(totalHours)}
                  className="flex-1 bg-green-600 py-2 rounded hover:bg-green-700"
                >
                  SAVE
                </button>

                <button
                  onClick={() => setShowDeliverModal(false)}
                  className="flex-1 bg-gray-600 py-2 rounded hover:bg-gray-700"
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