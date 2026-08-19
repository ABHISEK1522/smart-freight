import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Smart Freight Control Tower | Dispatch & Operations Center",
  description: "Enterprise freight operations, cold-chain consolidation, and risk dispatch platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased text-slate-900 bg-slate-100">
      <body className="min-h-full flex flex-col font-sans bg-slate-100 text-slate-900 selection:bg-blue-600 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
