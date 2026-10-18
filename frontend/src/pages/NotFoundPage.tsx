import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Button from "../components/ui/Button";

export default function NotFoundPage() {
  return <div className="mx-auto max-w-lg py-24 text-center"><p className="text-sm font-semibold text-indigo-700">404</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Page not found</h1><p className="mt-3 text-sm text-slate-500">The page may have moved or the URL is incorrect.</p><Link to="/dashboard"><Button className="mt-6"><ArrowLeft size={16} /> Back to dashboard</Button></Link></div>;
}
