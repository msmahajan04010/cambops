// import React, { useEffect, useState } from "react";
// import { collection, getDocs, updateDoc, doc, deleteDoc, writeBatch, arrayUnion } from "firebase/firestore";
// import toast from "react-hot-toast";
// import { db } from "../../../firebase";
// import Layout from "../Layout/AdminLayout";

// export default function MyAssignments() {
//   const [assignments, setAssignments] = useState([]);
//   const [remark, setRemark] = useState("");
//   const [selectedId, setSelectedId] = useState(null);

//   const [showBookModal, setShowBookModal] = useState(false);
//   const [selectedAssignment, setSelectedAssignment] = useState(null);
//   const [bookDetails, setBookDetails] = useState(null);
//   const [modalMode, setModalMode] = useState(null);

//   const [remarkModalOpen, setRemarkModalOpen] = useState(false);
//   const [selectedRemark, setSelectedRemark] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const rowsPerPage = 10;
//   const [users, setUsers] = useState([]);

//   const indexOfLast = currentPage * rowsPerPage;
//   const indexOfFirst = indexOfLast - rowsPerPage;

//   const currentAssignments = assignments.slice(indexOfFirst, indexOfLast);

//   const totalPages = Math.ceil(assignments.length / rowsPerPage);


//   const fetchUsers = async () => {
//   const snap = await getDocs(collection(db, "users"));

//   const list = snap.docs.map(d => ({
//     id: d.id,
//     ...d.data()
//   }));

//   setUsers(list);
// };


// useEffect(() => {
//   fetchUsers();
// }, []);

//   const openRemarkModal = (remark) => {
//     setSelectedRemark(remark);
//     setRemarkModalOpen(true);
//   };

//   const closeRemarkModal = () => {
//     setRemarkModalOpen(false);
//     setSelectedRemark(null);
//   };

//   const userId = getCookie("userId");


//   const userTypeId = getCookie("userTypeId");
//   const [loading, setLoading] = useState(false);



//   const isFinishBlocked = (assignment) => {
//     const role = parseInt(userTypeId);

//     const isRecordingUser = assignment.recording?.userId === userId;
//     const splittingDone = assignment.splitting?.status === 3;

//     const isCorrectionUser = assignment.correction?.userId === userId;
// const qcDone = assignment.qc?.status === 3;

// if (isCorrectionUser && !qcDone) {
//   return true;
// }




//     if (role === 5) return false; // Recording + Splitting user allowed

//     if (isRecordingUser && !splittingDone) {
//       return true;
//     }

//     return false;
//   };


//    const API_KEY = import.meta.env.VITE_BREVO_API_KEY

// const notifyAdmin = async ({ action, bookName, chapterName, userName, remark, type }) => {
//   try {

//     const admins = users.filter(u => u.userTypeId === 1);

//     for (const admin of admins) {

//       const remarkRow =
//         action === "DECLINED" && remark
//           ? `
//       <tr>
//         <td style="padding: 8px 12px; font-weight: bold;">Remark:</td>
//         <td style="padding: 8px 12px;">${remark}</td>
//       </tr>
//       `
//           : "";

//       await fetch("https://api.brevo.com/v3/smtp/email", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "api-key": API_KEY
//         },
//         body: JSON.stringify({
//           sender: {
//             name: "Phoenix Verse",
//             email: "mayurasmahajan@gmail.com"
//           },
//           to: [
//             {
//               email: admin.email,
//               name: admin.firstName
//             }
//           ],
//           subject: `User ${action} Chapter`,
//           htmlContent: `
//   <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
//     <p>Dear Team,</p>

//     <p>This is to inform you that a user activity has been recorded on the platform. Please find the details of the action below:</p>

//     <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
//       <tr>
//         <td style="padding: 8px 12px; font-weight: bold; width: 30%;">User:</td>
//         <td style="padding: 8px 12px;">${userName}</td>
//       </tr>
//       <tr style="background-color: #f5f5f5;">
//         <td style="padding: 8px 12px; font-weight: bold;">Action:</td>
//         <td style="padding: 8px 12px;">${action}</td>
//       </tr>
//       <tr>
//         <td style="padding: 8px 12px; font-weight: bold;">Book:</td>
//         <td style="padding: 8px 12px;">${bookName}</td>
//       </tr>
//       <tr>
//   <td style="padding: 8px 12px; font-weight: bold;">Work Type:</td>
//   <td style="padding: 8px 12px;">${type}</td>
// </tr>
//       <tr style="background-color: #f5f5f5;">
//         <td style="padding: 8px 12px; font-weight: bold;">Chapter:</td>
//         <td style="padding: 8px 12px;">${chapterName}</td>
//       </tr>

//       ${remarkRow}

//     </table>

//     <p>To review this activity, please log in to the platform using the link below:</p>

//     <p style="text-align: center; margin: 24px 0;">
//       <a href="https://cambops.vercel.app/"
//          style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
//         Log In to G8 Studio
//       </a>
//     </p>

//     <p>If the button above does not work, copy and paste the following URL into your browser:</p>
//     <p style="color: #2563eb;">https://cambops.vercel.app/</p>

//     <p>
//       Warm regards,<br/>
//       <strong>The G8 Studio Team</strong>
//     </p>
//   </div>
// `
//         })
//       });

//     }

//   } catch (error) {
//     console.error("Admin mail error:", error);
//   }
// };

// const getCurrentUserName = () => {
//   const user = users.find(u => u.userId === userId || u.id === userId);
//   return user ? `${user.firstName} ${user.lastName}` : "User";
// };


//   const isAcceptBlocked = (assignment) => {
//   const role = parseInt(userTypeId);

//   if (role === 6) {
//     const qcDone = assignment.qc?.status === 3;
//     return !qcDone;
//   }

//   return false;
// };


//   const addHistory = async (assignmentId, stage, action, extra = {}) => {
//     await updateDoc(doc(db, "chapterAssignments", assignmentId), {
//       history: arrayUnion({
//         stage,
//         action,
//         userId: userId,
//         role: userTypeId,
//         timestamp: new Date(),
//         ...extra
//       })
//     });
//   };


//   const fetchAssignments = async () => {

//     const snap = await getDocs(collection(db, "chapterAssignments"));

//     const allAssignments = snap.docs.map(d => ({
//       id: d.id,
//       ...d.data()
//     }));

//     console.log("allAssignments", allAssignments)
//     const role = parseInt(userTypeId);
//     const uid = userId;

//     const filtered = allAssignments.filter(a => {
//       if (role === 3) {
//         return a.recording?.userId === uid;
//       }

//       if (role === 2) {
//         return a.splitting?.userId === uid;
//       }

//       if (role === 4) {
//         return a.qc?.userId === uid;
//       }

//       if (role === 5) {
//         return (
//           a.recording?.userId === uid ||
//           a.splitting?.userId === uid
//         );
//       }

//       if (role === 6) {
//   return a.correction?.userId === uid;
// }

//       return false;
//     });

//     setAssignments(filtered);
//     setCurrentPage(1);
//   };

//   const handleAcceptClick = async (assignment) => {
//     try {
//       const bookSnap = await getDocs(collection(db, "books"));
//       const books = bookSnap.docs.map(d => ({ id: d.id, ...d.data() }));

//       const book = books.find(b => b.id === assignment.bookId);

//       setBookDetails(book);
//       setSelectedAssignment(assignment);
//       setModalMode("accept");
//       setShowBookModal(true);

//     } catch (error) {
//       console.error(error);
//     }
//   };


//   const handleViewClick = async (assignment) => {
//     try {
//       const bookSnap = await getDocs(collection(db, "books"));
//       const books = bookSnap.docs.map(d => ({ id: d.id, ...d.data() }));

//       const book = books.find(b => b.id === assignment.bookId);

//       setBookDetails(book);
//       setSelectedAssignment(assignment);
//       setModalMode("view");
//       setShowBookModal(true);

//     } catch (error) {
//       console.error(error);
//     }
//   };

//   const confirmAccept = async () => {
//     if (!selectedAssignment) return;

//     setLoading(true);
//     const updatePayload = {};
//     const historyEntries = [];

//     if (selectedAssignment.recording?.userId === userId) {
//       updatePayload["recording.status"] = 2;

//       historyEntries.push({
//         stage: "recording",
//         action: "accepted",
//         userId: userId,
//         role: userTypeId,
//         timestamp: new Date()
//       });
//     }

//     if (selectedAssignment.splitting?.userId === userId) {
//       updatePayload["splitting.status"] = 2;

//       historyEntries.push({
//         stage: "splitting",
//         action: "accepted",
//         userId: userId,
//         role: userTypeId,
//         timestamp: new Date()
//       });
//     }

//     if (selectedAssignment.qc?.userId === userId) {
//       updatePayload["qc.status"] = 2;

//       historyEntries.push({
//         stage: "qc",
//         action: "accepted",
//         userId: userId,
//         role: userTypeId,
//         timestamp: new Date()
//       });
//     }

//     if (selectedAssignment.correction?.userId === userId) {
//   updatePayload["correction.status"] = 2;

//   historyEntries.push({
//     stage: "correction",
//     action: "accepted",
//     userId: userId,
//     role: userTypeId,
//     timestamp: new Date()
//   });
// }

//     await updateDoc(doc(db, "chapterAssignments", selectedAssignment.id), {
//       ...updatePayload,
//       history: arrayUnion(...historyEntries)
//     });

//     await notifyAdmin({
//   action: "ACCEPTED",
//   bookName: selectedAssignment.bookName,
//   chapterName: selectedAssignment.chapterName,
//   userName: getCurrentUserName(),
//    type: getAssignmentType(selectedAssignment)
// });

//     toast.success("Chapter accepted successfully.");

//     setShowBookModal(false);
//     setSelectedAssignment(null);
//     setBookDetails(null);
//     setLoading(false);
//     fetchAssignments();
//   };

//   const handleComplete = async (a) => {
//     const updatePayload = {};
//     const historyEntries = [];
//     setLoading(true);

//     if (a.recording?.userId === userId) {
//       updatePayload["recording.status"] = 3;

//       historyEntries.push({
//         stage: "recording",
//         action: "completed",
//         userId: userId,
//         role: userTypeId,
//         timestamp: new Date()
//       });
//     }

//     if (a.splitting?.userId === userId) {
//       updatePayload["splitting.status"] = 3;

//       historyEntries.push({
//         stage: "splitting",
//         action: "completed",
//         userId: userId,
//         role: userTypeId,
//         timestamp: new Date()
//       });
//     }

//     if (a.qc?.userId === userId) {
//       updatePayload["qc.status"] = 3;

//       historyEntries.push({
//         stage: "qc",
//         action: "completed",
//         userId: userId,
//         role: userTypeId,
//         timestamp: new Date()
//       });
//     }

//     if (a.correction?.userId === userId) {
//   updatePayload["correction.status"] = 3;

//   historyEntries.push({
//     stage: "correction",
//     action: "completed",
//     userId: userId,
//     role: userTypeId,
//     timestamp: new Date()
//   });
// }

//     await updateDoc(doc(db, "chapterAssignments", a.id), {
//       ...updatePayload,
//       history: arrayUnion(...historyEntries)
//     });


//     await notifyAdmin({
//   action: "COMPLETED",
//   bookName: a.bookName,
//   chapterName: a.chapterName,
//   userName: getCurrentUserName(),
//   type: getAssignmentType(a)
// });

//     toast.success("Chapter completed successfully.");
//     fetchAssignments();
//     setLoading(false);
//   };



//   const handleDecline = async () => {
//     if (!remark) {
//       toast.error("Please enter remark");
//       return;
//     }
//     setLoading(true);
//     const updatePayload = {};
//     const historyEntries = [];

//     if (selectedAssignment.recording?.userId === userId) {
//       updatePayload["recording.status"] = 8;

//       historyEntries.push({
//         stage: "recording",
//         action: "declined",
//         userId: userId,
//         role: userTypeId,
//         remark: remark,
//         timestamp: new Date()
//       });
//     }

//     if (selectedAssignment.splitting?.userId === userId) {
//       updatePayload["splitting.status"] = 8;

//       historyEntries.push({
//         stage: "splitting",
//         action: "declined",
//         userId: userId,
//         role: userTypeId,
//         remark: remark,
//         timestamp: new Date()
//       });
//     }

//     if (selectedAssignment.qc?.userId === userId) {
//       updatePayload["qc.status"] = 8;

//       historyEntries.push({
//         stage: "qc",
//         action: "declined",
//         userId: userId,
//         role: userTypeId,
//         remark: remark,
//         timestamp: new Date()
//       });
//     }


//     if (selectedAssignment.correction?.userId === userId) {
//   updatePayload["correction.status"] = 8;

//   historyEntries.push({
//     stage: "correction",
//     action: "declined",
//     userId: userId,
//     role: userTypeId,
//     remark: remark,
//     timestamp: new Date()
//   });
// }

//     updatePayload["userRemark"] = remark;

//     await updateDoc(doc(db, "chapterAssignments", selectedAssignment.id), {
//       ...updatePayload,
//       history: arrayUnion(...historyEntries)
//     });


//     await notifyAdmin({
//   action: "DECLINED",
//   bookName: selectedAssignment.bookName,
//   chapterName: selectedAssignment.chapterName,
//   userName: getCurrentUserName(),
//   remark:remark,
//    type: getAssignmentType(selectedAssignment)
// });

//     toast.success("Chapter declined successfully.");

//     setRemark("");
//     setSelectedAssignment(null);
//     setSelectedId(null);
//     setLoading(false);
//     fetchAssignments();
//   };

//   const getStatusText = (status) => {
//     switch (status) {
//       case 1: return "Assigned";
//       case 2: return "Accepted";
//       case 3: return "Completed - Waiting QC";
//       case 4: return "Under QC";
//       case 5: return "QC Approved";
//       case 6: return "Delivered";
//       case 8: return "Declined";
//       default: return "-";
//     }
//   };

//   const getCurrentStatus = (assignment) => {
//     if (assignment.recording?.userId === userId) {
//       return getStatusText(assignment.recording?.status);
//     }

//     if (assignment.splitting?.userId === userId) {
//       return getStatusText(assignment.splitting?.status);
//     }

//     if (assignment.qc?.userId === userId) {
//       return getStatusText(assignment.qc?.status);
//     }

//     if (assignment.correction?.userId === userId) {
//   return getStatusText(assignment.correction?.status);
// }

//     return "-";
//   };

//   const getAssignmentType = (assignment) => {
//     const isRec = assignment.recording?.userId === userId;
//     const isSplit = assignment.splitting?.userId === userId;
//     const isQc = assignment.qc?.userId === userId;
//     const isCorrection = assignment.correction?.userId === userId;

//     if (isRec && isSplit) return "Recording & Splitting";
//     if (isRec) return "Recording";
//     if (isSplit) return "Splitting";
//     if (isQc) return "QC";
// if (isCorrection) return "Correction";
//     return "-";
//   };

//   if (loading) {
//     return (
//       <Layout title="My Assignments" subtitle="Assignment for the Recording/Splitting Users">
//         <div className="flex items-center justify-center h-[70vh]">
//           <div className="w-12 h-12 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
//         </div>
//       </Layout>
//     );


//   }


//   return (
//     <Layout title="My Assignments" subtitle="Assignment for the Recording/Splitting Users">


//       <div className="bg-gray-900 p-6 rounded-xl text-white">

//         <div className="mb-4">
//           <button
//             onClick={fetchAssignments}
//             className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white font-semibold"
//           >
//             🔄
//           </button>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full text-sm border-collapse">

//             <thead className="bg-gray-800 text-gray-300 text-xs uppercase tracking-wider">
//               <tr>
//                 <th className="py-3 px-4 text-left">Sr. No.</th>
//                 <th className="py-3 px-4 text-left">Book</th>
//                 <th className="py-3 px-4 text-left">Chapter</th>
//                 <th className="py-3 px-4 text-center">Remarks</th>
//                 <th className="py-3 px-4 text-center">Type</th>
//                 <th className="py-3 px-4 text-center">Status</th>
//                 <th className="py-3 px-4 text-center">Book Details</th>
//                 <th className="py-3 px-4 text-center">Action</th>
//               </tr>
//             </thead>

//             <tbody>
//               {assignments.length === 0 ? (
//                 <tr>
//                   <td colSpan="5" className="text-center py-6 text-gray-400">
//                     Click "Load My Assignments" to fetch data
//                   </td>
//                 </tr>
//               ) : (
//                 currentAssignments.map((a, index) => {
//                   const currentStatus = getCurrentStatus(a);
//                let latestRemark = null;

// const isRec = a.recording?.userId === userId;
// const isSplit = a.splitting?.userId === userId;
// const isQc = a.qc?.userId === userId;
// const isCorrection = a.correction?.userId === userId;

// // Recording / Splitting / Correction users → show userRemark
// if ((isRec || isSplit || isCorrection) && a.userRemark) {
//   latestRemark = { remark: a.userRemark };
// }

// // QC user → show qcRemark
// if (isQc && a.qcRemark) {
//   latestRemark = { remark: a.qcRemark };
// }
//                   return (
//                     <tr
//                       key={a.id}
//                       className="border-b border-gray-800 hover:bg-gray-800/40 transition"
//                     >
//                       <td className="py-3 px-4">{indexOfFirst + index + 1}</td>
//                       <td className="py-3 px-4">{a.bookName}</td>
//                       <td className="py-3 px-4">{a.chapterName}</td>
//                       <td className="py-3 px-4 text-center">
//                         {latestRemark ? (
//                           <button
//                             onClick={() => openRemarkModal(latestRemark)}
//                             className="text-xs px-3 py-1 rounded-md bg-red-600/20 border border-red-600 text-red-400 hover:bg-red-600/30 transition"
//                           >
//                             View Reason
//                           </button>
//                         ) : (
//                           <span className="text-gray-500 text-sm">-</span>
//                         )}
//                       </td>
//                       <td className="py-3 px-4 text-center">
//                         <span className="px-2 py-1 rounded text-xs bg-gray-700 text-white">
//                           {getAssignmentType(a)}
//                         </span>
//                       </td>

//                       <td className="py-3 px-4 text-center">
//                         {currentStatus}
//                       </td>

//                       <td className="py-3 px-4 text-center">
//                         {currentStatus === 'Accepted' ? (<button onClick={() => handleViewClick(a)}
//                           className="text-blue-400 hover:text-blue-600 underline text-sm" >

//                           View </button>) : (<span className="text-gray-500">-</span>)} </td>

//                       <td className="py-3 px-4 text-center">
//                         <div className="flex justify-center gap-2">

//                          {currentStatus === 'Assigned' && !isAcceptBlocked(a) && (
//                             <>
//                               {/* ACCEPT BUTTON */}
//                               <button
//                                 onClick={() => handleAcceptClick(a)}
//                                 className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center justify-center"
//                                 title="Accept"
//                               >
//                                 <svg
//                                   className="w-5 h-5"
//                                   fill="none"
//                                   stroke="currentColor"
//                                   viewBox="0 0 24 24"
//                                   strokeWidth={2}
//                                 >
//                                   <path
//                                     strokeLinecap="round"
//                                     strokeLinejoin="round"
//                                     d="M5 13l4 4L19 7"
//                                   />
//                                 </svg>
//                               </button>

//                               {/* DECLINE BUTTON */}
//                               <button
//                                 onClick={() => {
//                                   setSelectedAssignment(a);
//                                   setSelectedId(a.id);
//                                 }}
//                                 className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center justify-center"
//                                 title="Decline"
//                               >
//                                 <svg
//                                   className="w-5 h-5"
//                                   fill="none"
//                                   stroke="currentColor"
//                                   viewBox="0 0 24 24"
//                                   strokeWidth={2}
//                                 >
//                                   <path
//                                     strokeLinecap="round"
//                                     strokeLinejoin="round"
//                                     d="M6 18L18 6M6 6l12 12"
//                                   />
//                                 </svg>
//                               </button>
//                             </>
//                           )}

//                           {currentStatus === 'Assigned' && isAcceptBlocked(a) && (
//   <span className="text-yellow-400 text-xs font-semibold">
//     Waiting for QC to Finish
//   </span>
// )}

//                           {currentStatus !== 'Assigned' &&
//                             !(currentStatus === 'Accepted') && (
//                               <span className="text-gray-400 text-sm">-</span>
//                             )}

//                           {currentStatus === 'Accepted' && isFinishBlocked(a) && (
//                             <span className="text-yellow-400 text-xs font-semibold">
//                               Waiting for Splitting to Finish
//                             </span>
//                           )}
//                           {currentStatus === 'Accepted' && !isFinishBlocked(a) && (

//                             <button
//                               onClick={() => handleComplete(a)}
//                               className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center justify-center"
//                               title="Mark as Complete"
//                             >
//                               <svg
//                                 className="w-5 h-5"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 viewBox="0 0 24 24"
//                                 strokeWidth={2}
//                               >
//                                 <path
//                                   strokeLinecap="round"
//                                   strokeLinejoin="round"
//                                   d="M9 12l2 2 4-4"
//                                 />
//                                 <circle cx="12" cy="12" r="9" />
//                               </svg>
//                             </button>
//                           )}

//                           {parseInt(currentStatus) >= 3 && (
//                             <span className="text-gray-400 text-sm">
//                               -
//                             </span>
//                           )}

//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>

//           </table>
//         </div>

//         {totalPages > 1 && (
//           <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-800">

//             <p className="text-gray-400 text-sm">
//               Showing {indexOfFirst + 1} -{" "}
//               {Math.min(indexOfLast, assignments.length)} of {assignments.length}
//             </p>

//             <div className="flex items-center gap-2">

//               <button
//                 disabled={currentPage === 1}
//                 onClick={() => setCurrentPage(prev => prev - 1)}
//                 className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 transition"
//               >
//                 Previous
//               </button>

//               {Array.from({ length: totalPages }, (_, i) => (
//                 <button
//                   key={i}
//                   onClick={() => setCurrentPage(i + 1)}
//                   className={`px-3 py-2 rounded-lg ${currentPage === i + 1
//                       ? "bg-white text-black font-semibold"
//                       : "bg-gray-800 text-gray-300 hover:bg-gray-700"
//                     }`}
//                 >
//                   {i + 1}
//                 </button>
//               ))}

//               <button
//                 disabled={currentPage === totalPages}
//                 onClick={() => setCurrentPage(prev => prev + 1)}
//                 className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 transition"
//               >
//                 Next
//               </button>

//             </div>
//           </div>
//         )}

//         {remarkModalOpen && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center">

//             {/* Backdrop */}
//             <div
//               className="absolute inset-0 bg-black/60 backdrop-blur-sm"
//               onClick={closeRemarkModal}
//             />

//             {/* Modal */}
//             <div className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-[90%] max-w-md p-6 animate-fadeIn">

//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-white font-semibold text-lg">
//                   🔴 Returned Reason
//                 </h3>
//                 <button
//                   onClick={closeRemarkModal}
//                   className="text-gray-400 hover:text-white text-sm"
//                 >
//                   ✕
//                 </button>
//               </div>

//               <div className="bg-red-900/30 border border-red-700 p-4 rounded text-sm text-red-300 whitespace-pre-wrap">
//                 {selectedRemark?.remark}
//               </div>


//             </div>
//           </div>
//         )}

//         {showBookModal && bookDetails && (
//           <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
//             <div className="bg-gray-800 p-6 rounded-2xl w-[500px] text-white">
//               <h2 className="text-xl font-bold mb-4">Book Details</h2>

//               <div className="space-y-3 text-sm">
//                 <p>
//                   <span className="text-gray-400">Book Name:</span>{" "}
//                   <span className="font-semibold">{bookDetails.bookName}</span>
//                 </p>

//                 <p>
//                   <span className="text-gray-400">Book Code:</span>{" "}
//                   <span className="font-semibold">{bookDetails.bookCode}</span>
//                 </p>

//                 <p>
//                   <span className="text-gray-400">Language:</span>{" "}
//                   <span className="font-semibold">{bookDetails.language}</span>
//                 </p>

//                 {bookDetails.bookLink && (
//                   <p>
//                     <span className="text-gray-400">Reference Link:</span>{" "}
//                     <a
//                       href={bookDetails.bookLink}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-blue-400 underline"
//                     >
//                       Open Link
//                     </a>
//                   </p>
//                 )}

//                 {bookDetails.pdfUrl && (
//                   <p>
//                     <span className="text-gray-400">Download PDF:</span>{" "}
//                     <a
//                       href={bookDetails.pdfUrl}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       download
//                       className="text-green-400 underline"
//                     >
//                       Download
//                     </a>
//                   </p>
//                 )}
//               </div>

//               <div className="flex gap-3 mt-6">

//                 {modalMode === "accept" && (
//                   <>
//                     <button
//                       onClick={confirmAccept}
//                       className="flex-1 bg-green-600 py-2 rounded-lg hover:bg-green-700 transition"
//                     >
//                       Confirm Accept
//                     </button>

//                     <button
//                       onClick={() => setShowBookModal(false)}
//                       className="flex-1 bg-gray-600 py-2 rounded-lg hover:bg-gray-700 transition"
//                     >
//                       Cancel
//                     </button>
//                   </>
//                 )}

//                 {modalMode === "view" && (
//                   <button
//                     onClick={() => setShowBookModal(false)}
//                     className="w-full bg-gray-600 py-2 rounded-lg hover:bg-gray-700 transition"
//                   >
//                     Close
//                   </button>
//                 )}

//               </div>
//             </div>
//           </div>
//         )}
//         {/* Decline Modal */}
//         {selectedId && (
//           <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
//             <div className="bg-gray-800 p-6 rounded-xl w-96">
//               <h3 className="text-lg font-bold mb-4">Decline Remark</h3>

//               <textarea
//                 className="w-full bg-gray-700 p-2 rounded mb-4"
//                 value={remark}
//                 onChange={(e) => setRemark(e.target.value)}
//               />

//               <button
//                 onClick={handleDecline}
//                 className="w-full bg-red-500 py-2 rounded"
//               >
//                 Submit
//               </button>
//             </div>
//           </div>
//         )}

//       </div>
//     </Layout>
//   );
// }

// // helper
// function getCookie(name) {
//   const value = `; ${document.cookie}`;
//   const parts = value.split(`; ${name}=`);
//   if (parts.length === 2) return parts.pop().split(";").shift();
// }

import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  arrayUnion
} from "firebase/firestore";
import { db } from "../../../firebase";
import Layout from "../Layout/AdminLayout";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
export default function AssignmentsModule() {
  const navigate = useNavigate();
  const userId = getCookie("userId");

  const [params] = useSearchParams();

  const rec = params.get("rec");
  const split = params.get("split");
  const qc = params.get("qc");
  const correction = params.get("correction");

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [remark, setRemark] = useState("");

  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [remarkType, setRemarkType] = useState(null); // decline or reassign

  const openRemarkModal = (assignment, type) => {
    setSelectedAssignment(assignment);
    setRemarkType(type);
    setRemarkModalOpen(true);
  };


  const isTeamCompleted = (assignment) => {
    const recDone = assignment.recording?.status === 3;
    const splitDone = assignment.splitting?.status === 3;

    return recDone && splitDone;
  };


  let stage = null;

  if (rec) stage = "recording";
  if (split) stage = "splitting";
  if (qc) stage = "qc";
  if (correction) stage = "correction";

  /* -------------------------------- */
  /* FETCH ASSIGNMENTS */
  /* -------------------------------- */

  const fetchAssignments = async () => {

    setLoading(true);

    const snap = await getDocs(collection(db, "chapterAssignments"));

    const data = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    const filtered = data.filter(a => {
      return a?.[stage]?.userId === userId;
    });

    setAssignments(filtered);

    setLoading(false);
  };

  /* -------------------------------- */
  /* HISTORY */
  /* -------------------------------- */

  const addHistory = async (assignmentId, action, extra = {}) => {

    await updateDoc(doc(db, "chapterAssignments", assignmentId), {
      history: arrayUnion({
        stage,
        action,
        userId,
        timestamp: new Date(),
        ...extra
      })
    });

  };

  /* -------------------------------- */
  /* ACCEPT */
  /* -------------------------------- */

  const handleAccept = async (a) => {
    setLoading(true);

    await updateDoc(doc(db, "chapterAssignments", a.id), {
      [`${stage}.status`]: 2
    });

    await addHistory(a.id, "accepted");

    toast.success("Chapter accepted successfully.");
    setLoading(false);

    fetchAssignments();
  };

  /* -------------------------------- */
  /* COMPLETE */
  /* -------------------------------- */

  const handleComplete = async (a) => {
    setLoading(true);

    const updates = {
      [`${stage}.status`]: 3
    };

    const newRecordingStatus =
      stage === "recording" ? 3 : a.recording?.status;

    const newSplittingStatus =
      stage === "splitting" ? 3 : a.splitting?.status;

    if (newRecordingStatus === 3 && newSplittingStatus === 3) {
      updates.qcRemark = "";
    }

    await updateDoc(doc(db, "chapterAssignments", a.id), updates);

    await addHistory(a.id, "completed");

    toast.success("Chapter completed successfully.");
    setLoading(false);
    fetchAssignments();
  };
  /* -------------------------------- */
  /* QC APPROVE */
  /* -------------------------------- */

  const handleApprove = async (a) => {
    setLoading(true);

    await updateDoc(doc(db, "chapterAssignments", a.id), {
      "qc.status": 3,
      qcRemark: ""
    });

    await addHistory(a.id, "approved");

    toast.success("QC Approved");
    setLoading(false);
    fetchAssignments();
  };
  /* -------------------------------- */
  /* QC REASSIGN */
  /* -------------------------------- */

  const handleReassign = async () => {

    if (!remark) {
      toast.error("Enter remark");
      return;
    }
    setLoading(true);

    const a = selectedAssignment;

    await updateDoc(doc(db, "chapterAssignments", a.id), {
      "recording.status": 2,
      "splitting.status": 2,
      "qc.status": 1,
      qcRemark: remark
    });

    await addHistory(a.id, "reassigned", { remark });

    toast.success("Chapter reassigned successfully");
    setLoading(false);
    setRemark("");
    setRemarkModalOpen(false);
    setSelectedAssignment(null);

    fetchAssignments();
  };

  /* -------------------------------- */
  /* STATUS */
  /* -------------------------------- */

  const getStatusText = (status) => {

    switch (status) {

      case 1: return "Assigned";
      case 2: return "Accepted";
      case 3: return "Completed";
      case 8: return "Declined";
      default: return "-";

    }

  };

  /* -------------------------------- */
  /* INIT */
  /* -------------------------------- */

  useEffect(() => {
    fetchAssignments();
  }, [stage]);


  const statusCounts = assignments.reduce(
    (acc, a) => {
      const status = a?.[stage]?.status;

      if (status === 1) acc.assigned += 1;
      if (status === 2) acc.accepted += 1;
      if (status === 3) acc.completed += 1;

      return acc;
    },
    { assigned: 0, accepted: 0, completed: 0 }
  );

  /* -------------------------------- */
  /* LOADING */
  /* -------------------------------- */

  if (loading) {

    return (
      <Layout title="My Assignments" subtitle="View and manage all assignments in the system">
        <div className="flex justify-center h-[70vh] items-center">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );

  }


  const handleDecline = async () => {

    if (!remark) {
      toast.error("Please enter remark");
      return;
    }

    const a = selectedAssignment;

    await updateDoc(doc(db, "chapterAssignments", a.id), {
      [`${stage}.status`]: 8,
      userRemark: remark,
      history: arrayUnion({
        stage,
        action: "declined",
        userId,
        timestamp: new Date(),
        remark
      })
    });

    toast.success("Chapter declined successfully");

    setRemark("");
    setRemarkModalOpen(false);
    setSelectedAssignment(null);

    fetchAssignments();
  };

  return (

    <Layout title="My Assignments" subtitle="View and manage all assignments in the system">

      <div className="flex justify-between items-center mb-4">

        <button
          onClick={() => navigate("/ADB")}
          className="bg-gray-800 text-white border border-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
        >
          ← Back
        </button>

      </div>

      <div className="bg-gray-900 p-6 rounded-xl text-white">
        <div className="flex gap-6 mb-6">

          <div className="bg-gray-800 px-4 py-2 rounded">
            Assigned: {statusCounts.assigned}
          </div>

          <div className="bg-gray-800 px-4 py-2 rounded">
            Accepted: {statusCounts.accepted}
          </div>

          <div className="bg-gray-800 px-4 py-2 rounded">
            Finished: {statusCounts.completed}
          </div>

        </div>


        <table className="w-full text-sm">

          <thead className="bg-gray-800">

            <tr>
              <th className="p-3 text-left">Book</th>
              <th className="p-3 text-left">Chapter</th>
              <th className="p-3 text-center">Remark</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Action</th>
            </tr>

          </thead>

          <tbody>

            {assignments.map(a => {

              const status = a?.[stage]?.status;
              let latestRemark = null;

              const isRec = a.recording?.userId === userId;
              const isSplit = a.splitting?.userId === userId;
              const isQc = a.qc?.userId === userId;
              const isCorrection = a.correction?.userId === userId;

              /* Admin revert remark → visible to all assigned users */

              if ((isRec || isSplit || isQc || isCorrection) && a.adminRemark) {
                latestRemark = a.adminRemark;
              }

              /* QC returned remark → visible to Rec/Split */

              if ((isRec || isSplit) && a.qcRemark) {
                latestRemark = a.qcRemark;
              }

              /* User decline remark → visible to QC */

              if (isQc && a.userRemark) {
                latestRemark = a.userRemark;
              }

              return (

                <tr key={a.id} className="border-b border-gray-700">

                  <td className="p-3">{a.bookName}</td>

                  <td className="p-3">{a.chapterName}</td>
                  <td className="p-3 text-center">

                    {latestRemark ? (

                      <button
                        onClick={() => {
                          setSelectedAssignment({ remark: latestRemark });
                          setRemarkType("view");
                          setRemarkModalOpen(true);
                        }}
                        className="text-xs px-3 py-1 rounded-md bg-red-600/20 border border-red-600 text-red-400"
                      >
                        View Reason
                      </button>

                    ) : (

                      <span className="text-gray-500 text-sm">-</span>

                    )}

                  </td>        <td className="p-3 text-center">
                    {getStatusText(status)}
                  </td>

                  <td className="p-3 text-center">

                    {status === 1 ? (

                      qc && !isTeamCompleted(a) ? (

                        <span className="text-yellow-400 text-xs">
                          Waiting for Recording & Splitting completion
                        </span>

                      ) : (

                        <>
                          <button
                            onClick={() => handleAccept(a)}
                            className="bg-green-600 px-3 py-1 rounded mr-2"
                          >
                            Accept
                          </button>

                          <button
                            onClick={() => openRemarkModal(a, "decline")}
                            className="bg-red-600 px-3 py-1 rounded"
                          >
                            Decline
                          </button>
                        </>

                      )

                    ) : status === 2 && !qc ? (

                      <button
                        onClick={() => handleComplete(a)}
                        className="bg-blue-600 px-3 py-1 rounded"
                      >
                        Complete
                      </button>

                    ) : qc && status === 2 ? (

                      <>
                        <button
                          onClick={() => handleApprove(a)}
                          className="bg-green-700 px-3 py-1 rounded mr-2"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => openRemarkModal(a, "reassign")}
                          className="bg-red-600 px-3 py-1 rounded"
                        >
                          Reassign
                        </button>
                      </>

                    ) : (

                      <span className="text-gray-400 text-sm">-</span>

                    )}

                  </td>

                </tr>

              );

            })}

          </tbody>

        </table>

      </div>
      {remarkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">

          <div className="bg-gray-800 p-6 rounded-xl w-96 text-white">

            <h3 className="text-lg font-bold mb-4 capitalize">
              {remarkType === "decline"
                ? "Decline Remark"
                : remarkType === "reassign"
                  ? "Reassign Remark"
                  : "Returned Reason"}
            </h3>

            {remarkType === "view" ? (

              <div className="bg-red-900/30 border border-red-700 p-4 rounded text-sm text-red-300 whitespace-pre-wrap">
                {selectedAssignment?.remark}
              </div>

            ) : (

              <textarea
                className="w-full bg-gray-700 p-2 rounded mb-4"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />

            )}

          <div className="flex gap-3 mt-4">

              {remarkType !== "view" && (
                <button
                  onClick={() => {
                    if (remarkType === "decline") {
                      handleDecline();
                    } else if (remarkType === "reassign") {
                      handleReassign();
                    }
                  }}
                  className="flex-1 bg-red-500 py-2 rounded"
                >
                  Submit
                </button>
              )}


              <button
                onClick={() => {
                  setRemarkModalOpen(false);
                  setSelectedAssignment(null);
                  setRemark("");
                }}
                className="flex-1 bg-gray-600 py-2 rounded"
              >
                Cancel
              </button>

            </div>

          </div>

        </div>
      )}
    </Layout>

  );

}

function getCookie(name) {

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2)
    return parts.pop().split(";").shift();

}