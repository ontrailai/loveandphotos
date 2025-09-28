/**
 * SignatureBox Component
 * Canvas-based signature capture with accessibility features
 * Uses signature_pad library with keyboard fallback for WCAG AA compliance
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import SignaturePad from 'signature_pad'
import { clsx } from 'clsx'
import { PenTool, RotateCcw, Trash2, Type, Check } from 'lucide-react'
import Button from '@components/ui/Button'

const SignatureBox = ({
  onSignatureChange,
  value = null,
  disabled = false,
  className = '',
  signerName = '',
  onSignerNameChange = () => {},
  ...props
}) => {
  const canvasRef = useRef(null)
  const signaturePadRef = useRef(null)
  const [isTypedMode, setIsTypedMode] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)

  // Handle signature change
  const handleSignatureChange = useCallback(() => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const dataURL = signaturePadRef.current.toDataURL('image/png')
      setHasSignature(true)
      onSignatureChange(dataURL)
    } else {
      setHasSignature(false)
      onSignatureChange(null)
    }
  }, [onSignatureChange])

  // Clear signature
  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear()
      setHasSignature(false)
      setIsTypedMode(false)
      onSignatureChange(null)
    }
  }

  // Undo last stroke
  const handleUndo = () => {
    if (signaturePadRef.current) {
      const data = signaturePadRef.current.toData()
      if (data.length > 0) {
        data.pop() // Remove last stroke
        signaturePadRef.current.fromData(data)
        handleSignatureChange()
      }
    }
  }

  // Generate typed signature
  const generateTypedSignature = () => {
    if (!signerName.trim()) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Clear canvas
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw typed signature
    ctx.fillStyle = 'black'
    ctx.font = '32px cursive'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(signerName.trim(), canvas.width / 2, canvas.height / 2)

    // Convert to data URL and notify
    const dataURL = canvas.toDataURL('image/png')
    setHasSignature(true)
    setIsTypedMode(true)
    onSignatureChange(dataURL)
  }

  // Initialize signature pad with proper canvas sizing
  useEffect(() => {
    const initializeSignaturePad = () => {
      if (!canvasRef.current) return

      const canvas = canvasRef.current
      const rect = canvas.getBoundingClientRect()

      // Save existing signature data if SignaturePad exists
      let savedData = null
      if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
        savedData = signaturePadRef.current.toData()
      }

      // Clean up existing SignaturePad
      if (signaturePadRef.current) {
        signaturePadRef.current.off()
        signaturePadRef.current = null
      }

      // Set canvas dimensions BEFORE initializing SignaturePad
      const devicePixelRatio = window.devicePixelRatio || 1
      canvas.width = rect.width * devicePixelRatio
      canvas.height = rect.height * devicePixelRatio

      // Scale the drawing context
      const ctx = canvas.getContext('2d')
      ctx.scale(devicePixelRatio, devicePixelRatio)

      // Initialize SignaturePad with properly-sized canvas
      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
        velocityFilterWeight: 0.7,
        minWidth: 1,
        maxWidth: 2.5,
        throttle: 16,
        minDistance: 5
      })

      // Set up event handlers
      signaturePadRef.current.addEventListener('beginStroke', () => {
        setIsDrawing(true)
      })

      signaturePadRef.current.addEventListener('endStroke', () => {
        setIsDrawing(false)
        handleSignatureChange()
      })

      // Restore signature data if it existed
      if (savedData && savedData.length > 0) {
        signaturePadRef.current.fromData(savedData)
        setHasSignature(true)
      }
    }

    // Initialize on mount
    initializeSignaturePad()

    // Handle window resizes
    const handleResize = () => {
      initializeSignaturePad()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (signaturePadRef.current) {
        signaturePadRef.current.off()
      }
    }
  }, [handleSignatureChange])

  return (
    <div
      id="signature"
      className={clsx(
        'w-full max-w-2xl mx-auto bg-white rounded-lg border-2 border-gray-200 p-6',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      role="region"
      aria-label="Digital signature capture"
      {...props}
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Your Digital Signature
        </h3>
        <p className="text-sm text-gray-600">
          Sign below using your mouse, touchscreen, or type your name for keyboard accessibility.
        </p>
      </div>

      {/* Typed name input for accessibility */}
      <div className="mb-4">
        <label htmlFor="signer-name" className="block text-sm font-medium text-gray-700 mb-2">
          Full Name (Optional - for typed signature)
        </label>
        <div className="flex gap-2">
          <input
            id="signer-name"
            type="text"
            value={signerName}
            onChange={(e) => onSignerNameChange(e.target.value)}
            placeholder="Enter your full name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={disabled}
            autoComplete="name"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateTypedSignature}
            disabled={!signerName.trim() || disabled}
            aria-label="Generate typed signature"
          >
            <Type className="w-4 h-4 mr-1" />
            Type
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Keyboard users: Enter your name above and click "Type" to create an accessible signature.
        </p>
      </div>

      {/* Canvas container */}
      <div className="mb-4">
        <div
          className={clsx(
            'relative w-full h-40 border-2 border-dashed border-gray-300 rounded-lg bg-white overflow-hidden',
            hasSignature && 'border-primary-500 border-solid',
            isDrawing && 'border-primary-600'
          )}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            style={{ width: '100%', height: '100%' }}
            aria-label="Signature drawing area"
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                // Focus the name input for keyboard users
                document.getElementById('signer-name')?.focus()
              }
            }}
          />

          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-400">
                <PenTool className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Sign here or use the typed signature option above</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Signature controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={!hasSignature || disabled}
            aria-label="Clear signature"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={!hasSignature || isTypedMode || disabled}
            aria-label="Undo last stroke"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Undo
          </Button>
        </div>

        {hasSignature && (
          <div className="flex items-center text-green-600">
            <Check className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">
              {isTypedMode ? 'Typed signature ready' : 'Signature captured'}
            </span>
          </div>
        )}
      </div>

      {/* Accessibility instructions */}
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 mb-1">Accessibility Information</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Mouse/Touch users: Draw directly on the canvas above</li>
          <li>• Keyboard users: Enter your name and click "Type" for an accessible signature</li>
          <li>• Screen reader users: The signature area is labeled and all controls are keyboard accessible</li>
        </ul>
      </div>
    </div>
  )
}

export default SignatureBox