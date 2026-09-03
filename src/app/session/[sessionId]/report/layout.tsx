import './report-progressive-polish.css';

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-report-polish className="contents">
      {children}
    </div>
  );
}
