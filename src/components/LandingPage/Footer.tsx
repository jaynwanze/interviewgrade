import Link from 'next/link';
import { Crown } from 'lucide-react';

const footerLinks = {
  Product: [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'FAQ', href: '#faq' },
  ],
  Company: [
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Careers', href: '/careers' },
  ],
  Legal: [
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
  ],
  Support: [
    { name: 'Help Center', href: '/help' },
    { name: 'Contact', href: '/contact' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
                <Crown className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">InterviewGrade</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              AI-powered interview preparation to help you land your dream job.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold mb-3">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} InterviewGrade. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground"
            >
              Twitter
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground"
            >
              LinkedIn
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground"
            >
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
