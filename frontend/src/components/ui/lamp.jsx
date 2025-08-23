import React from "react";
import { motion } from "framer-motion";

export const LampContainer = ({ children, isDarkMode = true }) => {
  return (
    <div
      className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden w-full z-0 transition-colors duration-500 ${
        isDarkMode ? "bg-black" : "bg-white"
      }`}
    >
      <div className="relative flex w-full flex-1 scale-y-125 items-center justify-center isolate z-0">
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className={`absolute inset-auto right-1/2 h-56 overflow-visible w-[30rem] bg-gradient-conic ${
            isDarkMode 
              ? "from-[#74AA9C] via-transparent to-transparent" 
              : "from-[#74AA9C] via-[#74AA9C]/20 to-transparent"
          } text-white [--conic-position:from_70deg_at_center_top]`}
        >
          <div
            className={`absolute w-[100%] left-0 h-56 ${
              isDarkMode ? "bg-black" : "bg-white"
            } [mask-image:linear-gradient(to_right,white,transparent)]`}
          />
          <div
            className={`absolute w-40 h-[100%] left-0 ${
              isDarkMode ? "bg-black" : "bg-white"
            } [mask-image:linear-gradient(to_right,white,transparent)]`}
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className={`absolute inset-auto left-1/2 h-56 w-[30rem] bg-gradient-conic ${
            isDarkMode 
              ? "from-transparent via-transparent to-[#74AA9C]" 
              : "from-transparent via-[#74AA9C]/20 to-[#74AA9C]"
          } text-white [--conic-position:from_290deg_at_center_top]`}
        >
          <div
            className={`absolute w-40 h-[100%] right-0 ${
              isDarkMode ? "bg-black" : "bg-white"
            } [mask-image:linear-gradient(to_left,white,transparent)]`}
          />
          <div
            className={`absolute w-[100%] right-0 h-56 ${
              isDarkMode ? "bg-black" : "bg-white"
            } [mask-image:linear-gradient(to_left,white,transparent)]`}
          />
        </motion.div>
        
        <div
          className={`absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 ${
            isDarkMode ? "bg-black" : "bg-white"
          } blur-2xl`}
        />
        
        <div
          className={`absolute top-1/2 z-50 h-48 w-full ${
            isDarkMode 
              ? "bg-transparent opacity-10 backdrop-blur-md" 
              : "bg-transparent opacity-10 backdrop-blur-md"
          }`}
        />
        
        <div
          className={`absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full ${
            isDarkMode 
              ? "bg-[#74AA9C] opacity-50 blur-3xl" 
              : "bg-[#74AA9C] opacity-30 blur-3xl"
          }`}
        />
        
        <motion.div
          initial={{ width: "8rem" }}
          whileInView={{ width: "16rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className={`absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] rounded-full ${
            isDarkMode ? "bg-[#74AA9C] blur-2xl" : "bg-[#74AA9C] blur-2xl opacity-70"
          }`}
        />
        
        <motion.div
          initial={{ width: "15rem" }}
          whileInView={{ width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className={`absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[7rem] ${
            isDarkMode ? "bg-[#74AA9C]" : "bg-[#74AA9C]"
          }`}
        />

        <div
          className={`absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem] ${
            isDarkMode ? "bg-black" : "bg-white"
          }`}
        />
      </div>

      <div className="relative z-50 flex -translate-y-80 flex-col items-center px-5">
        {children}
      </div>
    </div>
  );
};