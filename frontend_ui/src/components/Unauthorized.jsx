// frontend/src/components/Unauthorized.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-purple-100 via-gray-100 to-yellow-100 p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-white p-10 rounded-xl shadow-2xl text-center relative overflow-hidden"
      >
        <motion.h2
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-5xl font-extrabold text-red-600 mb-4"
        >
          403
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-lg text-gray-700 mb-6"
        >
          Oops! You don’t have permission to access this page.
        </motion.p>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            to="/login"
            className="py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
          >
            Go to Login
          </Link>
        </motion.div>

        {/* Optional floating animation circles */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-[-20px] left-[-20px] w-20 h-20 bg-purple-300 rounded-full opacity-40"
        />
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute bottom-[-20px] right-[-20px] w-24 h-24 bg-gray-300 rounded-full opacity-30"
        />
      </motion.div>
    </div>
  );
};

export default Unauthorized;
