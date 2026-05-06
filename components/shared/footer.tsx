import Link from 'next/link'

import { Facebook, Github, Instagram, Twitter } from 'lucide-react'

import { FooterBottom } from './FooterBottom'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="text-2xl font-bold text-white">
              JnUIT&apos;s<span className="text-blue-500">.</span>
            </Link>
            <p className="mt-4 text-sm leading-6">
              Fostering technology and innovation at Jagannath University
            </p>
            <div className="mt-6 flex space-x-5">
              <Link
                target="_blank"
                href="https://www.facebook.com/jnuits"
                className="transition-colors hover:text-white"
              >
                <Facebook size={20} />
              </Link>
              <Link href="#" className="transition-colors hover:text-white">
                <Instagram size={20} />
              </Link>
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  prefetch={false}
                  href="/about"
                  className="hover:text-white"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  href="/committee/current"
                  className="hover:text-white"
                >
                  Committee
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Developers
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-white">
                  Certificates
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  href="/events"
                  className="hover:text-white"
                >
                  Events
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  href="/blogs"
                  className="hover:text-white"
                >
                  Blogs
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>Jagannath University IT Society(JnUITS)</li>
              <li>9, 10 Chittaranjan Ave, Dhaka 1100</li>
              <li>Email: info@jnuits.org.bd</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t border-gray-800 pt-5 text-center">
          <FooterBottom />
        </div>
      </div>
    </footer>
  )
}

export default Footer
