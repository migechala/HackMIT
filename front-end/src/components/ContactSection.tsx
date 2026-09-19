import React, { useState } from 'react';
import { motion, type Variants } from 'motion/react';
import Typewriter from './Typewriter';

export default function ContactSection() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', org: '', message: '' });
  const [touched, setTouched] = useState({ name: false, email: false, phone: false, org: false, message: false });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const validations = {
    name: formData.name.trim().length > 0,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
    phone: /^\+?[\d\s\-()]{7,20}$/.test(formData.phone),
    org: formData.org.trim().length > 0,
    message: formData.message.trim().length > 0,
  };

  // Inline check/x icons — reference loads these as external SVG masks
  // from their asset repo, replaced here so nothing depends on external files.
  const CheckIcon = () => (
    <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="#27BD09" strokeWidth="1.5" />
      <path d="M6 10l2.5 2.5L14 7" stroke="#27BD09" strokeWidth="1.5" fill="none" />
    </svg>
  );
  const XIcon = () => (
    <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="#FF1F1F" strokeWidth="1.5" />
      <path d="M7 7l6 6M13 7l-6 6" stroke="#FF1F1F" strokeWidth="1.5" />
    </svg>
  );

  const renderIcon = (field: keyof typeof formData, required: boolean) => {
    if (!touched[field]) return null;
    const isValid = validations[field];
    const value = formData[field];
    if (isValid && (required || value.trim().length > 0)) return <CheckIcon />;
    if (!isValid && required) return <XIcon />;
    return null;
  };

  const formVariants: Variants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } };

  return (
    <section id="contact" className="w-full bg-white text-black py-24 px-6 md:px-12 lg:px-[120px] flex flex-col items-center justify-center">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
        className="w-full max-w-3xl mx-auto flex flex-col items-center"
      >
        <div className="text-center mb-16 w-full">
          <h2 className="text-[clamp(1.5rem,4vw,3.5rem)] font-medium tracking-tight mb-6 leading-[1.1]">
            <span className="text-black font-serif font-normal italic"><Typewriter text="Let's talk." delay={0} speed={0.012} /></span>{' '}
            <Typewriter text="Fill in the form" delay={0.2} speed={0.012} /><br />
            <Typewriter text="and we'll be in touch" delay={0.4} speed={0.012} />
          </h2>
          <p className="text-lg md:text-xl text-gray-800">
            <Typewriter text="Ask us about listing a parcel or claiming space" delay={0.6} speed={0.012} />
          </p>
        </div>

        <form className="max-w-2xl w-full mx-auto flex flex-col gap-8" onSubmit={(e) => e.preventDefault()}>
          <motion.div variants={formVariants} className="flex flex-col gap-2 border-b border-[#D9D9D9] pb-2 transition-colors duration-300 hover:border-black focus-within:border-black">
            <label className="text-sm font-medium">Your Name*</label>
            <div className="relative w-full">
              <input type="text" name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur}
                placeholder="Who's reaching out?" className="w-full bg-transparent outline-none placeholder:text-[#D9D9D9] text-base pr-8" required />
              {renderIcon('name', true)}
            </div>
          </motion.div>

          <motion.div variants={formVariants} className="flex flex-col gap-2 border-b border-[#D9D9D9] pb-2 transition-colors duration-300 hover:border-black focus-within:border-black">
            <label className="text-sm font-medium">Email*</label>
            <div className="relative w-full">
              <input type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur}
                placeholder="Where can we reach you?" className="w-full bg-transparent outline-none placeholder:text-[#D9D9D9] text-base pr-8" required />
              {renderIcon('email', true)}
            </div>
          </motion.div>

          <motion.div variants={formVariants} className="flex flex-col gap-2 border-b border-[#D9D9D9] pb-2 transition-colors duration-300 hover:border-black focus-within:border-black">
            <label className="text-sm font-medium">Phone Number*</label>
            <div className="relative w-full">
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur}
                placeholder="Best number to call you on?" className="w-full bg-transparent outline-none placeholder:text-[#D9D9D9] text-base pr-8" required />
              {renderIcon('phone', true)}
            </div>
          </motion.div>

          <motion.div variants={formVariants} className="flex flex-col gap-2 border-b border-[#D9D9D9] pb-2 transition-colors duration-300 hover:border-black focus-within:border-black">
            <label className="text-sm font-medium">City / Organization</label>
            <div className="relative w-full">
              <input type="text" name="org" value={formData.org} onChange={handleChange} onBlur={handleBlur}
                placeholder="Your city department or org?" className="w-full bg-transparent outline-none placeholder:text-[#D9D9D9] text-base pr-8" />
              {renderIcon('org', false)}
            </div>
          </motion.div>

          <motion.div variants={formVariants} className="flex flex-col gap-2 border-b border-[#D9D9D9] pb-2 transition-colors duration-300 hover:border-black focus-within:border-black">
            <label className="text-sm font-medium">Tell Us More</label>
            <div className="relative w-full">
              <input type="text" name="message" value={formData.message} onChange={handleChange} onBlur={handleBlur}
                placeholder="Which parcel, or what you're looking for?" className="w-full bg-transparent outline-none placeholder:text-[#D9D9D9] text-base pr-8" />
              {renderIcon('message', false)}
            </div>
          </motion.div>

          <motion.div variants={formVariants} className="mt-8 flex justify-center">
            <button type="submit" className="bg-black text-white px-6 py-2.5 rounded-full hover:bg-[#27BD09] transition-colors duration-300 text-sm tracking-wide">
              Send Message
            </button>
          </motion.div>
        </form>
      </motion.div>
    </section>
  );
}
