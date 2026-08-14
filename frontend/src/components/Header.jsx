import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ClipboardList, ArrowLeft, Share2, X, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";

export default function Header({
  title,
  showSearch = false,
  searchPanel = null,
  onSearch = null,
  showBack = false,
  showShare = false,
  showHistory = false,
  onHistoryClick,
  historyOpen = false,
  showLogout = false,
  onLogout,
  onShareClick,
}) {
  const navigate = useNavigate();
  const { borrowers, loans } = useData();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  const suggestions = useMemo(() => {
    const items = [];
    borrowers.forEach((borrower) => {
      items.push({
        type: "Borrower",
        label: borrower.name,
        subtitle: `${borrower.mobile || "No mobile"} • ${borrower.shopWork || "No work"}`,
        path: "/borrowers",
        value: borrower.id,
      });
    });
    loans.forEach((loan) => {
      items.push({
        type: "Loan",
        label: loan.loanId,
        subtitle: `${loan.borrowerName || "Unknown"} • ₹${loan.loanAmount || 0}`,
        path: `/loan/${loan.loanId}`,
        value: loan.loanId,
      });
    });
    return items;
  }, [borrowers, loans]);

  const filteredSuggestions = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!searchOpen || !keyword) return [];
    return suggestions
      .filter(
        (item) =>
          item.label.toLowerCase().includes(keyword) ||
          item.subtitle.toLowerCase().includes(keyword) ||
          item.type.toLowerCase().includes(keyword)
      )
      .slice(0, 6);
  }, [searchOpen, searchQuery, suggestions]);

  function handleSuggestionClick(item) {
    setSearchOpen(false);
    setSearchQuery("");
    if (item.path) {
      navigate(item.path);
    }
  }

  return (
    <header className="relative bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="flex items-center justify-between px-4 py-4 card-3d header-3d">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="text-primary"
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <h1 className="text-2xl font-semibold text-primary">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {showSearch && (
            <>
              {!searchOpen && (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-9 h-9 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-700"
                  aria-label="Open search"
                >
                  <Search size={18} />
                </button>
              )}

              {searchOpen && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 px-4">
                  <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 shadow-sm">
                    <Search size={18} className="text-gray-500" />
                    <input
                      ref={inputRef}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (onSearch) onSearch(e.target.value);
                      }}
                      placeholder="Search borrowers, loans..."
                      className="w-full bg-transparent text-sm text-gray-900 outline-none"
                    />
                    <button
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className="text-gray-500"
                      aria-label="Close search"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {filteredSuggestions.length > 0 && (
                    <div className="mt-2 max-h-72 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl card-3d">
                      {filteredSuggestions.map((item) => (
                        <button
                          key={`${item.type}-${item.value}`}
                          onClick={() => handleSuggestionClick(item)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-gray-900">{item.label}</span>
                            <span className="text-[11px] uppercase tracking-[0.15em] text-gray-500">
                              {item.type}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">{item.subtitle}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {/* allow pages to inject additional filter UI below the search box */}
                  {searchPanel && (
                    <div className="mt-3">{searchPanel}</div>
                  )}
                </div>
              )}
            </>
          )}
          {showHistory && (
            <button
              onClick={() => navigate("/history")}
              className="w-9 h-9 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-700"
              aria-label="Open history page"
            >
              <History size={18} />
            </button>
          )}
          {showLogout && onLogout && (
            <button
              onClick={onLogout}
              className="bg-red-50 text-red-500 font-medium text-sm px-4 py-1.5 rounded-full"
            >
              Logout
            </button>
          )}
          {showShare && (
            <button onClick={onShareClick} className="text-primary" aria-label="Share">
              <Share2 size={20} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
