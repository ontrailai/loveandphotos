/**
 * Style Questionnaire Component
 * Multi-section questionnaire for capturing photography style preferences
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@contexts/AuthContext'
import { supabase } from '@lib/supabase'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'
import toast from 'react-hot-toast'
import { CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

const StyleQuestionnaire = ({ onClose, onComplete }) => {
  const { user } = useAuth()
  const [currentSection, setCurrentSection] = useState(0)
  const [loading, setLoading] = useState(false)
  const [existingResponse, setExistingResponse] = useState(null)

  const [formData, setFormData] = useState({
    // Photography Preferences
    preferred_style: '',
    editing_style: '',
    photo_focus: '',

    // Mood & Atmosphere
    desired_feel: '',
    wedding_vibe: '',

    // Key Moments
    must_capture_moments: '',
    couple_vs_guests_focus: '',

    // Comfort & Guidance
    direction_level: '',
    camera_comfort_level: '',

    // Inspiration & Must-Haves
    specific_shots: '',
    inspiration_links: '',

    // Delivery & Editing
    bw_preference: '',
    candid_vs_polished: ''
  })

  const sections = [
    {
      title: 'Photography Preferences',
      questions: [
        {
          id: 'preferred_style',
          label: 'Do you prefer candid moments, posed shots, or a mix of both?',
          type: 'radio',
          options: [
            { value: 'candid', label: 'Candid moments' },
            { value: 'posed', label: 'Posed shots' },
            { value: 'both', label: 'Mix of both' }
          ]
        },
        {
          id: 'editing_style',
          label: 'What editing style resonates with you?',
          type: 'radio',
          options: [
            { value: 'natural', label: 'Natural and true-to-life' },
            { value: 'vibrant', label: 'Vibrant and colorful' },
            { value: 'moody', label: 'Moody and dramatic' },
            { value: 'no_preference', label: 'No preference' }
          ]
        },
        {
          id: 'photo_focus',
          label: 'Should we focus more on family and friends or creative, artistic shots?',
          type: 'radio',
          options: [
            { value: 'family_friends', label: 'Family and friends' },
            { value: 'creative_artistic', label: 'Creative and artistic' },
            { value: 'balanced', label: 'Balanced mix' }
          ]
        }
      ]
    },
    {
      title: 'Mood & Atmosphere',
      questions: [
        {
          id: 'desired_feel',
          label: 'What kind of "feel" are you hoping your photos convey?',
          type: 'textarea',
          placeholder: 'E.g., romantic, fun, elegant, intimate...'
        },
        {
          id: 'wedding_vibe',
          label: 'Describe the vibe of your wedding',
          type: 'textarea',
          placeholder: 'E.g., formal, casual, beachside, garden party...'
        }
      ]
    },
    {
      title: 'Key Moments',
      questions: [
        {
          id: 'must_capture_moments',
          label: 'Are there specific moments or traditions we absolutely must capture?',
          type: 'textarea',
          placeholder: 'E.g., first dance, cake cutting, special performances...'
        },
        {
          id: 'couple_vs_guests_focus',
          label: 'Do you want more focus on the couple or equal attention on guests?',
          type: 'radio',
          options: [
            { value: 'couple', label: 'More focus on couple' },
            { value: 'guests', label: 'More focus on guests' },
            { value: 'equal', label: 'Equal attention' }
          ]
        }
      ]
    },
    {
      title: 'Comfort & Guidance',
      questions: [
        {
          id: 'direction_level',
          label: 'How much direction do you want from the photographer?',
          type: 'radio',
          options: [
            { value: 'minimal', label: 'Minimal - let us be natural' },
            { value: 'moderate', label: 'Moderate - some guidance' },
            { value: 'heavy', label: 'Heavy - lots of posing help' }
          ]
        },
        {
          id: 'camera_comfort_level',
          label: 'How comfortable are you in front of the camera?',
          type: 'radio',
          options: [
            { value: 'very_comfortable', label: 'Very comfortable' },
            { value: 'comfortable', label: 'Comfortable' },
            { value: 'nervous', label: 'A bit nervous' },
            { value: 'very_nervous', label: 'Very nervous' }
          ]
        }
      ]
    },
    {
      title: 'Inspiration & Must-Haves',
      questions: [
        {
          id: 'specific_shots',
          label: 'Are there specific photos or angles you\'d love to recreate?',
          type: 'textarea',
          placeholder: 'Describe any specific shots you have in mind...'
        },
        {
          id: 'inspiration_links',
          label: 'Pinterest board or inspiration links (optional)',
          type: 'textarea',
          placeholder: 'Paste any Pinterest or inspiration links here...'
        }
      ]
    },
    {
      title: 'Delivery & Editing',
      questions: [
        {
          id: 'bw_preference',
          label: 'Do you want some black-and-white photos included?',
          type: 'radio',
          options: [
            { value: 'yes_please', label: 'Yes, please!' },
            { value: 'some_ok', label: 'A few are fine' },
            { value: 'color_only', label: 'Color only, please' }
          ]
        },
        {
          id: 'candid_vs_polished',
          label: 'Do you prefer raw/candid energy or polished perfection?',
          type: 'radio',
          options: [
            { value: 'candid', label: 'Raw and candid' },
            { value: 'polished', label: 'Polished perfection' },
            { value: 'balanced', label: 'Balanced mix' }
          ]
        }
      ]
    }
  ]

  useEffect(() => {
    loadExistingResponse()
  }, [user?.id])

  const loadExistingResponse = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_style_preferences')
        .select('*')
        .eq('customer_id', user.id)
        .single()

      if (!error && data) {
        setExistingResponse(data)
        setFormData(data)
      }
    } catch (error) {
      // No existing response - that\'s fine
    }
  }

  const handleInputChange = (questionId, value) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const isCurrentSectionComplete = () => {
    const currentQuestions = sections[currentSection].questions
    return currentQuestions.every(q => {
      const value = formData[q.id]
      return value && value.trim() !== ''
    })
  }

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      const preferences = {
        customer_id: user.id,
        ...formData,
        completed_at: new Date().toISOString()
      }

      if (existingResponse) {
        // Update existing
        const { error } = await supabase
          .from('customer_style_preferences')
          .update(preferences)
          .eq('id', existingResponse.id)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('customer_style_preferences')
          .insert([preferences])

        if (error) throw error
      }

      toast.success('Style preferences saved successfully!')
      if (onComplete) onComplete()
      if (onClose) onClose()
    } catch (error) {
      console.error('Error saving questionnaire:', error)
      toast.error('Failed to save questionnaire')
    } finally {
      setLoading(false)
    }
  }

  const currentSectionData = sections[currentSection]
  const progress = ((currentSection + 1) / sections.length) * 100

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Style & Preferences
            </h2>
            <p className="text-muted-foreground text-sm">
              Set your photography preferences once for all future bookings
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Section {currentSection + 1} of {sections.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Section Title */}
          <h3 className="text-xl font-semibold text-foreground mb-4">
            {currentSectionData.title}
          </h3>

          {/* Questions */}
          <div className="space-y-6 mb-6">
            {currentSectionData.questions.map((question) => (
              <div key={question.id}>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {question.label}
                </label>

                {question.type === 'radio' && (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name={question.id}
                          value={option.value}
                          checked={formData[question.id] === option.value}
                          onChange={(e) => handleInputChange(question.id, e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-foreground">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'textarea' && (
                  <textarea
                    value={formData[question.id]}
                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                    placeholder={question.placeholder}
                    rows={4}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background text-foreground"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-border">
            <div>
              {currentSection > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                >
                  <ChevronLeftIcon className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex space-x-2">
              <Button
                variant="ghost"
                onClick={onClose}
              >
                Cancel
              </Button>

              {currentSection < sections.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!isCurrentSectionComplete()}
                >
                  Next
                  <ChevronRightIcon className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !isCurrentSectionComplete()}
                >
                  {loading ? (
                    'Saving...'
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Submit
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default StyleQuestionnaire