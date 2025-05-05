"use client";

import { useState, useEffect } from "react";

export default function Title() {
  const rotatingWords = [
    "Reasoning",
    "Agentic",
    "Instruct",
  ];
  const rotatingColors = ["#ef5350", "#4fc3f7", "#b39ddb"];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % rotatingWords.length);
      }, 500);
    }, 2000);
    return () => clearInterval(intervalId);
  }, [rotatingWords.length]);

  return (
    <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-7xl/none overflow-hidden">
      Generate Synthetic Data for{" "}
      <span
        style={{ color: rotatingColors[currentIndex] }}
        className="inline-block py-1 rounded-md transition-colors duration-500 ease-in-out align-middle w-90"
      >
        {rotatingWords[currentIndex]}
      </span>{" "}
      Models on Sui
    </h1>
  );
}
