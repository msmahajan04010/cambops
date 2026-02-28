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
  const userId = Number(getCookie("userId"));

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    const userSnap = await getDocs(collection(db, "users"));
    const bookSnap = await getDocs(collection(db, "books"));
    const assignSnap = await getDocs(collection(db, "chapterAssignments"));

    setUsers(userSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setBooks(bookSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setAssignments(assignSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  if (loading) {
    return (
      <Layout title="Dashboard" subtitle="View and Check all transactions of the System">
        <div className="flex items-center justify-center h-[70vh]">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }


  return (
    <Layout title="Dashboard" subtitle="View and Check all transactions of the System">

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
    if ([1, 2, 3, 4].includes(a.recording?.status)) {
      activeUserIds.push(a.recording.userId);
    }
    if ([1, 2, 3, 4].includes(a.splitting?.status)) {
      activeUserIds.push(a.splitting.userId);
    }
    if ([1, 2, 3, 4].includes(a.qc?.status)) {
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
    [1, 2, 3, 4].includes(a.recording?.status)
  ).length;

  const splittingPending = assignments.filter(a =>
    [1, 2, 3, 4].includes(a.splitting?.status)
  ).length;

  const qcPending = assignments.filter(a =>
    [1, 2, 3, 4].includes(a.qc?.status)
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
  const userId = Number(getCookie("userId"));

  const tasks = assignments.filter(
    a =>
      a.recording?.userId === userId &&
      [1, 2, 3, 4].includes(a.recording?.status)
  );

  return (
    <SimpleDashboard title="Recording Tasks" count={tasks.length} />
  );
}

/* ---------------- SPLITTING DASHBOARD ---------------- */

function SplittingDashboard({ assignments }) {
  const userId = Number(getCookie("userId"));

  const tasks = assignments.filter(
    a =>
      a.splitting?.userId === userId &&
      [1, 2, 3, 4].includes(a.splitting?.status)
  );

  return (
    <SimpleDashboard title="Splitting Tasks" count={tasks.length} />
  );
}

/* ---------------- QC DASHBOARD ---------------- */

function QCDashboard({ assignments }) {
  const userId = Number(getCookie("userId"));

  const tasks = assignments.filter(
    a =>
      a.qc?.userId === userId &&
      [1, 2, 3, 4].includes(a.qc?.status)
  );

  return (
    <SimpleDashboard title="QC Pending Tasks" count={tasks.length} />
  );
}
/* ---------------- BOTH DASHBOARD ---------------- */

function CombinedDashboard({ assignments }) {
  const tasks = assignments.filter(
    a =>
      [1, 2, 3, 4].includes(a.recording?.status) ||
      [1, 2, 3, 4].includes(a.splitting?.status)
  );

  return (
    <SimpleDashboard title="Recording & Splitting Tasks" count={tasks.length} />
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