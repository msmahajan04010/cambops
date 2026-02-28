import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";
import Layout from "../Layout/AdminLayout";
import { useNavigate } from "react-router-dom";
/* ─── Inline styles ─────────────────────────────────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Pirata+One&family=IM+Fell+DW+Pica:ital@0;1&display=swap');

.map-root {
  min-height: 100vh;
  background: #1a0f00;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  font-family: 'IM Fell DW Pica', serif;
}

.map-frame {
  position: relative;
  width: 100%;
  max-width: 960px;
  aspect-ratio: 4/3;
  border: 8px solid #5c3208;
  border-radius: 4px;
  box-shadow:
    0 0 0 3px #8B5E1A,
    0 0 0 6px #5c3208,
    0 30px 80px rgba(0,0,0,0.9),
    inset 0 0 120px rgba(80,35,0,0.5);
  overflow: hidden;
}

.map-parchment {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 15% 15%, #e8c88a 0%, transparent 45%),
    radial-gradient(ellipse at 85% 20%, #d4a860 0%, transparent 40%),
    radial-gradient(ellipse at 50% 60%, #c8963e 0%, transparent 55%),
    radial-gradient(ellipse at 10% 85%, #b8822e 0%, transparent 35%),
    radial-gradient(ellipse at 90% 90%, #c89050 0%, transparent 40%),
    #c8a054;
}

.map-parchment::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.18'/%3E%3C/svg%3E");
  opacity: 0.9;
  mix-blend-mode: multiply;
}

.map-parchment::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 0% 0%, rgba(60,20,0,0.55) 0%, transparent 30%),
    radial-gradient(ellipse at 100% 0%, rgba(60,20,0,0.45) 0%, transparent 28%),
    radial-gradient(ellipse at 0% 100%, rgba(60,20,0,0.45) 0%, transparent 28%),
    radial-gradient(ellipse at 100% 100%, rgba(60,20,0,0.55) 0%, transparent 30%),
    radial-gradient(ellipse at 50% 0%, rgba(40,15,0,0.3) 0%, transparent 25%),
    radial-gradient(ellipse at 50% 100%, rgba(40,15,0,0.3) 0%, transparent 25%);
}

.map-content {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
}

.map-title-banner {
  position: absolute;
  top: 3%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 10;
  width: max-content;
}

.map-title-banner h1 {
  font-family: 'Pirata One', cursive;
  font-size: clamp(1.1rem, 2.8vw, 1.9rem);
  color: #3d1500;
  text-shadow: 1px 1px 0 rgba(255,200,100,0.4), 2px 2px 6px rgba(0,0,0,0.3);
  letter-spacing: 0.08em;
  line-height: 1.1;
  white-space: nowrap;
}

.map-title-banner p {
  font-style: italic;
  font-size: clamp(0.5rem, 1.1vw, 0.7rem);
  color: #6b3200;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-top: 2px;
}

.title-rule {
  height: 1.5px;
  background: linear-gradient(to right, transparent, #7a3d00, #c8860a, #7a3d00, transparent);
  margin: 3px 0;
}

/* Step nodes */
.step-node {
  position: absolute;
  transform: translate(-50%, -50%);
  text-align: center;
  cursor: default;
  z-index: 8;
}

.step-node-circle {
  width: clamp(34px, 5.5vw, 50px);
  height: clamp(34px, 5.5vw, 50px);
  border-radius: 50%;
  border: 3px solid #5a2800;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(0.9rem, 1.6vw, 1.35rem);
  margin: 0 auto 3px;
  position: relative;
  box-shadow: 0 2px 10px rgba(0,0,0,0.35);
  transition: all 0.3s ease;
}

.step-node-circle.done {
  background: radial-gradient(circle at 38% 32%, #ffe066, #c8860a 70%);
  border-color: #3d1500;
  box-shadow: 0 0 14px rgba(200,134,10,0.7), 0 2px 10px rgba(0,0,0,0.4);
  animation: node-glow 2.5s ease-in-out infinite;
}

.step-node-circle.pending {
  background: radial-gradient(circle at 38% 32%, #c8a97e, #8a6030 80%);
  border-color: #7a4a1e;
  opacity: 0.55;
  filter: grayscale(0.4);
}

@keyframes node-glow {
  0%, 100% { box-shadow: 0 0 12px rgba(200,134,10,0.6), 0 2px 10px rgba(0,0,0,0.4); }
  50%       { box-shadow: 0 0 26px rgba(220,160,10,0.9), 0 2px 10px rgba(0,0,0,0.4); }
}

.x-mark {
  position: absolute;
  bottom: -5px;
  right: -5px;
  font-size: 0.85rem;
  color: #cc0000;
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 0 5px rgba(220,0,0,0.5);
  animation: pulse-x 1.8s ease-in-out infinite;
}

@keyframes pulse-x {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.6; transform: scale(0.8); }
}

.step-node-label {
  font-family: 'IM Fell DW Pica', serif;
  font-size: clamp(0.42rem, 0.85vw, 0.62rem);
  color: #3d1500;
  line-height: 1.25;
  max-width: clamp(55px, 8.5vw, 85px);
  font-style: italic;
  text-shadow: 0 1px 2px rgba(255,220,150,0.5);
}

.step-node-status {
  font-size: clamp(0.36rem, 0.65vw, 0.52rem);
  margin-top: 2px;
  letter-spacing: 0.03em;
}

.step-node-status.done    { color: #5a2000; font-weight: bold; }
.step-node-status.pending { color: #9a7050; font-style: italic; }

.step-node:hover .step-tooltip { opacity: 1; }

.step-tooltip {
  position: absolute;
  bottom: 105%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(28, 10, 0, 0.93);
  color: #f5d98a;
  font-family: 'IM Fell DW Pica', serif;
  font-style: italic;
  font-size: 0.6rem;
  padding: 4px 9px;
  border-radius: 3px;
  border: 1px solid #8B5E1A;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 20;
}

/* Remarks */
.remarks-scroll {
  position: absolute;
  bottom: 3%;
  left: 50%;
  transform: translateX(-50%);
  width: 52%;
  background: rgba(80,35,0,0.1);
  border: 1.5px solid rgba(100,50,10,0.45);
  border-radius: 3px;
  padding: 5px 12px 7px;
  z-index: 9;
}

.remarks-scroll-title {
  font-family: 'Pirata One', cursive;
  font-size: clamp(0.55rem, 1vw, 0.72rem);
  color: #3d1500;
  text-align: center;
  letter-spacing: 0.07em;
  border-bottom: 1px dashed rgba(100,50,10,0.4);
  padding-bottom: 3px;
  margin-bottom: 4px;
}

.remark-line {
  font-style: italic;
  font-size: clamp(0.42rem, 0.75vw, 0.58rem);
  color: #4a2000;
  line-height: 1.4;
  padding: 1px 0;
}

.loading-msg {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'IM Fell DW Pica', serif;
  font-style: italic;
  color: #5a2d00;
  font-size: 1.1rem;
}
`;

/* ─── Step positions (% of map width/height) ─────────────────────────────── */
const POSITIONS = [
    { x: 17, y: 33 },   // 0 Recording Assigned  — top-left area
    { x: 33, y: 23 },   // 1 Recording Accepted  — small bay
    { x: 50, y: 38 },   // 2 Recording Completed — center lake
    { x: 64, y: 30 },   // 3 Splitting           — dragon mountains
    { x: 79, y: 46 },   // 4 QC Approved         — pirate bay
    { x: 63, y: 14 },   // 5 Delivered           — treasure top-right
];

const ICONS = ["🏴‍☠️", "⚓", "🗺️", "⚔️", "💀", "💎"];
const LABELS = [
    ["Recording", "Assigned"],
    ["Recording", "Accepted"],
    ["Recording", "Completed"],
    ["Splitting", "Completed"],
    ["QC", "Approved"],
    ["Treasure", "Delivered"],
];


/* ─── Main component ─────────────────────────────────────────────────────── */
export default function ChapterJourney() {
    const { bookId, chapterNumber,chapterName } = useParams();
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();

    const fetchData = async () => {
        const [assignSnap, userSnap] = await Promise.all([
            getDocs(collection(db, "chapterAssignments")),
            getDocs(collection(db, "users"))
        ]);

        const assignments = assignSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const userList = userSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const found = assignments.find(
            a =>
                a.bookId === bookId &&
                String(a.chapterNumber) === String(chapterNumber)
        );

        setAssignment(found);
        setUsers(userList);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);


    const getUserName = (userId) => {
        const user = users.find(u => u.id === userId);
        return user ? `${user.firstName} ${user.lastName}` : "Unknown Pirate";
    };

    const getInitials = (userId) => {
        const user = users.find(u => u.id === userId);
        if (!user) return "?";
        return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`;
    };


    const getIcon = (action) => {
        switch (action) {
            case "assigned": return "🗺️";
            case "accepted": return "⚓";
            case "completed": return "🏁";
            case "declined": return "💣";
            case "approved": return "🛡️";
            case "delivered": return "💎";
            case "reverted": return "↩";
            default: return "📜";
        }
    };

    const getCardStyle = (action) => {
        switch (action) {
            case "declined": return "border-red-700 bg-red-900/20";
            case "completed": return "border-green-700 bg-green-900/20";
            case "approved": return "border-purple-700 bg-purple-900/20";
            case "delivered": return "border-emerald-700 bg-emerald-900/20";
            default: return "border-amber-800 bg-amber-900/20";
        }
    };

    const history =
        assignment?.history?.slice().sort(
            (a, b) => a.timestamp?.seconds - b.timestamp?.seconds
        ) || [];




    return (
        <Layout title="Chapter Journey" subtitle="Chapter Workflow For Admin">
            <style>{css}</style>

            <div className="map-root">
                <div className="map-frame">

                    {/* Aged parchment */}
                    <div className="map-parchment" />


                    {/* Interactive content */}
                    <div className="map-content relative overflow-y-auto px-16 pt-32 pb-24">
                        <div className="absolute top-6 left-6 z-30">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 bg-amber-900/80 hover:bg-amber-800 text-amber-200 px-4 py-2 rounded-lg border border-amber-700 shadow-md transition-all duration-200"
                            >
                                ← Back
                            </button>
                        </div>
                        {/* Title */}
                        <div className="map-title-banner">
                            <div className="title-rule" />
                            <h1>Chapter {chapterName} — Voyage Chart</h1>

                            <div className="title-rule" />
                        </div>

                        {loading ? (
                            <div className="loading-msg">⚓ Consulting the ancient charts…</div>
                        ) : (
                            <>
                                <div className="relative z-20 flex flex-col space-y-10">

                                    {/* Step nodes */}
                                    {history.map((event, index) => (
                                        <div
                                            key={index}
                                            className="relative flex items-start mb-10 animate-fadeIn"
                                            style={{ animationDelay: `${index * 0.05}s` }}
                                        >

                                            {/* Avatar Coin */}
                                            <div
                                                className={`relative z-10 w-16 h-16 rounded-full border-4 
  flex items-center justify-center font-bold shadow-xl
  ${event.stage === "admin"
                                                        ? "bg-gradient-to-br from-emerald-600 to-green-800 border-emerald-900 text-white"
                                                        : event.stage === "qc"
                                                            ? "bg-gradient-to-br from-purple-600 to-indigo-800 border-purple-900 text-white"
                                                            : "bg-gradient-to-br from-yellow-600 to-amber-800 border-amber-900 text-black"
                                                    }`}
                                            >
                                                {event.stage === "admin"
                                                    ? "AD"
                                                    : event.stage === "qc"
                                                        ? "QC"
                                                        : getInitials(event.userId)}
                                            </div>

                                            {/* Log Card */}
                                            <div className={`ml-5 flex-1 p-3 rounded-lg border-2 ${getCardStyle(event.action)} shadow-2xl backdrop-blur-sm transition hover:scale-[1.02] duration-300`}>

                                                <div className="flex justify-between items-center mb-2">
                                                    <h3 className="text-lg font-bold capitalize tracking-wide">
                                                        {event.stage} — {event.action}
                                                    </h3>
                                                    <span className="text-xl">
                                                        {getIcon(event.action)}
                                                    </span>
                                                </div>

                                                <div className="text-sm text-amber-300 mb-1">
                                                    {event.stage === "admin" ? (
                                                        <span className="font-semibold text-emerald-300">
                                                            Action performed by Admin
                                                        </span>
                                                    ) : event.stage === "qc" ? (
                                                        <span>
                                                            QC by : {" "}
                                                            <span className="font-semibold text-amber-100">
                                                                {getUserName(event.userId)}
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            Issued to : {" "}
                                                            <span className="font-semibold text-amber-100">
                                                                {getUserName(event.userId)}
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>

                                                {event.remark && (
                                                    <div className="mt-2 italic text-amber-200 bg-black/30 p-3 rounded border border-amber-700">
                                                        “{event.remark}”
                                                    </div>
                                                )}

                                                <div className="mt-3 text-xs text-black">
                                                    {event.timestamp?.seconds
                                                        ? new Date(event.timestamp.seconds * 1000).toLocaleString()
                                                        : ""}
                                                </div>

                                            </div>
                                        </div>
                                    ))} </div>

                                {/* Remarks */}

                            </>
                        )}

                    </div>
                </div>
            </div>
        </Layout>
    );
}