// import { useState, useEffect } from "react";
// import Layout from "../Layout/AdminLayout";

// // ── Mock Data ────────────────────────────────────────────────────────────────
// const MOCK_USERS = [
//   { id: 1, name: "Arjun Mehta",    avatar: "AM", stage: "recording", book: "Ramayana Vol.1",    progress: 72, tasksToday: 14, status: "active" },
//   { id: 2, name: "Priya Sharma",   avatar: "PS", stage: "splitting", book: "Mahabharata Ch.3",  progress: 45, tasksToday: 9,  status: "active" },
//   { id: 3, name: "Rahul Verma",    avatar: "RV", stage: "qc",        book: "Gita Press Ed.2",   progress: 88, tasksToday: 21, status: "active" },
//   { id: 4, name: "Sneha Patel",    avatar: "SP", stage: null,        book: null,                progress: 0,  tasksToday: 0,  status: "idle"   },
//   { id: 5, name: "Vikram Singh",   avatar: "VS", stage: "recording", book: "Upanishads Vol.4",  progress: 31, tasksToday: 6,  status: "active" },
//   { id: 6, name: "Meera Joshi",    avatar: "MJ", stage: null,        book: null,                progress: 0,  tasksToday: 0,  status: "idle"   },
//   { id: 7, name: "Karan Gupta",    avatar: "KG", stage: "splitting", book: "Vedas Anthology",   progress: 60, tasksToday: 11, status: "active" },
//   { id: 8, name: "Ananya Reddy",   avatar: "AR", stage: null,        book: null,                progress: 0,  tasksToday: 0,  status: "idle"   },
//   { id: 9, name: "Rohan Das",      avatar: "RD", stage: "qc",        book: "Puranas Digest",    progress: 95, tasksToday: 18, status: "active" },
//   { id: 10, name: "Divya Nair",    avatar: "DN", stage: "recording", book: "Sanskrit Reader",   progress: 22, tasksToday: 4,  status: "active" },
// ];

// const MOCK_BOOKS = [
//   { id: 1, title: "Ramayana Vol.1",   overall: 52, stage: "splitting", assignedTo: "Arjun Mehta",  totalPages: 320, donePages: 166 },
//   { id: 2, title: "Mahabharata Ch.3", overall: 48, stage: "splitting", assignedTo: "Priya Sharma", totalPages: 410, donePages: 197 },
//   { id: 3, title: "Gita Press Ed.2",  overall: 96, stage: "qc",        assignedTo: "Rahul Verma",  totalPages: 180, donePages: 173 },
//   { id: 4, title: "Upanishads Vol.4", overall: 10, stage: "recording", assignedTo: "Vikram Singh", totalPages: 290, donePages: 29  },
//   { id: 5, title: "Vedas Anthology",  overall: 53, stage: "splitting", assignedTo: "Karan Gupta",  totalPages: 500, donePages: 265 },
//   { id: 6, title: "Puranas Digest",   overall: 98, stage: "qc",        assignedTo: "Rohan Das",    totalPages: 240, donePages: 235 },
//   { id: 7, title: "Sanskrit Reader",  overall: 7,  stage: "recording", assignedTo: "Divya Nair",   totalPages: 150, donePages: 11  },
// ];

// const STAGE_COLORS = {
//   recording: { bg: "bg-violet-500/15", text: "text-violet-300", border: "border-violet-500/30", dot: "bg-violet-400" },
//   splitting:  { bg: "bg-amber-500/15",  text: "text-amber-300",  border: "border-amber-500/30",  dot: "bg-amber-400"  },
//   qc:         { bg: "bg-emerald-500/15",text: "text-emerald-300",border: "border-emerald-500/30",dot: "bg-emerald-400"},
// };

// // ── Sub-components ────────────────────────────────────────────────────────────

// function StatCard({ label, value, sub, accent }) {
//   return (
//     <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/4 p-6 backdrop-blur-sm group hover:border-white/20 transition-all duration-300">
//       <div
//         className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
//         style={{ background: `radial-gradient(circle at 50% 0%, ${accent}18 0%, transparent 70%)` }}
//       />
//       <p className="text-xs font-semibold tracking-widest uppercase text-white/40 mb-3">{label}</p>
//       <p className="text-4xl font-black text-white mb-1" style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", letterSpacing: "0.02em" }}>{value}</p>
//       <p className="text-xs text-white/30">{sub}</p>
//     </div>
//   );
// }

// function StageBadge({ stage }) {
//   if (!stage) return <span className="text-white/20 text-xs italic">unassigned</span>;
//   const c = STAGE_COLORS[stage];
//   return (
//     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
//       <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />
//       {stage.toUpperCase()}
//     </span>
//   );
// }

// function MiniBar({ value, color }) {
//   return (
//     <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
//       <div
//         className="h-full rounded-full transition-all duration-700"
//         style={{ width: `${value}%`, background: color }}
//       />
//     </div>
//   );
// }

// function Avatar({ initials, size = "md" }) {
//   const sz = size === "md" ? "w-9 h-9 text-sm" : "w-7 h-7 text-xs";
//   return (
//     <div className={`${sz} rounded-xl bg-white/10 border border-white/15 flex items-center justify-center font-bold text-white/70 flex-shrink-0`}>
//       {initials}
//     </div>
//   );
// }

// // ── Sections ──────────────────────────────────────────────────────────────────

// function IdleUsersSection({ users }) {
//   return (
//     <section>
//       <div className="flex items-center gap-3 mb-4">
//         <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
//         <h3 className="text-sm font-bold tracking-widest uppercase text-white/50">Idle Users</h3>
//         <span className="ml-auto bg-red-500/20 text-red-300 border border-red-500/30 text-xs px-2 py-0.5 rounded-full font-bold">{users.length}</span>
//       </div>
//       <div className="space-y-2">
//         {users.map(u => (
//           <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/6 bg-white/3 hover:bg-white/6 transition-colors">
//             <Avatar initials={u.avatar} />
//             <div className="flex-1 min-w-0">
//               <p className="text-sm font-semibold text-white/80 truncate">{u.name}</p>
//               <p className="text-xs text-white/30">No task assigned</p>
//             </div>
//             <div className="w-2 h-2 rounded-full bg-red-400/60" />
//           </div>
//         ))}
//       </div>
//     </section>
//   );
// }

// function ActiveUsersSection({ users }) {
//   return (
//     <section>
//       <div className="flex items-center gap-3 mb-4">
//         <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
//         <h3 className="text-sm font-bold tracking-widest uppercase text-white/50">Active Users</h3>
//         <span className="ml-auto bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2 py-0.5 rounded-full font-bold">{users.length}</span>
//       </div>
//       <div className="space-y-3">
//         {users.map(u => (
//           <div key={u.id} className="p-4 rounded-xl border border-white/6 bg-white/3 hover:bg-white/6 transition-colors group">
//             <div className="flex items-center gap-3 mb-3">
//               <Avatar initials={u.avatar} />
//               <div className="flex-1 min-w-0">
//                 <p className="text-sm font-semibold text-white/90 truncate">{u.name}</p>
//                 <p className="text-xs text-white/40 truncate">{u.book}</p>
//               </div>
//               <StageBadge stage={u.stage} />
//             </div>
//             <div className="space-y-1">
//               <div className="flex justify-between text-xs text-white/30 mb-1">
//                 <span>Task progress</span>
//                 <span className="text-white/60 font-bold">{u.progress}%</span>
//               </div>
//               <MiniBar
//                 value={u.progress}
//                 color={
//                   u.stage === "recording" ? "#a78bfa" :
//                   u.stage === "splitting" ? "#fbbf24" : "#34d399"
//                 }
//               />
//             </div>
//             <div className="mt-2 text-xs text-white/25">{u.tasksToday} tasks completed today</div>
//           </div>
//         ))}
//       </div>
//     </section>
//   );
// }

// function BookProgressSection({ books }) {
//   const getBarColor = (pct) =>
//     pct >= 80 ? "#34d399" : pct >= 40 ? "#fbbf24" : "#a78bfa";

//   return (
//     <section>
//       <div className="flex items-center gap-3 mb-4">
//         <div className="w-2 h-2 rounded-full bg-blue-400" />
//         <h3 className="text-sm font-bold tracking-widest uppercase text-white/50">Book Progress</h3>
//         <span className="ml-auto bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-2 py-0.5 rounded-full font-bold">{books.length}</span>
//       </div>
//       <div className="space-y-3">
//         {books.map(b => (
//           <div key={b.id} className="p-4 rounded-xl border border-white/6 bg-white/3 hover:border-white/14 transition-colors">
//             {/* Title row */}
//             <div className="flex items-center justify-between mb-1">
//               <p className="text-sm font-bold text-white/90 truncate pr-4">{b.title}</p>
//               <span
//                 className="text-2xl font-black flex-shrink-0"
//                 style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", color: getBarColor(b.overall) }}
//               >
//                 {b.overall}%
//               </span>
//             </div>
//             {/* Meta row */}
//             <div className="flex items-center gap-3 mb-3">
//               <StageBadge stage={b.stage} />
//               <span className="text-xs text-white/30 truncate">→ {b.assignedTo}</span>
//               <span className="text-xs text-white/20 ml-auto flex-shrink-0">{b.donePages}/{b.totalPages} pg</span>
//             </div>
//             {/* Single fat progress bar */}
//             <div className="h-2.5 w-full rounded-full bg-white/8 overflow-hidden">
//               <div
//                 className="h-full rounded-full transition-all duration-700"
//                 style={{ width: `${b.overall}%`, background: getBarColor(b.overall) }}
//               />
//             </div>
//           </div>
//         ))}
//       </div>
//     </section>
//   );
// }

// // ── Filters ───────────────────────────────────────────────────────────────────

// function FilterBar({ activeFilter, setActiveFilter }) {
//   const filters = ["all", "recording", "splitting", "qc", "idle"];
//   return (
//     <div className="flex gap-2 flex-wrap">
//       {filters.map(f => (
//         <button
//           key={f}
//           onClick={() => setActiveFilter(f)}
//           className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 border
//             ${activeFilter === f
//               ? "bg-white text-black border-white"
//               : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white/70"
//             }`}
//         >
//           {f}
//         </button>
//       ))}
//     </div>
//   );
// }

// // ── Main Dashboard ────────────────────────────────────────────────────────────

// export default function Dashboard() {
//   const [activeFilter, setActiveFilter] = useState("all");
//   const [tick, setTick] = useState(0);

//   // Simulate live tick every 5s for "feel"
//   useEffect(() => {
//     const t = setInterval(() => setTick(x => x + 1), 5000);
//     return () => clearInterval(t);
//   }, []);

//   const idle   = MOCK_USERS.filter(u => u.status === "idle");
//   const active = MOCK_USERS.filter(u => u.status === "active");

//   const filteredActive = activeFilter === "all"   ? active
//     : activeFilter === "idle"                     ? []
//     : active.filter(u => u.stage === activeFilter);

//   const filteredIdle = (activeFilter === "all" || activeFilter === "idle") ? idle : [];

//   const stageCount = (stage) => active.filter(u => u.stage === stage).length;

//   return (
//     <Layout 
//       title="Book List" 
//       subtitle="View and manage all books in the system"
//     >  
//     <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
//       {/* Google Font */}
//       <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Bebas+Neue&display=swap');`}</style>

//       {/* Header */}
//       <div className="mb-8">
//         <div className="flex items-end justify-between mb-6">
//           <div>
//             <p className="text-xs font-bold tracking-widest uppercase text-white/30 mb-1">Admin Control Center</p>
//             <h2 className="text-4xl font-black text-white" style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", letterSpacing: "0.04em" }}>
//               Live Dashboard
//             </h2>
//           </div>
//           <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5">
//             <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
//             <span className="text-xs font-bold text-emerald-300">LIVE</span>
//           </div>
//         </div>

//         {/* Stat Cards */}
//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//           <StatCard label="Total Users"  value={MOCK_USERS.length}   sub="registered"          accent="#6366f1" />
//           <StatCard label="Active Now"   value={active.length}       sub="on a task"           accent="#22c55e" />
//           <StatCard label="Idle Users"   value={idle.length}         sub="awaiting assignment" accent="#ef4444" />
//           <StatCard label="Books Running" value={MOCK_BOOKS.length}  sub="in pipeline"         accent="#3b82f6" />
//         </div>

//         {/* Stage breakdown */}
//         <div className="grid grid-cols-3 gap-3 mb-6">
//           {[
//             { stage: "recording", label: "Recording", color: "#a78bfa", count: stageCount("recording") },
//             { stage: "splitting", label: "Splitting",  color: "#fbbf24", count: stageCount("splitting") },
//             { stage: "qc",        label: "QC",         color: "#34d399", count: stageCount("qc")        },
//           ].map(s => (
//             <div key={s.stage} className="rounded-xl border border-white/8 bg-white/3 px-4 py-3 flex items-center gap-3">
//               <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
//               <div>
//                 <p className="text-xs text-white/40 uppercase tracking-wider font-bold">{s.label}</p>
//                 <p className="text-xl font-black text-white" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{s.count} users</p>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Filter bar */}
//         <FilterBar activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
//       </div>

//       {/* Main Grid: Users | Books */}
//       <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
//         {/* Left: Users */}
//         <div className="space-y-6">
//           {filteredIdle.length > 0 && <IdleUsersSection users={filteredIdle} />}
//           {filteredActive.length > 0 && <ActiveUsersSection users={filteredActive} />}
//           {filteredIdle.length === 0 && filteredActive.length === 0 && (
//             <div className="text-center py-16 text-white/20 text-sm border border-white/6 rounded-2xl">
//               No users match this filter
//             </div>
//           )}
//         </div>

//         {/* Right: Book Progress */}
//         <div>
//           <BookProgressSection books={MOCK_BOOKS} />
//         </div>
//       </div>
//     </div>
//     </Layout>
//   );
// }

// import { useEffect, useState } from "react";
// import { collection, getDocs } from "firebase/firestore";
// import { db } from "../../../firebase";
// import Layout from "../Layout/AdminLayout";

// export default function Dashboard() {
//   const [users, setUsers] = useState([]);
//   const [books, setBooks] = useState([]);
//   const [assignments, setAssignments] = useState([]);

//   const [idleUsers, setIdleUsers] = useState([]);
//   const [activeUsers, setActiveUsers] = useState([]);
//   const [bookProgress, setBookProgress] = useState([]);

//   useEffect(() => {
//     fetchDashboard();
//   }, []);

//   const fetchDashboard = async () => {
//     const userSnap = await getDocs(collection(db, "users"));
//     const bookSnap = await getDocs(collection(db, "books"));
//     const assignSnap = await getDocs(collection(db, "chapterAssignments"));

//     const userData = userSnap.docs.map(d => ({ id: d.id, ...d.data() }));
//     const bookData = bookSnap.docs.map(d => ({ id: d.id, ...d.data() }));
//     const assignData = assignSnap.docs.map(d => ({ id: d.id, ...d.data() }));

//     setUsers(userData);
//     setBooks(bookData);
//     setAssignments(assignData);

//     calculateData(userData, bookData, assignData);
//   };

//   const calculateData = (users, books, assignments) => {
//     // Active user IDs (status 1–4)
//     const activeUserIds = assignments
//       .filter(a => [1, 2, 3, 4].includes(a.chapterstatus))
//       .map(a => a.userId);

//     const uniqueActiveIds = [...new Set(activeUserIds)];

//     const active = users.filter(u => uniqueActiveIds.includes(u.id));
//     const idle = users.filter(u => !uniqueActiveIds.includes(u.id));

//     setActiveUsers(active);
//     setIdleUsers(idle);

//     // Book Progress
//     const progressData = books.map(book => {
//       const bookAssignments = assignments.filter(a => a.bookId === book.id);

//       const delivered = bookAssignments.filter(a => a.chapterstatus === 6).length;
//       const total = bookAssignments.length;

//       return {
//         ...book,
//         progress: total ? Math.round((delivered / total) * 100) : 0,
//         delivered,
//         total
//       };
//     });

//     setBookProgress(progressData);
//   };

//   const stageCount = (stage) => {
//     return assignments.filter(a => {
//       if (stage === "recording") {
//         return (a.typeId === 3 || a.typeId === 5) && [2, 3].includes(a.chapterstatus);
//       }
//       if (stage === "splitting") {
//         return (a.typeId === 2 || a.typeId === 5) && [2, 3].includes(a.chapterstatus);
//       }
//       if (stage === "qc") {
//         return a.chapterstatus === 4;
//       }
//       return false;
//     }).length;
//   };

//   return (
//     <Layout title="Admin Dashboard">

//       <div className="bg-gray-900 p-6 rounded-xl text-white">

//         {/* STATS */}
//         <div className="grid grid-cols-4 gap-4 mb-8">
//           <StatCard label="Total Users" value={users.length} />
//           <StatCard label="Active Users" value={activeUsers.length} />
//           <StatCard label="Idle Users" value={idleUsers.length} />
//           <StatCard label="Books Running" value={books.length} />
//         </div>

//         {/* STAGE BREAKDOWN */}
//         <div className="grid grid-cols-3 gap-4 mb-8">
//           <StageCard title="Recording" count={stageCount("recording")} />
//           <StageCard title="Splitting" count={stageCount("splitting")} />
//           <StageCard title="QC" count={stageCount("qc")} />
//         </div>

//         {/* USERS SECTION */}
//         <div className="grid grid-cols-2 gap-6 mb-8">

//           {/* Idle */}
//           <div>
//             <h3 className="text-lg font-bold mb-4 text-red-400">Idle Users</h3>
//             {idleUsers.length === 0 ? (
//               <p className="text-gray-400">No Idle Users</p>
//             ) : (
//               idleUsers.map(u => (
//                 <div key={u.id} className="p-3 border border-gray-700 rounded mb-2">
//                   {u.firstName} {u.lastName}
//                 </div>
//               ))
//             )}
//           </div>

//           {/* Active */}
//           <div>
//             <h3 className="text-lg font-bold mb-4 text-green-400">Active Users</h3>
//             {activeUsers.length === 0 ? (
//               <p className="text-gray-400">No Active Users</p>
//             ) : (
//               activeUsers.map(u => (
//                 <div key={u.id} className="p-3 border border-gray-700 rounded mb-2">
//                   {u.firstName} {u.lastName}
//                 </div>
//               ))
//             )}
//           </div>

//         </div>

//         {/* BOOK PROGRESS */}
//         <div>
//           <h3 className="text-lg font-bold mb-4 text-blue-400">Book Progress</h3>

//           {bookProgress.map(book => (
//             <div key={book.id} className="mb-4 p-4 border border-gray-700 rounded">

//               <div className="flex justify-between mb-2">
//                 <span>{book.bookName}</span>
//                 <span>{book.progress}%</span>
//               </div>

//               <div className="w-full bg-gray-700 h-3 rounded">
//                 <div
//                   className="bg-green-500 h-3 rounded"
//                   style={{ width: `${book.progress}%` }}
//                 />
//               </div>

//               <div className="text-sm text-gray-400 mt-1">
//                 {book.delivered} / {book.total} Delivered
//               </div>

//             </div>
//           ))}

//         </div>

//       </div>
//     </Layout>
//   );
// }

// /* Reusable Components */

// function StatCard({ label, value }) {
//   return (
//     <div className="bg-gray-800 p-4 rounded text-center">
//       <p className="text-gray-400 text-sm">{label}</p>
//       <p className="text-2xl font-bold">{value}</p>
//     </div>
//   );
// }

// function StageCard({ title, count }) {
//   return (
//     <div className="bg-gray-800 p-4 rounded text-center">
//       <p className="text-gray-400 text-sm">{title}</p>
//       <p className="text-xl font-bold">{count}</p>
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";
import Layout from "../Layout/AdminLayout";

/* ---------------- ROLE CONSTANTS ---------------- */

const ROLE = {
  ADMIN: 1,
  SPLITTING: 2,
  RECORDING: 3,
  QC: 4,
  BOTH: 5,
  ADMIN1: 0
};

/* ---------------- HELPER ---------------- */

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2)
    return decodeURIComponent(parts.pop().split(";").shift());
}

/* ---------------- MAIN COMPONENT ---------------- */

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const userTypeId = Number(getCookie("userTypeId"));

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    const userSnap = await getDocs(collection(db, "users"));
    const bookSnap = await getDocs(collection(db, "books"));
    const assignSnap = await getDocs(collection(db, "chapterAssignments"));

    setUsers(userSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setBooks(bookSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setAssignments(assignSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  return (
    <Layout title="Dashboard">

      {(userTypeId === ROLE.ADMIN || userTypeId === ROLE.ADMIN1) && (
        <AdminDashboard users={users} books={books} assignments={assignments} />
      )}

      {userTypeId === ROLE.RECORDING && (
        <RecordingDashboard assignments={assignments} />
      )}

      {userTypeId === ROLE.SPLITTING && (
        <SplittingDashboard assignments={assignments} />
      )}

      {userTypeId === ROLE.QC && (
        <QCDashboard assignments={assignments} />
      )}

      {userTypeId === ROLE.BOTH && (
        <CombinedDashboard assignments={assignments} />
      )}

    </Layout>
  );
}

/* ---------------- ADMIN DASHBOARD ---------------- */

function AdminDashboard({ users, books, assignments }) {

  /* ---------------- ACTIVE USERS ---------------- */

  const activeUserIds = [];

  assignments.forEach(a => {
    if ([1,2,3,4].includes(a.recording?.status)) {
      activeUserIds.push(a.recording.userId);
    }
    if ([1,2,3,4].includes(a.splitting?.status)) {
      activeUserIds.push(a.splitting.userId);
    }
    if ([1,2,3,4].includes(a.qc?.status)) {
      activeUserIds.push(a.qc.userId);
    }
  });

  const uniqueActiveIds = [...new Set(activeUserIds)];
  const activeUsers = users.filter(u => uniqueActiveIds.includes(u.id));
  const idleUsers = users.filter(u => !uniqueActiveIds.includes(u.id));

  /* ---------------- BOOK PROGRESS ---------------- */

  const bookProgress = books.map(book => {
    const bookAssignments = assignments.filter(a => a.bookId === book.id);

    const uniqueChapters = [
      ...new Set(bookAssignments.map(a => a.chapterNumber))
    ];

    const deliveredChapters = [
      ...new Set(
        bookAssignments
          .filter(a =>
            a.recording?.status === 6 &&
            a.splitting?.status === 6 &&
            a.qc?.status === 6
          )
          .map(a => a.chapterNumber)
      )
    ];

    const total = uniqueChapters.length;
    const delivered = deliveredChapters.length;

    return {
      ...book,
      progress: total ? Math.round((delivered / total) * 100) : 0,
      delivered,
      total
    };
  });

  const runningBooks = bookProgress.filter(
    b => b.delivered < b.total
  );

  /* ---------------- STAGE COUNTS ---------------- */

  const recordingPending = assignments.filter(a =>
    [1,2,3,4].includes(a.recording?.status)
  ).length;

  const splittingPending = assignments.filter(a =>
    [1,2,3,4].includes(a.splitting?.status)
  ).length;

  const qcPending = assignments.filter(a =>
    [1,2,3,4].includes(a.qc?.status)
  ).length;

  return (
    <div className="space-y-8">

      {/* ================= KPI CARDS ================= */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

        <KpiCard title="Total Users" value={users.length} color="blue" />
        <KpiCard title="Active Users" value={activeUsers.length} color="green" />
        <KpiCard title="Running Books" value={runningBooks.length} color="yellow" />
        <KpiCard title="Delivered Books" value={books.length - runningBooks.length} color="purple" />

      </div>

      {/* ================= STAGE DISTRIBUTION ================= */}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-6 text-white">
          Workflow Distribution
        </h3>

        <StageBar label="Recording Pending" value={recordingPending} color="bg-blue-500" />
        <StageBar label="Splitting Pending" value={splittingPending} color="bg-yellow-400" />
        <StageBar label="QC Pending" value={qcPending} color="bg-green-500" />
      </div>

      {/* ================= BOOK PROGRESS ================= */}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-6 text-white">
          Book Progress
        </h3>

        <div className="space-y-5">
          {bookProgress.map(book => (
            <div key={book.id} className="bg-gray-800 rounded-xl p-4">

              <div className="flex justify-between mb-2">
                <span className="text-white font-semibold">
                  {book.bookName}
                </span>
                <span className="text-gray-400">
                  {book.progress}%
                </span>
              </div>

              <div className="w-full bg-gray-700 h-3 rounded-full">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${book.progress}%` }}
                />
              </div>

              <div className="text-xs text-gray-400 mt-2">
                {book.delivered} / {book.total} Chapters Delivered
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* ================= USERS SECTION ================= */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <UserSection
          title="Active Users"
          users={activeUsers}
          color="text-green-400"
        />

        <UserSection
          title="Idle Users"
          users={idleUsers}
          color="text-red-400"
        />

      </div>

    </div>
  );
}

function KpiCard({ title, value, color }) {

  const colors = {
    blue: "bg-blue-600/20 text-blue-400",
    green: "bg-green-600/20 text-green-400",
    yellow: "bg-yellow-600/20 text-yellow-400",
    purple: "bg-purple-600/20 text-purple-400"
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <p className="text-gray-400 text-sm mb-2">{title}</p>
      <p className={`text-3xl font-bold ${colors[color]}`}>
        {value}
      </p>
    </div>
  );
}

function StageBar({ label, value, color }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1 text-gray-300">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="w-full bg-gray-800 h-3 rounded-full">
        <div
          className={`${color} h-3 rounded-full`}
          style={{ width: `${Math.min(value * 5, 100)}%` }}
        />
      </div>
    </div>
  );
}


function UserSection({ title, users, color }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className={`text-lg font-bold mb-4 ${color}`}>
        {title} ({users.length})
      </h3>

      {users.length === 0 ? (
        <p className="text-gray-400 text-sm">No users</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {users.map(u => (
            <div
              key={u.id}
              className="bg-gray-800 rounded-lg px-3 py-2 text-white text-sm"
            >
              {u.firstName} {u.lastName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
/* ---------------- RECORDING DASHBOARD ---------------- */

function RecordingDashboard({ assignments }) {
const tasks = assignments.filter(
  a => [1,2,3,4].includes(a.recording?.status)
);

  return (
    <SimpleDashboard title="Recording Tasks" count={tasks.length} />
  );
}

/* ---------------- SPLITTING DASHBOARD ---------------- */

function SplittingDashboard({ assignments }) {
const tasks = assignments.filter(
  a => [1,2,3,4].includes(a.splitting?.status)
);

  return (
    <SimpleDashboard title="Splitting Tasks" count={tasks.length} />
  );
}

/* ---------------- QC DASHBOARD ---------------- */

function QCDashboard({ assignments }) {
const tasks = assignments.filter(
  a => [1,2,3,4].includes(a.qc?.status)
);

  return (
    <SimpleDashboard title="QC Pending Tasks" count={tasks.length} />
  );
}

/* ---------------- BOTH DASHBOARD ---------------- */

function CombinedDashboard({ assignments }) {
const tasks = assignments.filter(
  a =>
    [1,2,3,4].includes(a.recording?.status) ||
    [1,2,3,4].includes(a.splitting?.status)
);

  return (
    <SimpleDashboard title="Recording & Splitting Tasks" count={tasks.length} />
  );
}

/* ---------------- REUSABLE COMPONENTS ---------------- */

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-800 p-4 rounded text-center">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function SimpleDashboard({ title, count }) {
  return (
    <div className="bg-gray-900 p-6 rounded-xl text-white">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="bg-gray-800 p-6 rounded-xl text-center">
        <p className="text-gray-400 text-sm">Total</p>
        <p className="text-3xl font-bold">{count}</p>
      </div>
    </div>
  );
}