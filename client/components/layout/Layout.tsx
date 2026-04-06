import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  /** When true the header uses absolute→fixed positioning so it overlays the hero */
  headerOverlay?: boolean;
}

export default function Layout({ children, headerOverlay = false }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-brand-dark">
      <Header overlay={headerOverlay} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
