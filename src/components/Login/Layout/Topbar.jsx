export default function Header({ title, subtitle }) {

  const userName = decodeURIComponent(getCookie("userName") || "User");
  
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  // ✅ If subtitle not passed, create default
  const finalSubtitle = subtitle || `Welcome back, ${userName}`;

  return (
    <header className="bg-gradient-to-r from-gray-900 to-black border-b border-gray-800 px-8 py-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white capitalize">{title}</h1>
          <p className="text-gray-400 text-sm">{finalSubtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">
                {userName?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">{userName}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}