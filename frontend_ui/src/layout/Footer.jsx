import React from 'react';
import { Link } from 'react-router-dom'; // Assuming react-router-dom Link for internal navigation

const Footer = () => {
  return (
    <footer className="bg-light text-center py-3 mt-auto">
      <p className="text-muted mb-0">
        {'Copyright © '}
        <Link to="#" className="text-decoration-none text-primary">Your Website</Link>{' '}
        {new Date().getFullYear()}
        {'.'}
      </p>
    </footer>
  );
};

export default Footer;