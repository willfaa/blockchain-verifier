//frontend/components/features/CertificateTemplate.tsx
import React from "react";
import { QrCode } from "lucide-react";

// --- ASSETS ---
// Base64 Logo (Placeholder - User should replace with actual Base64 of their logo)
// This ensures the logo renders consistently across different environments (Frontend/Print)
const LOGO_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAD0ElEQVR4nO2bW2gTWRzG/7Mx07Spto1309iKFwvF1mKvF6zgB9GLV0UEwQcFFRG84KUIWlFBEQRF8EIREbwgKooi+CB4QfBCoaCliLba3bSpSZu0Sc0ymS/JSZqZzCSZSc6M+L0NM2fO+X7znzMz58yYACAej8fjcTqFfD5fJqL9RHSYiE4QUZaIUo1/M51/Gf9mEVEBEQ0S0RAzfR+Px3/26wF+Y2b6hIi+IqJv6T9m+omIBpnpeDwe9+sB/A2A20R0l5k2M9N6ZlpHRKuI6G8iOuPUAxiQ14noHhE1ZA3+nJk+IqLjjjjAAHhARDcyB29mpvVEdJaZ3jjuAAbA/cwB25hpAzN98sIBDIC7RHSdmTYy03oiOs9M7x1zAAXgABFdyx64iZk2MtMnRxzAAHhARNeIaAMz3WOmj444gALws3g/M21gpk+OOIABcJeIrjHThswBnz1zAAXgABFdyxzwgZk+OeIABsADzLSBmdYTUc6sA045gALwIxFdyx7wgbMOYM7/QEQ3mGkjM91z1gEMgHtEdC1zwAdnHMCA/0hEN5hpQ+aAz445gALwAxFdY6YNzHSfmT455gAGwH0iusFM6zMHfHLEAQyAn4hok58OME4AMz1xzAEMgHtEdIOZ1jPTB8ccwAD4kYg2+O0A4wQw0yfHHMAAuEdE15hpvV8OME4AM31yzAEMgJ+IaL2fDjBOADN9dswBlANwi4husNdb4JMDjBPATB8dcQADIM9M65jpvV8OME4AM310zAFcADjATB88d4BxAmQ6gIjWeu4A4wTIdAAzve+lA4wTwEwfHHMAlwP8dYBxApjpo2MOcADgqQOME8BMHx1zgAMATx1gnABm+uiYAwwAPHWA28z00TEHGAB46gDjBDDTB8cc4ADAUwcYJ4CZPjrmAAcAnjrAOAHM9NExBxgAeOoA4wQw00fHHOAAwFMHGCeAmT465gAHAB46wDgBjnnAbWb66JgDLAB46ADjBDDTZ8ccwAC4R0TXmGmDn40Q4wQw02fHHMAA+ImINvrVAC8c4D8AmM19AJhN/Z8AmM19AJhN/Z8AmM19AJhN/Z8AmM19AJhN/Z8AmM19AJhN/Z8AmM19AJhN/Z8AmM19AJhN/Z8AmM19AJhN/Z8AmM19AJhN/Z8AmM19AJhN/Z8AmM19AJhN/Z8AmM19AJhN/Z8AmM19AJhN/Z8AmM19AJhN/Z8AmM19AJhNfRYA8Xg8Ho+z+Q/rC5D7k3y6+wAAAABJRU5ErkJggg=="; // Simple placeholder icon

interface CertificateProps {
  studentName?: string;
  courseName?: string;
  completionDate?: string;
  certificateId?: string;
  studentId?: string;
  program?: string;
  majority?: string; // Explicitly added
  issuedAt?: string;
  qrCodeBase64?: string;
  certId?: string;
  // --- New Dynamic Info ---
  instructorName?: string;
  instructorNip?: string;
}

// Helper: Format Date
const formatDate = (dateString?: string) => {
  if (!dateString) return "DATE NOT SET";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return as-is if invalid
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch (e) {
    return dateString;
  }
};

const CertificateTemplate: React.FC<CertificateProps> = ({
  studentName = "Student Name",
  courseName = "Course Name",
  completionDate,
  certificateId,
  studentId = "Student ID",
  program = "Program",
  majority = "Majority",
  issuedAt,
  qrCodeBase64,
  certId,
  instructorName = "Budi Instructor", // Default placeholder
  instructorNip = "12345678", // Default placeholder
}) => {
  // Normalize props
  const finalId = certId || certificateId || "ID-0000";
  const rawDate = issuedAt || completionDate;
  const finalDate = formatDate(rawDate);

  return (
    // Component is now self-contained A4 size
    <div className="relative w-[1123px] h-[794px] bg-[#0B0F19] text-white overflow-hidden flex flex-col items-center justify-between p-12 shadow-2xl border-[3px] border-cyan-900/50 font-sans mx-auto">
      {/* --- BACKGROUND ELEMENTS --- */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/20 blur-[100px] rounded-full opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 blur-[100px] rounded-full opacity-50 pointer-events-none"></div>

      {/* Decorative Geometric Shapes */}
      <div className="absolute top-0 right-0 opacity-80">
        <svg
          width="150"
          height="150"
          viewBox="0 0 150 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="50" y="0" width="100" height="25" fill="#06b6d4" />
          <rect x="125" y="25" width="25" height="75" fill="#0891b2" />
          <rect x="75" y="50" width="25" height="25" fill="#22d3ee" />
          <rect x="100" y="100" width="25" height="25" fill="#06b6d4" />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 opacity-80 rotate-180">
        <svg
          width="150"
          height="150"
          viewBox="0 0 150 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="50" y="0" width="100" height="25" fill="#06b6d4" />
          <rect x="125" y="25" width="25" height="75" fill="#0891b2" />
          <rect x="75" y="50" width="25" height="25" fill="#22d3ee" />
          <rect x="100" y="100" width="25" height="25" fill="#06b6d4" />
        </svg>
      </div>

      {/* --- HEADER --- */}
      <div className="text-center z-10 flex flex-col items-center">
        <div className="mb-2 flex flex-col items-center justify-center">
          {/* Use Base64 Logo */}
          <img
            src={LOGO_BASE64}
            alt="UNESA Logo"
            className="h-16 w-auto mb-2"
          />
          <p className="text-xs tracking-widest text-slate-300 uppercase font-semibold">
            Universitas Negeri Surabaya
          </p>
        </div>

        <h1 className="text-5xl font-extrabold tracking-[0.15em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-cyan-300 drop-shadow-[0_2px_10px_rgba(6,182,212,0.3)]">
          Certificate of Completion
        </h1>
        <p className="mt-2 text-cyan-600/70 text-xs tracking-[0.3em] uppercase font-mono">
          ID: {finalId}
        </p>
      </div>

      {/* --- CONTENT --- */}
      <div className="text-center z-10 flex flex-col items-center gap-2 flex-grow justify-center mt-2">
        <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 px-6 py-1.5 rounded-full text-cyan-300 font-bold tracking-widest uppercase text-xs shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          Proudly Presented To
        </div>

        <h2 className="text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-400 py-2 px-4 leading-tight drop-shadow-sm">
          {studentName}
        </h2>

        <div className="text-slate-300 text-base uppercase tracking-wider font-medium space-y-0.5">
          <p>
            {majority} - {program}
          </p>
          <p className="text-cyan-400 font-bold">Student ID : {studentId}</p>
        </div>

        <div className="text-slate-400 text-base max-w-2xl leading-relaxed mt-4 font-light">
          Has successfully completed the educational and training program
          requirements on the topic of:
        </div>

        <div className="text-3xl md:text-4xl font-black text-white mt-1 px-6 py-2 relative">
          <span className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-70 blur-sm"></span>
          <span className="drop-shadow-[0_0_10px_rgba(6,182,212,0.6)] tracking-wide uppercase">
            {courseName}
          </span>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div className="w-full flex justify-between items-end mt-4 px-8 z-10 pb-4">
        {/* Dynamic Instructor Signature */}
        <div className="text-center">
          <div className="mb-2 border-b-2 border-slate-500 pb-1 min-w-[200px] relative">
            <span className="font-sans text-2xl text-slate-200 font-bold italic tracking-wider opacity-80">
              {instructorName}
            </span>
          </div>
          <p className="text-white font-bold uppercase tracking-widest text-xs">
            Head Instructor
          </p>
          <p className="text-cyan-400 text-[10px] font-mono mt-0.5">
            NIP: {instructorNip}
          </p>
        </div>

        {/* Date */}
        <div className="text-center pb-2">
          <p className="text-slate-400 uppercase text-[10px] tracking-[0.2em] mb-1 font-semibold">
            Date Issued
          </p>
          <div className="px-4 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-white font-bold text-lg tracking-wider">
              {finalDate}
            </p>
          </div>
        </div>

        {/* QR Code */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-200"></div>
          <div className="relative bg-[#0B0F19] p-2 rounded-xl border border-slate-700/50 flex items-center justify-center">
            {qrCodeBase64 ? (
              <img src={qrCodeBase64} alt="QR Code" className="w-20 h-20" />
            ) : (
              <QrCode className="w-20 h-20 text-white" strokeWidth={1.5} />
            )}
          </div>
          <p className="text-center text-cyan-500 text-[9px] uppercase tracking-widest mt-1 font-semibold">
            Scan to Verify
          </p>
        </div>
      </div>
    </div>
  );
};

export default CertificateTemplate;
