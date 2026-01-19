import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HireHub - AI-Powered Recruitment Platform',
  description: 'Find your perfect job match with AI-powered recommendations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
