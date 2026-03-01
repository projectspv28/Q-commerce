'use client'
import React from 'react'
import { motion } from "motion/react"
import Link from 'next/link'
import { Facebook, Instagram, Mail, MapPin, Phone, TwitterIcon } from 'lucide-react'

function Footer() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-linear-to-r from-amber-500 via-amber-600 to-red-600 text-white mt-20"
    >
      <div className='w-[90%] md:w-[80%] mx-auto py-10 grid grid-cols-1 md:grid-cols-3 gap-10 border-b border-amber-200/40'>
        <div>
          <h2 className='text-2xl font-bold mb-3'>WHISTLE</h2>
          <p className='text-sm text-amber-50 leading-relaxed'>
            Your quick-commerce partner bringing essentials to your door with our bold yellow and red energy.
          </p>
        </div>
        <div>
          <h2 className='text-xl font-semibold mb-3'>Quick Links</h2>
          <ul className='space-y-2 text-amber-50 text-sm'>
            <li><Link href={"/"} className='hover:text-white transition'>Home</Link></li>
            <li><Link href={"/cart"} className='hover:text-white transition'>Cart</Link></li>
            <li><Link href={"/my-orders"} className='hover:text-white transition'>My Orders</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-3">Contact Us</h3>
          <ul className="space-y-2 text-amber-50 text-sm">
            <li className="flex items-center gap-2">
              <MapPin size={16} /> Mumbai, India
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} /> +91 0000000000
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} /> support@whistle.com
            </li>
          </ul>
          {/* Social Links */}
          <div className="flex gap-4 mt-4">
            <Link href="https://facebook.com" target="_blank">
              <Facebook className="w-5 h-5 hover:text-white transition" />
            </Link>
            <Link href="https://instagram.com" target="_blank">
              <Instagram className="w-5 h-5 hover:text-white transition" />
            </Link>
            <Link href="https://twitter.com" target="_blank">
              <TwitterIcon className="w-5 h-5 hover:text-white transition" />
            </Link>
          </div>
        </div>
      </div>

      <div className="text-center py-4 text-sm text-amber-50 bg-red-900/30">
        (c) {new Date().getFullYear()} <span className="font-semibold">WHISTLE</span>. All rights reserved.
      </div>
    </motion.div>
  )
}

export default Footer
