// import { useEffect, useState } from "react";
// import { collection, getDocs } from "firebase/firestore";
// import { db } from "../../../firebase";
// import Layout from "../Layout/AdminLayout";

// /* ---------------- ROLE CONSTANTS ---------------- */

// const ROLE = {
//   ADMIN: 1,
//   SPLITTING: 2,
//   RECORDING: 3,
//   QC: 4,
//   BOTH: 5,
//   ADMIN1: 0
// };

// /* ---------------- HELPER ---------------- */

// function getCookie(name) {
//   const value = `; ${document.cookie}`;
//   const parts = value.split(`; ${name}=`);
//   if (parts.length === 2)
//     return decodeURIComponent(parts.pop().split(";").shift());
// }

// /* ---------------- MAIN COMPONENT ---------------- */

// export default function Dashboard() {
//   const [users, setUsers] = useState([]);
//   const [books, setBooks] = useState([]);
//   const [assignments, setAssignments] = useState([]);

//   const userTypeId = Number(getCookie("userTypeId"));
//   const userId = Number(getCookie("userId"));

//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     fetchDashboard();
//   }, []);

//   const fetchDashboard = async () => {
//     setLoading(true);
//     const userSnap = await getDocs(collection(db, "users"));
//     const bookSnap = await getDocs(collection(db, "books"));
//     const assignSnap = await getDocs(collection(db, "chapterAssignments"));

//     setUsers(userSnap.docs.map(d => ({ id: d.id, ...d.data() })));
//     setBooks(bookSnap.docs.map(d => ({ id: d.id, ...d.data() })));
//     setAssignments(assignSnap.docs.map(d => ({ id: d.id, ...d.data() })));
//     setLoading(false);
//   };

//   if (loading) {
//     return (
//       <Layout title="Dashboard" subtitle="View and Check all transactions of the System">
//         <div className="flex items-center justify-center h-[70vh]">
//           <div className="w-12 h-12 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
//         </div>
//       </Layout>
//     );
//   }


//   return (
//     <Layout title="Dashboard" subtitle="View and Check all transactions of the System">

//       {(userTypeId === ROLE.ADMIN || userTypeId === ROLE.ADMIN1 || userTypeId === 100) && (
//         <AdminDashboard users={users} books={books} assignments={assignments} />
//       )}

//       {userTypeId === ROLE.RECORDING && (
//         <RecordingDashboard assignments={assignments} />
//       )}

//       {userTypeId === ROLE.SPLITTING && (
//         <SplittingDashboard assignments={assignments} />
//       )}

//       {userTypeId === ROLE.QC && (
//         <QCDashboard assignments={assignments} />
//       )}

//       {userTypeId === ROLE.BOTH && (
//         <CombinedDashboard assignments={assignments} />
//       )}

//     </Layout>
//   );
// }

// /* ---------------- ADMIN DASHBOARD ---------------- */

// function AdminDashboard({ users, books, assignments }) {

//   /* ---------------- ACTIVE USERS ---------------- */

//   const activeUserIds = [];

//   assignments.forEach(a => {
//     if ([1, 2, 3, 4].includes(a.recording?.status)) {
//       activeUserIds.push(a.recording.userId);
//     }
//     if ([1, 2, 3, 4].includes(a.splitting?.status)) {
//       activeUserIds.push(a.splitting.userId);
//     }
//     if ([1, 2, 3, 4].includes(a.qc?.status)) {
//       activeUserIds.push(a.qc.userId);
//     }
//   });

//   const uniqueActiveIds = [...new Set(activeUserIds)];
//   const activeUsers = users.filter(u => uniqueActiveIds.includes(u.id));
//   const idleUsers = users.filter(u => !uniqueActiveIds.includes(u.id));


//   /* ---------------- IDLE CHAPTER ANALYSIS ---------------- */

// const chapterMap = {};

// // group assignments by book + chapter
// assignments.forEach(a => {
//   const key = `${a.bookId}_${a.chapterNumber}`;
//   if (!chapterMap[key]) chapterMap[key] = a;
// });

// let fullyUnassigned = 0;
// let recPending = 0;
// let splitPending = 0;
// let qcPendingStage = 0;

// Object.values(chapterMap).forEach(a => {
//   const rec = a.recording;
//   const split = a.splitting;
//   const qc = a.qc;

//   if (!rec && !split && !qc) {
//     fullyUnassigned++;
//     return;
//   }

//   if (!rec || rec.status === 8) recPending++;
//   if (!split || split.status === 8) splitPending++;
//   if (!qc || qc.status === 8) qcPendingStage++;
// });

//   /* ---------------- BOOK PROGRESS ---------------- */

//   const bookProgress = books.map(book => {
//     const bookAssignments = assignments.filter(a => a.bookId === book.id);

//     const uniqueChapters = [
//       ...new Set(bookAssignments.map(a => a.chapterNumber))
//     ];

//     const deliveredChapters = [
//       ...new Set(
//         bookAssignments
//           .filter(a =>
//             a.recording?.status === 6 &&
//             a.splitting?.status === 6 &&
//             a.qc?.status === 6
//           )
//           .map(a => a.chapterNumber)
//       )
//     ];

//     const total = book.chapters?.length || 0;
//     const delivered = deliveredChapters.length;

//    return {
//   ...book,
//   progress: total ? Math.round((delivered / total) * 100) : 0,
//   delivered,
//   remaining: total - delivered,
//   total
// };
//   });

//   const runningBooks = bookProgress.filter(
//     b => b.delivered < b.total
//   );

//   /* ---------------- STAGE COUNTS ---------------- */

//   const recordingPending = assignments.filter(a =>
//     [1, 2, 3, 4].includes(a.recording?.status)
//   ).length;

//   const splittingPending = assignments.filter(a =>
//     [1, 2, 3, 4].includes(a.splitting?.status)
//   ).length;

//   const qcPending = assignments.filter(a =>
//     [1, 2, 3, 4].includes(a.qc?.status)
//   ).length;




//   return (
//     <div className="space-y-8">

//       {/* ================= KPI CARDS ================= */}

//       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

//         <KpiCard title="Total Users" value={users.length} color="blue" />
//         <KpiCard title="Active Users" value={activeUsers.length} color="green" />
//         <KpiCard title="Running Books" value={runningBooks.length} color="yellow" />
//         <KpiCard title="Delivered Books" value={books.length - runningBooks.length} color="purple" />

//       </div>

//       {/* ================= STAGE DISTRIBUTION ================= */}

//       {/* <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
//         <h3 className="text-lg font-bold mb-6 text-white">
//           Workflow Distribution
//         </h3>

//         <StageBar label="Recording Pending" value={recordingPending} color="bg-blue-500" />
//         <StageBar label="Splitting Pending" value={splittingPending} color="bg-yellow-400" />
//         <StageBar label="QC Pending" value={qcPending} color="bg-green-500" />
//       </div> */}

//       {/* ================= IDLE CHAPTERS ================= */}

// <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
//   <h3 className="text-lg font-bold mb-6 text-white">
//     Idle & Incomplete Chapters
//   </h3>

//   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

//     <KpiCard title="Fully Unassigned" value={fullyUnassigned} color="red" />
//     <KpiCard title="Recording Pending" value={recPending} color="blue" />
//     <KpiCard title="Splitting Pending" value={splitPending} color="yellow" />
//     <KpiCard title="QC Pending" value={qcPendingStage} color="green" />

//   </div>
// </div>

//       {/* ================= BOOK PROGRESS ================= */}

//       <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
//         <h3 className="text-lg font-bold mb-6 text-white">
//           Book Progress
//         </h3>

//         <div className="space-y-5">
//           {bookProgress.map(book => (
//             <div key={book.id} className="bg-gray-800 rounded-xl p-4">

//               <div className="flex justify-between mb-2">
//                 <span className="text-white font-semibold">
//                   {book.bookName}
//                 </span>
//                 <span className="text-gray-400">
//                   {book.progress}%
//                 </span>
//               </div>

//               <div className="w-full bg-gray-700 h-3 rounded-full">
//                 <div
//                   className="bg-green-500 h-3 rounded-full transition-all duration-500"
//                   style={{ width: `${book.progress}%` }}
//                 />
//               </div>

//               <div className="text-xs text-gray-400 mt-2">
//              Delivered: {book.delivered} | Remaining: {book.remaining}
//               </div>

//             </div>
//           ))}
//         </div>
//       </div>

//       {/* ================= USERS SECTION ================= */}

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

//         <UserSection
//           title="Active Users"
//           users={activeUsers}
//           color="text-green-400"
//         />

//         <UserSection
//           title="Idle Users"
//           users={idleUsers}
//           color="text-red-400"
//         />

//       </div>

//     </div>
//   );
// }

// function KpiCard({ title, value, color }) {

//   const colors = {
//     blue: "bg-blue-600/20 text-blue-400",
//     green: "bg-green-600/20 text-green-400",
//     yellow: "bg-yellow-600/20 text-yellow-400",
//     purple: "bg-purple-600/20 text-purple-400"
//   };

//   return (
//     <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
//       <p className="text-gray-400 text-sm mb-2">{title}</p>
//       <p className={`text-3xl font-bold ${colors[color]}`}>
//         {value}
//       </p>
//     </div>
//   );
// }

// function StageBar({ label, value, color }) {
//   return (
//     <div className="mb-4">
//       <div className="flex justify-between text-sm mb-1 text-gray-300">
//         <span>{label}</span>
//         <span>{value}</span>
//       </div>
//       <div className="w-full bg-gray-800 h-3 rounded-full">
//         <div
//           className={`${color} h-3 rounded-full`}
//           style={{ width: `${Math.min(value * 5, 100)}%` }}
//         />
//       </div>
//     </div>
//   );
// }


// function UserSection({ title, users, color }) {
//   return (
//     <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
//       <h3 className={`text-lg font-bold mb-4 ${color}`}>
//         {title} ({users.length})
//       </h3>

//       {users.length === 0 ? (
//         <p className="text-gray-400 text-sm">No users</p>
//       ) : (
//         <div className="space-y-2 max-h-60 overflow-y-auto">
//           {users.map(u => (
//             <div
//               key={u.id}
//               className="bg-gray-800 rounded-lg px-3 py-2 text-white text-sm"
//             >
//               {u.firstName} {u.lastName}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
// /* ---------------- RECORDING DASHBOARD ---------------- */

// function RecordingDashboard({ assignments }) {
//   const userId = Number(getCookie("userId"));

//   const tasks = assignments.filter(
//     a =>
//       a.recording?.userId === userId &&
//       [1, 2, 3, 4].includes(a.recording?.status)
//   );

//   return (
//     <SimpleDashboard title="Recording Tasks" count={tasks.length} />
//   );
// }

// /* ---------------- SPLITTING DASHBOARD ---------------- */

// function SplittingDashboard({ assignments }) {
//   const userId = Number(getCookie("userId"));

//   const tasks = assignments.filter(
//     a =>
//       a.splitting?.userId === userId &&
//       [1, 2, 3, 4].includes(a.splitting?.status)
//   );

//   return (
//     <SimpleDashboard title="Splitting Tasks" count={tasks.length} />
//   );
// }

// /* ---------------- QC DASHBOARD ---------------- */

// function QCDashboard({ assignments }) {
//   const userId = Number(getCookie("userId"));

//   const tasks = assignments.filter(
//     a =>
//       a.qc?.userId === userId &&
//       [1, 2, 3, 4].includes(a.qc?.status)
//   );

//   return (
//     <SimpleDashboard title="QC Pending Tasks" count={tasks.length} />
//   );
// }


// /* ---------------- BOTH DASHBOARD ---------------- */

// function CombinedDashboard({ assignments }) {
//   const tasks = assignments.filter(
//     a =>
//       [1, 2, 3, 4].includes(a.recording?.status) ||
//       [1, 2, 3, 4].includes(a.splitting?.status)
//   );

//   return (
//     <SimpleDashboard title="Recording & Splitting Tasks" count={tasks.length} />
//   );
// }

// function SimpleDashboard({ title, count }) {
//   return (
//     <div className="bg-gray-900 p-6 rounded-xl text-white">
//       <h2 className="text-xl font-bold mb-4">{title}</h2>
//       <div className="bg-gray-800 p-6 rounded-xl text-center">
//         <p className="text-gray-400 text-sm">Total</p>
//         <p className="text-3xl font-bold">{count}</p>
//       </div>
//     </div>
//   );
// }



import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";
import Layout from "../Layout/AdminLayout";

/* ---------------- ROLE CONSTANTS ---------------- */
const ROLE = { ADMIN: 1, SPLITTING: 2, RECORDING: 3, QC: 4, BOTH: 5, CORRECTION: 6, ADMIN1: 0 };

/* ---------------- HELPER ---------------- */
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(";").shift());
}

/* ---------------- MAIN COMPONENT ---------------- */
export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const userTypeId = Number(getCookie("userTypeId"));
  const [loading, setLoading] = useState(false);




  const fetchDashboard = async () => {
    setLoading(true);
    const [userSnap, bookSnap, assignSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "books")),
      getDocs(collection(db, "chapterAssignments")),
    ]);
    setUsers(userSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setBooks(bookSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setAssignments(assignSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) return (
    <Layout title="Dashboard" subtitle="View and Check all transactions of the System">
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-indigo-400 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm tracking-widest uppercase">Loading Dashboard</p>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout title="Dashboard" subtitle="View and Check all transactions of the System">
      {(userTypeId === ROLE.ADMIN || userTypeId === ROLE.ADMIN1 || userTypeId === 100) && (
        <AdminDashboard users={users} books={books} assignments={assignments} />
      )}
      {userTypeId === ROLE.RECORDING && <RecordingDashboard assignments={assignments} />}
      {userTypeId === ROLE.SPLITTING && <SplittingDashboard assignments={assignments} />}
      {userTypeId === ROLE.QC && <QCDashboard assignments={assignments} />}
      {userTypeId === ROLE.BOTH && <CombinedDashboard assignments={assignments} />}
      {userTypeId === ROLE.CORRECTION && <CorrectionDashboard assignments={assignments} />}
    </Layout>
  );
}

/* ---------------- ADMIN DASHBOARD ---------------- */
function AdminDashboard({ users, books, assignments }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedBook, setExpandedBook] = useState(null);
  /* ACTIVE USERS */
  const activeUserIds = [];
  assignments.forEach(a => {
    if ([1, 2, 3, 4].includes(a.recording?.status)) activeUserIds.push(a.recording.userId);
    if ([1, 2, 3, 4].includes(a.splitting?.status)) activeUserIds.push(a.splitting.userId);
    if ([1, 2, 3, 4].includes(a.qc?.status)) activeUserIds.push(a.qc.userId);
    if ([1, 2, 3, 4].includes(a.correction?.status)) activeUserIds.push(a.correction.userId);
  });
  const uniqueActiveIds = [...new Set(activeUserIds)];
  const activeUsers = users.filter(u => uniqueActiveIds.includes(u.id));
  const idleUsers = users.filter(u => !uniqueActiveIds.includes(u.id));

  /* CHAPTER ANALYSIS */
  const chapterMap = {};
  assignments.forEach(a => {
    const key = `${a.bookId}_${a.chapterNumber}`;
    if (!chapterMap[key]) chapterMap[key] = a;
  });

  let fullyUnassigned = 0,
    recPending = 0,
    splitPending = 0,
    qcPendingStage = 0,
    correctionPending = 0;

  let recActiveCount = 0,
    splitActiveCount = 0,
    qcActiveCount = 0,
    correctionActiveCount = 0;

  let recDone = 0,
    splitDone = 0,
    qcDone = 0,
    correctionDone = 0,
    fullyDelivered = 0;

  Object.values(chapterMap).forEach(a => {
    const { recording: rec, splitting: split, qc, correction } = a;

    // Fully unassigned
    if (!rec && !split && !qc) {
      fullyUnassigned++;
      return;
    }

    // ======================
    // RECORDING
    // ======================
    if (!rec || rec.status === 8 || rec.status === 1) {
      recPending++;
    }
    else if (rec.status === 2) {
      recActiveCount++;
    }
    else if (rec.status === 3) {
      recDone++;
    }

    // ======================
    // SPLITTING
    // ======================
    if (!split || split.status === 8 || split.status === 1) {
      splitPending++;
    }
    else if (split.status === 2) {
      splitActiveCount++;
    }


    else if (split.status === 3) {
      splitDone++;
    }

    // ======================
    // QC
    // ======================
    if (!qc || qc.status === 8 || qc.status === 1) {
      qcPendingStage++;
    }
    else if (qc.status === 2) {
      qcActiveCount++;
    }
    else if (qc.status === 3) {
      qcDone++;
    }


    // ======================
    // CORRECTION
    // ======================

    if (!correction || correction.status === 8 || correction.status === 1) {
      correctionPending++;
    }
    else if (correction.status === 2) {
      correctionActiveCount++;
    }
    else if (correction.status === 3) {
      correctionDone++;
    }


    // ======================
    // Fully Delivered (All Done)
    // ======================
    if (
      rec?.status === 6 &&
      split?.status === 6 &&
      qc?.status === 6 &&
      (!correction || correction?.status === 6)
    ) {
      fullyDelivered++;
    }
  });

  const totalChapters = Object.keys(chapterMap).length;

  /* BOOK PROGRESS */
  const bookProgress = books.map(book => {
    const bookAssignments = assignments.filter(a => a.bookId === book.id);
    const deliveredChapters = [...new Set(
      bookAssignments.filter(a =>
        a.recording?.status === 6 && a.splitting?.status === 6 && a.qc?.status === 6
      ).map(a => a.chapterNumber)
    )];
    const inProgressChapters = [...new Set(
      bookAssignments.filter(a =>
        [1, 2, 3, 4].includes(a.recording?.status) ||
        [1, 2, 3, 4].includes(a.splitting?.status) ||
        [1, 2, 3, 4].includes(a.qc?.status)
      ).map(a => a.chapterNumber)
    )];
    const total = book.chapters?.length || 0;
    const delivered = deliveredChapters.length;
    return {
      ...book,
      progress: total ? Math.round((delivered / total) * 100) : 0,
      delivered, inProgress: inProgressChapters.length,
      remaining: total - delivered, total,
    };
  });

  const runningBooks = bookProgress.filter(b => b.delivered < b.total);
  const deliveredBooks = bookProgress.filter(b => b.delivered === b.total && b.total > 0);

  /* STAGE ACTIVE COUNTS */
  const recActive = assignments.filter(a => [1, 2, 3, 4].includes(a.recording?.status)).length;
  const splitActive = assignments.filter(a => [1, 2, 3, 4].includes(a.splitting?.status)).length;
  const qcActive = assignments.filter(a => [1, 2, 3, 4].includes(a.qc?.status)).length;
  const correctionActive = assignments.filter(a => [1, 2, 3, 4].includes(a.correction?.status)).length;
  /* USER WORKLOAD */
const userWorkload = users.map(u => {
  const recTasks = assignments.filter(
    a => a.recording?.userId === u.id && [1,2,3,4].includes(a.recording?.status)
  ).length;

  const splitTasks = assignments.filter(
    a => a.splitting?.userId === u.id && [1,2,3,4].includes(a.splitting?.status)
  ).length;

  const qcTasks = assignments.filter(
    a => a.qc?.userId === u.id && [1,2,3,4].includes(a.qc?.status)
  ).length;

  const correctionTasks = assignments.filter(
    a => a.correction?.userId === u.id && [1,2,3,4].includes(a.correction?.status)
  ).length;

  const total = recTasks + splitTasks + qcTasks + correctionTasks;

  return { ...u, recTasks, splitTasks, qcTasks, correctionTasks, total };
})
.filter(u => u.total > 0)
.sort((a, b) => b.total - a.total);

  /* IN-PROGRESS CHAPTERS for Chapters tab */
  const inProgressChapters = assignments
    .filter(a =>
      [1, 2, 3, 4].includes(a.recording?.status) ||
      [1, 2, 3, 4].includes(a.splitting?.status) ||
      [1, 2, 3, 4].includes(a.qc?.status)
    )
    .map(a => {
      const book = books.find(b => b.id === a.bookId);
      const recUser = users.find(u => u.id === a.recording?.userId);
      const splitUser = users.find(u => u.id === a.splitting?.userId);
      const qcUser = users.find(u => u.id === a.qc?.userId);
      const correctionUser = users.find(u => u.id === a.correction?.userId);

      return { ...a, bookName: book?.bookName || "Unknown Book", recUser, splitUser, qcUser, correctionUser };
    })
    .sort((a, b) => (a.bookName > b.bookName ? 1 : -1));

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="space-y-6 pb-10">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        .stat-glow-blue { box-shadow: 0 0 0 1px rgba(99,102,241,0.3), 0 4px 24px rgba(99,102,241,0.1); }
        .stat-glow-emerald { box-shadow: 0 0 0 1px rgba(16,185,129,0.3), 0 4px 24px rgba(16,185,129,0.1); }
        .stat-glow-amber { box-shadow: 0 0 0 1px rgba(245,158,11,0.3), 0 4px 24px rgba(245,158,11,0.1); }
        .stat-glow-rose { box-shadow: 0 0 0 1px rgba(244,63,94,0.3), 0 4px 24px rgba(244,63,94,0.1); }
        .stat-glow-violet { box-shadow: 0 0 0 1px rgba(139,92,246,0.3), 0 4px 24px rgba(139,92,246,0.1); }
        .tab-active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.5); color: #818cf8; }
        .progress-shimmer { background: linear-gradient(90deg, #10b981, #059669); }
        .book-card:hover { transform: translateY(-2px); transition: transform 0.2s ease; }
        .user-pill:hover { background: rgba(99,102,241,0.15); }
        .mini-bar { transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
        .chapter-row:hover { background: rgba(99,102,241,0.06); }
      `}</style>

      {/* ── TOP METRICS ROW ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon="👥" label="Total Users" value={users.length} sub={`${activeUsers.length} active · ${idleUsers.length} idle`} glowClass="stat-glow-blue" accent="text-indigo-400" />
        <MetricCard icon="📚" label="Total Books" value={books.length} sub={`${runningBooks.length} in progress · ${deliveredBooks.length} done`} glowClass="stat-glow-emerald" accent="text-emerald-400" />
        <MetricCard icon="📄" label="Total Chapters" value={totalChapters} sub={`${fullyDelivered} fully delivered`} glowClass="stat-glow-amber" accent="text-amber-400" />
        <MetricCard icon="⚡" label="Active Tasks" value={recActive + splitActive + qcActive + correctionActive} sub={`Rec ${recActive} · Split ${splitActive} · QC ${qcActive} · Corr ${correctionActive}`} glowClass="stat-glow-violet" accent="text-violet-400" />
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-2 border-b border-gray-800 pb-0 flex-wrap">
        {["overview", "books", "users"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg border border-transparent capitalize transition-all ${activeTab === tab ? "tab-active border-b-transparent" : "text-gray-500 hover:text-gray-300"}`}
          >
            {tab === "overview" ? "📊 Overview" : tab === "books" ? "📚 Books" : tab === "chapters" ? `📄 Chapters ${inProgressChapters.length > 0 ? `(${inProgressChapters.length})` : ""}` : "👥 Users"}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">

          {/* Pipeline health */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white font-semibold text-base">Pipeline Health</h3>
                <p className="text-gray-500 text-xs mt-0.5">Chapter status across all 3 stages</p>
              </div>
              <span className="text-xs font-medium px-3 py-1 bg-gray-800 text-gray-400 rounded-full">{totalChapters} total chapters</span>
            </div>

            <div className="space-y-5">
              <PipelineStage label="Recording" icon="🎙️" active={recActiveCount} done={recDone} pending={recPending} total={totalChapters} color="indigo" />
              <PipelineStage label="Splitting" icon="✂️" active={splitActiveCount} done={splitDone} pending={splitPending} total={totalChapters} color="amber" />
              <PipelineStage label="QC Review" icon="🔍" active={qcActiveCount} done={qcDone} pending={qcPendingStage} total={totalChapters} color="emerald" />
              <PipelineStage
                label="Correction"
                icon="🛠️"
                active={correctionActiveCount}
                done={correctionDone}
                pending={correctionPending}
                total={totalChapters}
                color="rose"
              />
            </div>
          </div>

          {/* Idle chapters + fully unassigned */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <AlertCard icon="🔴" label="Unassigned" value={fullyUnassigned} desc="No stages assigned" urgent={fullyUnassigned > 0} />
            <AlertCard icon="🎙️" label="Rec Pending" value={recPending} desc="Awaiting recording" />
            <AlertCard icon="✂️" label="Split Pending" value={splitPending} desc="Awaiting splitting" />
            <AlertCard icon="🔍" label="QC Pending" value={qcPendingStage} desc="Awaiting QC review" />
          </div>

          {/* Users split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UserSection title="Active Users" users={activeUsers} color="text-emerald-400" badge="emerald" />
            <UserSection title="Idle Users" users={idleUsers} color="text-gray-500" badge="gray" />
          </div>
        </div>
      )}

      {/* ── BOOKS TAB ── */}
      {activeTab === "books" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-2">
            <SmallStat label="Total" value={books.length} color="text-indigo-400" />
            <SmallStat label="In Progress" value={runningBooks.length} color="text-amber-400" />
            <SmallStat label="Delivered" value={deliveredBooks.length} color="text-emerald-400" />

          </div>
          <div className="space-y-3">
            {bookProgress.sort((a, b) => b.progress - a.progress).map(book => (
              <BookCard
                key={book.id}
                book={book}
                expandedBook={expandedBook}
                setExpandedBook={setExpandedBook}
                assignments={assignments}
                 users={users}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── CHAPTERS TAB ── */}
      {activeTab === "chapters" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <SmallStat label="In Progress" value={inProgressChapters.length} color="text-amber-400" />
            <SmallStat label="Fully Delivered" value={fullyDelivered} color="text-emerald-400" />
            <SmallStat label="Unassigned" value={fullyUnassigned} color="text-rose-400" />
          </div>

          {inProgressChapters.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-gray-400 font-medium">No chapters in progress</p>
              <p className="text-gray-600 text-sm mt-1">All chapters are either delivered or unassigned</p>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-2 px-5 py-4 bg-gray-800/70 border-b border-gray-700 text-xs font-semibold uppercase tracking-wider">

                <div className="col-span-2 text-gray-400">Book</div>

                <div className="col-span-2 text-gray-400">Chapter Name</div>



                <div className="col-span-2 text-indigo-400 flex items-center gap-2">
                  <span>🎙️</span> <span>Recording</span>
                </div>

                <div className="col-span-2 text-amber-400 flex items-center gap-2">
                  <span>✂️</span> <span>Splitting</span>
                </div>

                <div className="col-span-2 text-emerald-400 flex items-center gap-2">
                  <span>🔍</span> <span>QC</span>
                </div>

                <div className="col-span-2 text-emerald-400 flex items-center gap-2">
                  <span>✅</span> <span>Correction</span>
                </div>

              </div>

              <div className="divide-y divide-gray-800/50 max-h-[60vh] overflow-y-auto">
                {inProgressChapters.map((ch, i) => {
                  const recStatus = ch.recording?.status;
                  const splitStatus = ch.splitting?.status;
                  const qcStatus = ch.qc?.status;

                  return (
                    <div
                      key={ch.id || i}
                      className="chapter-row grid grid-cols-12 gap-2 px-5 py-3 items-center border-b border-gray-800 hover:bg-gray-800/40 transition"
                    >
                      {/* Book */}
                      <div className="col-span-2">
                        <p className="text-white text-sm truncate">{ch.bookName}</p>
                      </div>

                      {/* Chapter Name */}
                      <div className="col-span-2">
                        <p className="text-indigo-400 text-sm truncate">
                          {ch.chapterName}
                        </p>
                      </div>



                      {/* Recording */}
                      <div className="col-span-2">
                        <ChapterStageCell status={recStatus} user={ch.recUser} />
                      </div>

                      {/* Splitting */}
                      <div className="col-span-2">
                        <ChapterStageCell status={splitStatus} user={ch.splitUser} />
                      </div>

                      {/* QC */}
                      <div className="col-span-2">
                        <ChapterStageCell status={qcStatus} user={ch.qcUser} compact />
                      </div>

                      <div className="col-span-2">
                        <ChapterStageCell status={ch.correction?.status} user={ch.correctionUser} compact />
                      </div>

                    </div>


                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── USERS TAB ── */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-2">
            <SmallStat label="Total" value={users.length} color="text-indigo-400" />
            <SmallStat label="Active" value={activeUsers.length} color="text-emerald-400" />
            <SmallStat label="Idle" value={idleUsers.length} color="text-rose-400" />
          </div>

          {userWorkload.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">User Workload</h3>
              <div className="space-y-3">
                {userWorkload.map(u => (
                  <div key={u.id} className="flex items-center gap-4 bg-gray-800 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold flex-shrink-0">
                      {u.firstName?.[0]}{u.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{u.firstName} {u.lastName}</p>
                      <div className="flex gap-3 mt-1">
                        {u.recTasks > 0 && <span className="text-xs text-indigo-400">Recording : {u.recTasks}</span>}
                        {u.splitTasks > 0 && <span className="text-xs text-amber-400">Splitting : {u.splitTasks}</span>}
                        {u.qcTasks > 0 && <span className="text-xs text-emerald-400">QC : {u.qcTasks}</span>}
                     {u.correctionTasks > 0 && <span className="text-xs text-rose-400">Correction : {u.correctionTasks}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-bold text-lg">{u.total}</span>
                      <p className="text-gray-500 text-xs">tasks</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UserSection title="Active Users" users={activeUsers} color="text-emerald-400" badge="emerald" />
            <UserSection title="Idle Users" users={idleUsers} color="text-gray-500" badge="gray" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── SUB-COMPONENTS ── */

function MetricCard({ icon, label, value, sub, glowClass, accent }) {
  return (
    <div className={`bg-gray-900 rounded-2xl p-5 ${glowClass}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`text-3xl font-bold ${accent}`} style={{ fontFamily: "'DM Mono', monospace" }}>{value}</span>
      </div>
      <p className="text-white text-sm font-medium">{label}</p>
      <p className="text-gray-500 text-xs mt-1">{sub}</p>
    </div>
  );
}

function PipelineStage({ label, icon, active, done, pending, total, color }) {
  const colors = {
    indigo: { bar: "bg-indigo-500", active: "text-indigo-400 bg-indigo-500/10", text: "text-indigo-400" },
    amber: { bar: "bg-amber-400", active: "text-amber-400 bg-amber-500/10", text: "text-amber-400" },
    emerald: { bar: "bg-emerald-500", active: "text-emerald-400 bg-emerald-500/10", text: "text-emerald-400" },
    rose: { bar: "bg-rose-500", active: "text-rose-400 bg-rose-500/10", text: "text-rose-400" }, // ✅ add this
  };
  const c = colors[color];
  const doneWidth = total ? (done / total) * 100 : 0;
  const activeWidth = total ? (active / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-white text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.active}`}>⚡ {active} active</span>
          <span className="text-xs text-gray-500">✓ {done} done</span>
          <span className="text-xs text-gray-600">⏳ {pending} pending</span>
        </div>
      </div>
      <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden flex">
        <div className={`${c.bar} h-full mini-bar opacity-50`} style={{ width: `${activeWidth}%` }} />
        <div className={`${c.bar} h-full mini-bar`} style={{ width: `${doneWidth}%` }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-600">{total > 0 ? Math.round((done / total) * 100) : 0}% complete</span>
        <span className="text-xs text-gray-600">{total} total</span>
      </div>
    </div>
  );
}

function AlertCard({ icon, label, value, desc, urgent }) {
  return (
    <div className={`rounded-2xl p-4 border ${urgent ? "bg-rose-950/30 border-rose-800/40" : "bg-gray-900 border-gray-800"}`}>
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className={`text-2xl font-bold ${urgent ? "text-rose-400" : "text-white"}`} style={{ fontFamily: "'DM Mono', monospace" }}>{value}</span>
      </div>
      <p className={`text-sm font-medium ${urgent ? "text-rose-300" : "text-gray-300"}`}>{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
    </div>
  );
}

function SmallStat({ label, value, color }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
      <p className={`text-2xl font-bold ${color}`} style={{ fontFamily: "'DM Mono', monospace" }}>{value}</p>
      <p className="text-gray-500 text-xs mt-1">{label}</p>
    </div>
  );
}

function BookCard({ book, expandedBook, setExpandedBook, assignments,users }) {
  const statusColor = book.progress === 100 ? "bg-emerald-500" : book.progress > 50 ? "bg-indigo-500" : book.progress > 0 ? "bg-amber-400" : "bg-gray-600";
  const statusLabel = book.progress === 100 ? "Delivered" : book.progress > 0 ? "In Progress" : "Not Started";
  const statusText = book.progress === 100 ? "text-emerald-400 bg-emerald-500/10" : book.progress > 0 ? "text-amber-400 bg-amber-500/10" : "text-gray-500 bg-gray-800";

  return (
    <div className="book-card bg-gray-900 border border-gray-800 rounded-2xl p-5 cursor-default">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-white font-semibold">{book.bookName}</h4>
          <p className="text-gray-500 text-xs mt-0.5">{book.total} chapters total</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusText}`}>{statusLabel}</span>
          <span className="text-white font-bold text-lg" style={{ fontFamily: "'DM Mono', monospace" }}>{book.progress}%</span>
        </div>
        <button
          onClick={() =>
            setExpandedBook(expandedBook === book.id ? null : book.id)
          }
          className="text-indigo-400 text-sm hover:underline"
        >
          {expandedBook === book.id ? "Hide Chapters ▲" : "View Chapters ▶"}
        </button>
      </div>

      <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
        <div className={`${statusColor} h-full rounded-full mini-bar`} style={{ width: `${book.progress}%` }} />
      </div>

      <div className="flex gap-6 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-400">{book.delivered} delivered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-xs text-gray-400">{book.inProgress} in progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gray-600" />
          <span className="text-xs text-gray-400">{book.remaining} remaining</span>
        </div>
      </div>
     {expandedBook === book.id && (
  <div className="mt-4 border-t border-gray-800 pt-3 space-y-2">

    <div className="grid grid-cols-5 text-xs text-gray-400 border-b border-gray-800 pb-2 mb-2">
      <div>Chapter</div>
      <div>🎙 Recording</div>
      <div>✂ Splitting</div>
      <div>🔍 QC</div>
      <div>🛠 Correction</div>
    </div>

    {assignments?.filter(a => a.bookId === book?.id)?.map((ch) => {
      const recUser = users?.find(u => u.id === ch.recording?.userId);
      const splitUser = users?.find(u => u.id === ch.splitting?.userId);
      const qcUser = users?.find(u => u.id === ch.qc?.userId);
      const correctionUser = users?.find(u => u.id === ch.correction?.userId);

      return (
     <div
  key={ch.id}
  className="grid grid-cols-5 text-sm text-gray-300 py-2 border-b border-gray-800"
>
          <div>{ch.chapterName}</div>

          <ChapterStageCell status={ch.recording?.status} user={recUser} />
          <ChapterStageCell status={ch.splitting?.status} user={splitUser} />
          <ChapterStageCell status={ch.qc?.status} user={qcUser} />
          <ChapterStageCell status={ch.correction?.status} user={correctionUser} />
        </div>
      );
    })}
  </div>
)}
    </div>
  );
}

function ChapterStageCell({ status, user, compact }) {
  const STATUS_MAP = {
    1: { label: "Assigned", color: "text-blue-400 bg-blue-500/10" },
    2: { label: "Accepted", color: "text-indigo-400 bg-indigo-500/10" },
    3: { label: "Finished", color: "text-amber-400 bg-amber-500/10" },
    4: { label: "Revision", color: "text-orange-400 bg-orange-500/10" },
    6: { label: "Done", color: "text-emerald-400 bg-emerald-500/10" },
    8: { label: "Pending", color: "text-gray-500 bg-gray-800" },
  };
  const s = STATUS_MAP[status] || { label: "—", color: "text-gray-700 bg-transparent" };
  const isActive = [1, 2, 3, 4].includes(status);

  if (!status) return <span className="text-xs text-gray-700">—</span>;

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${s.color}`}>
        {isActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" style={{ verticalAlign: "middle" }} />}
        {s.label}
      </span>
      {!compact && user && (
        <span className="text-xs text-gray-500 truncate">{user.firstName} {user.lastName}</span>
      )}
      {compact && user && (
        <span className="text-xs text-gray-500 truncate">{user.firstName?.[0]}. {user.lastName}</span>
      )}
    </div>
  );
}

function UserSection({ title, users, color, badge }) {
  const badgeColors = {
    emerald: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    gray: "bg-gray-800 text-gray-500 border border-gray-700",
  };
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold text-sm ${color}`}>{title}</h3>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badgeColors[badge]}`}>{users.length}</span>
      </div>
      {users.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-4">No users</p>
      ) : (
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {users.map(u => (
            <div key={u.id} className="user-pill flex items-center gap-3 px-3 py-2 rounded-lg cursor-default transition-colors">
              <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-300 flex-shrink-0">
                {u.firstName?.[0]}
              </div>
              <span className="text-gray-300 text-sm">{u.firstName} {u.lastName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── ROLE-BASED DASHBOARDS ── */

function RecordingDashboard({ assignments }) {
  const userId = (getCookie("userId"));
  const tasks = assignments.filter(a => a.recording?.userId === userId && [1, 2].includes(a.recording?.status));
  return <SimpleDashboard title="Recording Tasks" icon="🎙️" count={tasks.length} color="indigo" />;
}

function SplittingDashboard({ assignments }) {
  const userId = (getCookie("userId"));
  const tasks = assignments.filter(a => a.splitting?.userId === userId && [1, 2].includes(a.splitting?.status));
  return <SimpleDashboard title="Splitting Tasks" icon="✂️" count={tasks.length} color="amber" />;
}

function QCDashboard({ assignments }) {
  const userId = (getCookie("userId"));
  const tasks = assignments.filter(a => a.qc?.userId === userId && [1, 2].includes(a.qc?.status));
  return <SimpleDashboard title="QC Pending Tasks" icon="🔍" count={tasks.length} color="emerald" />;
}

function CorrectionDashboard({ assignments }) {
  const userId = getCookie("userId");

  const tasks = assignments.filter(
    a => a.correction?.userId === userId && [1, 2].includes(a.correction?.status)
  );

  return (
    <SimpleDashboard
      title="Correction Tasks"
      icon="🛠️"
      count={tasks.length}
      color="rose"
    />
  );
}

function CombinedDashboard({ assignments }) {
  const userId = (getCookie("userId"));
  const recTasks = assignments.filter(a => a.recording?.userId === userId && [1, 2].includes(a.recording?.status)).length;
  const splitTasks = assignments.filter(a => a.splitting?.userId === userId && [1, 2].includes(a.splitting?.status)).length;
  return (
    <div className="space-y-4">
      <SimpleDashboard title="Recording Tasks" icon="🎙️" count={recTasks} color="indigo" />
      <SimpleDashboard title="Splitting Tasks" icon="✂️" count={splitTasks} color="amber" />
    </div>
  );
}

function SimpleDashboard({ title, icon, count, color }) {
  const colors = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  };
  return (
    <div className={`border rounded-2xl p-8 text-center ${colors[color]}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-sm font-medium opacity-70 mb-2">{title}</p>
      <p className="text-5xl font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>{count}</p>
      <p className="text-sm opacity-50 mt-2">active tasks</p>
    </div>
  );
}