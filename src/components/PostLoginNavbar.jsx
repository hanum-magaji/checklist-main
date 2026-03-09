// src/components/PostLoginNavbar.jsx
import { Link } from "react-router-dom";

export default function PostLoginNavbar() {
  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Projects", path: "/projects" },
  ];

  return (
    <nav className="bg-gray-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex space-x-8">
            <div className="flex-shrink-0 font-bold text-xl text-white">
              AIStartup
            </div>
            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="text-white hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
