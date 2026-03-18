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
  const [showRevertModal, setShowRevertModal] = useState(false);
const [adminRemark, setAdminRemark] = useState("");
const [revertAssignmentId, setRevertAssignmentId] = useState(null);


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


  const [manualEdit, setManualEdit] = useState(false);

useEffect(() => {
  if (!manualEdit) {
    const result = calculateTotalHours(hours, minutes, seconds);
    setTotalHours(result);
  }
}, [hours, minutes, seconds]);


const resetDurationFields = () => {
  setHours("");
  setMinutes("");
  setSeconds("");
  setTotalHours(0);
};



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
resetDurationFields();
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
const handleRevert = async () => {

  if (!adminRemark) {
    toast.error("Please enter remark");
    return;
  }

  try {

    setLoading(true);

    await updateDoc(doc(db, "chapterAssignments", revertAssignmentId), {
      "recording.status": 2,
      "splitting.status": 2,
      "qc.status": 1,
      adminRemark: adminRemark,
      revertedAt: new Date()
    });

    await addAdminHistory(revertAssignmentId, "reverted", {
      remark: adminRemark
    });

    toast.success("Chapter reverted successfully");

    setShowRevertModal(false);
    setAdminRemark("");
    setRevertAssignmentId(null);

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
                             disabled={[3, 6, 8].includes(recording.status)}
                          onClick={() => {
                            setSelectedRole("recording");
                            setSelectedAssignmentForRevert(assignment);
                            setShowUnassignModal(true);
                          }}
                          className={`px-2 py-1 rounded text-xs text-white ${getStatusLabel(recording.status).color
                            } ${[3, 6, 8].includes(recording.status)
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
                          disabled={[3, 6, 8].includes(splitting.status)}
                          onClick={() => {
                            setSelectedRole("splitting");
                            setSelectedAssignmentForRevert(assignment);
                            setShowUnassignModal(true);
                          }}
                          className={`px-2 py-1 rounded text-xs text-white ${getStatusLabel(splitting.status).color
                            } ${[3, 6, 8].includes(splitting.status)
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
                            disabled={[3, 6, 8].includes(qc.status)}
                          onClick={() => {
                            setSelectedRole("qc");
                            setSelectedAssignmentForRevert(assignment);
                            setShowUnassignModal(true);
                          }}
                          className={`px-2 py-1 rounded text-xs text-white ${getStatusLabel(qc.status).color
                            } ${[3, 6, 8].includes(qc.status)
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
                             onClick={() => {
    setRevertAssignmentId(assignment.id);
    setShowRevertModal(true);
  }}
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
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div 
      className="
        bg-gray-900 
        border border-gray-700/50 
        rounded-2xl 
        shadow-2xl 
        w-full max-w-md 
        overflow-hidden
        transform transition-all duration-200
        scale-100
      "
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-800/60">
        <h2 className="text-xl font-semibold text-red-400 flex items-center gap-3">
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          Confirm Unassignment
        </h2>
      </div>

      {/* Body */}
      <div className="px-6 py-5 text-gray-300">
        <p className="text-base leading-relaxed">
          You're about to <span className="font-medium text-white">remove this module</span> from the assigned user.
        </p>
        <p className="mt-3 text-sm text-gray-400">
          This action cannot be undone automatically.
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 py-5 bg-gray-950/40 flex gap-3 border-t border-gray-800/60">
        <button
          onClick={() => setShowUnassignModal(false)}
          className="
            flex-1 
            px-5 py-3 
            bg-gray-800 
            hover:bg-gray-700 
            text-gray-300 
            font-medium 
            rounded-lg 
            transition-colors
            border border-gray-700
          "
        >
          Cancel
        </button>

        <button
          onClick={handleUnassign}
          className="
            flex-1 
            px-5 py-3 
            bg-red-600/90 
            hover:bg-red-600 
            text-white 
            font-medium 
            rounded-lg 
            transition-all 
            shadow-red-900/30 
            hover:shadow-red-900/50
            active:scale-[0.98]
          "
        >
          Yes, Unassign
        </button>
      </div>
    </div>
  </div>
)}


      {showConfirmModal && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div
      className={`
        bg-gradient-to-b from-gray-900 to-gray-950 
        border border-gray-700/60 
        rounded-2xl 
        shadow-2xl shadow-black/40 
        w-full max-w-md 
        overflow-hidden
        transform transition-all duration-250
        scale-100
      `}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-800/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">
            Deliver Chapter
          </h2>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6 text-gray-300 space-y-3">
        <p className="text-base leading-relaxed">
          You're about to <span className="font-semibold text-green-400">deliver/publish</span> this chapter to the user.
        </p>
        <p className="text-sm text-gray-400">
          Once delivered, the chapter will become available and this action cannot be reversed.
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 py-5 bg-black/30 border-t border-gray-800/70 flex gap-3">
        <button
          onClick={() => setShowConfirmModal(false)}
          className={`
            flex-1 
            py-3.5 px-5
            bg-gray-800/80 
            hover:bg-gray-700/90 
            text-gray-300 
            font-medium 
            rounded-xl 
            transition-all duration-200
            border border-gray-700/50
            active:scale-[0.98]
          `}
        >
          Cancel
        </button>

        <button
          onClick={handleConfirmDeliver}
          className={`
            flex-1 
            py-3.5 px-5
            bg-gradient-to-r from-green-600 to-green-500 
            hover:from-green-500 hover:to-green-400 
            text-white 
            font-semibold 
            rounded-xl 
            transition-all duration-200
            shadow-lg shadow-green-900/30 
            hover:shadow-green-800/50
            active:scale-[0.98]
          `}
        >
          Yes, Deliver Chapter
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
  type="number"
  value={totalHours}
  onChange={(e) => {
    setManualEdit(true);
    setTotalHours(e.target.value);
  }}
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
                  onClick={() => {
  setShowDeliverModal(false);
  resetDurationFields();
}}
                  className="flex-1 bg-gray-600 py-2 rounded hover:bg-gray-700"
                >
                  CANCEL
                </button>

              </div>

            </div>
          </div>
        )}

        {showRevertModal && (
  <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div
      className={`
        bg-gradient-to-b from-gray-900 to-gray-950
        border border-gray-700/60
        rounded-2xl
        shadow-2xl shadow-black/50
        w-full max-w-md
        overflow-hidden
        transform transition-all duration-200
      `}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-800/70 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-6 h-6 text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white">
          Revert Action
        </h2>
      </div>

      {/* Body */}
      <div className="px-6 pt-6 pb-4">
        <p className="text-gray-300 mb-4 leading-relaxed">
          Please provide a clear reason for <span className="font-medium text-yellow-300">reverting</span> this action.
        </p>

        <textarea
          className={`
            w-full 
            min-h-[110px]
            bg-gray-800/70 
            border border-gray-600 
            text-gray-100 
            placeholder-gray-500
            rounded-xl
            px-4 py-3
            focus:outline-none 
            focus:border-yellow-500/60 
            focus:ring-1 
            focus:ring-yellow-500/30
            resize-none
            transition-all duration-150
          `}
          value={adminRemark}
          onChange={(e) => setAdminRemark(e.target.value)}
         
          maxLength={500}
        />

        <p className="mt-2 text-xs text-gray-500 text-right">
          {adminRemark.length} / 500
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 py-5 bg-black/30 border-t border-gray-800/70 flex gap-3">
        <button
          onClick={() => {
            setShowRevertModal(false);
            setAdminRemark("");
            setRevertAssignmentId(null);
          }}
          className={`
            flex-1
            py-3.5
            bg-gray-800/90 
            hover:bg-gray-700/90 
            text-gray-300 
            font-medium 
            rounded-xl 
            transition-all duration-200
            border border-gray-700/50
            active:scale-[0.98]
          `}
        >
          Cancel
        </button>

        <button
          onClick={handleRevert}
          disabled={!adminRemark.trim()}
          className={`
            flex-1
            py-3.5
            font-semibold
            rounded-xl
            transition-all duration-200
            active:scale-[0.98]
            ${
              adminRemark.trim()
                ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white shadow-lg shadow-yellow-900/30 hover:shadow-yellow-800/50'
                : 'bg-yellow-700/40 text-yellow-300/60 cursor-not-allowed'
            }
          `}
        >
          Confirm Revert
        </button>
      </div>
    </div>
  </div>
)}

      </div>
    </Layout>
  );
}