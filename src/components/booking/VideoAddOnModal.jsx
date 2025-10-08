/**
 * VideoAddOnModal Component
 * Modal prompt after package selection asking if client wants to add videographer
 * Used in booking flow after client selects photography package
 */

import { Dialog } from '@headlessui/react'
import { VideoIcon, XIcon } from 'lucide-react'
import { motion } from 'motion/react'
import Button from '@components/ui/Button'

export default function VideoAddOnModal({ isOpen, onClose, onAddVideo, onSkip }) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      {/* Full-screen container to center the modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          as={motion.div}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="mx-auto max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <XIcon className="w-5 h-5" />
          </button>

          {/* Icon Header */}
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 px-6 py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <VideoIcon className="w-8 h-8 text-white" />
            </div>
            <Dialog.Title className="text-2xl font-bold text-white mb-2">
              Add Professional Videography?
            </Dialog.Title>
            <p className="text-white/90 text-sm">
              Capture your special moments on video with a professional videographer
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Why add videography?
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Capture moments in motion that photos can't</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Professional equipment (drones, gimbals, audio)</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Edited highlight reel of your event</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Relive the emotions and atmosphere</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                onClick={onAddVideo}
                className="w-full"
              >
                <VideoIcon className="w-5 h-5 mr-2" />
                Yes, Add Videographer
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={onSkip}
                className="w-full text-gray-600 hover:text-gray-900"
              >
                No Thanks, Continue
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500 mt-4">
              You can always add a videographer later from your booking
            </p>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
