/**
 * BackgroundPaths Component (CTA Section)
 * Polished implementation: Full-bleed video with rounded corners and depth
 * Uses native video with HLS for perfect styling control and no black bars
 */

import React from 'react';
import { motion } from 'motion/react';
import Button from './Button';
import BackgroundVideo from './BackgroundVideo';

export default function BackgroundPaths({
    title = "Forever Starts Here",
}) {
    const words = title.split(" ");

    return (
        <section className="relative isolate min-h-[520px] pb-16">
            {/* Full-bleed Background Video with rounded corners and depth */}
            <BackgroundVideo />

            {/* Content Container - Centered over video with proper z-index */}
            <div className="relative z-20 flex items-center justify-center min-h-[520px]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 2 }}
                        className="max-w-4xl mx-auto"
                    >
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 tracking-tight leading-tight max-w-3xl mx-auto
                                      drop-shadow-lg text-shadow-lg">
                            {words.map((word, wordIndex) => (
                                <span
                                    key={wordIndex}
                                    className="inline-block mr-3 last:mr-0"
                                >
                                    {word.split("").map((letter, letterIndex) => (
                                        <motion.span
                                            key={`${wordIndex}-${letterIndex}`}
                                            initial={{ y: 100, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{
                                                delay:
                                                    wordIndex * 0.1 +
                                                    letterIndex * 0.03,
                                                type: "spring",
                                                stiffness: 150,
                                                damping: 25,
                                            }}
                                            className="inline-block text-white"
                                            style={{
                                                textShadow: '0 2px 8px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.8)'
                                            }}
                                        >
                                            {letter}
                                        </motion.span>
                                    ))}
                                </span>
                            ))}
                        </h1>

                        <div
                            className="inline-block group relative bg-gradient-to-b from-white/15 to-white/8
                            p-px rounded-xl backdrop-blur-lg
                            overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
                        >
                            <Button
                                variant="ghost"
                                className="rounded-[0.65rem] px-6 py-3 text-base font-medium backdrop-blur-md
                                bg-white/80 hover:bg-white/90
                                text-black transition-all duration-300
                                group-hover:-translate-y-0.5 border border-white/15
                                hover:shadow-sm min-h-[44px] min-w-[44px]"
                                onClick={() => window.location.href = '/photographers'}
                            >
                                <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                                    Reserve Date
                                </span>
                                <span
                                    className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5
                                    transition-all duration-300"
                                >
                                    →
                                </span>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}