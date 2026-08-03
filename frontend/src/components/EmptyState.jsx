export default function EmptyState({ message = "There's nothing here, yet." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <svg width="180" height="150" viewBox="0 0 180 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="90" cy="110" rx="85" ry="30" fill="#EAF0FB" />
        <rect x="55" y="35" width="70" height="90" rx="4" fill="#FFFFFF" stroke="#C7D3EA" strokeWidth="2" />
        <path d="M105 35 L125 55 L105 55 Z" fill="#EAF0FB" stroke="#C7D3EA" strokeWidth="2" />
        <line x1="65" y1="75" x2="110" y2="75" stroke="#C7D3EA" strokeWidth="2" />
        <line x1="65" y1="85" x2="110" y2="85" stroke="#C7D3EA" strokeWidth="2" />
        <line x1="65" y1="95" x2="95" y2="95" stroke="#C7D3EA" strokeWidth="2" />
        <circle cx="75" cy="55" r="1.8" fill="#283593" />
        <circle cx="95" cy="55" r="1.8" fill="#283593" />
        <path d="M75 65 Q85 60 95 65" stroke="#283593" strokeWidth="2" fill="none" strokeLinecap="round" />
        <line x1="72" y1="128" x2="72" y2="118" stroke="#C7D3EA" strokeWidth="3" strokeLinecap="round" />
        <line x1="108" y1="128" x2="108" y2="118" stroke="#C7D3EA" strokeWidth="3" strokeLinecap="round" />
        <rect x="95" y="15" width="42" height="24" rx="3" fill="#EAF0FB" stroke="#C7D3EA" strokeWidth="1.5" transform="rotate(-8 95 15)" />
        <text x="98" y="32" fontSize="11" fill="#283593" fontWeight="600" transform="rotate(-8 98 32)">Oops</text>
      </svg>
      <p className="text-primary font-medium mt-4">{message}</p>
    </div>
  );
}
