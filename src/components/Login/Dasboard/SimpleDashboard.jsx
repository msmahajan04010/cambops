import { useNavigate } from "react-router-dom";

export default function SimpleDashboard({ title, icon, count, color, param }) {

  const navigate = useNavigate();

  const colors = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  };

  const handleClick = () => {
    if (count === 0) return;   // 🚫 prevent navigation
    navigate(`/MyAM?${param}=1`);
  };
  return (
    <div
      onClick={handleClick}
      className={`border rounded-2xl p-8 text-center cursor-pointer hover:scale-[1.02] transition ${colors[color]}`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="text-4xl mb-3">{icon}</div>

      <p className="text-sm font-medium opacity-70 mb-2">{title}</p>

      <p
        className="text-5xl font-bold"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        {count}
      </p>

      <p className="text-sm opacity-50 mt-2">active tasks</p>
    </div>
  );
}