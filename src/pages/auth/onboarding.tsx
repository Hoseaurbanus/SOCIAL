import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/utils'

const steps = [
  { title: 'Choose your interests', description: 'Select topics you care about' },
  { title: 'Follow people', description: 'Find friends and creators' },
  { title: 'Set up your profile', description: 'Add a photo and bio' },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg-secondary flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">{steps[currentStep].title}</h1>
          <p className="text-text-secondary mt-2">{steps[currentStep].description}</p>
        </div>
        <div className="flex gap-2 justify-center">
          {steps.map((_, i) => (
            <div key={i} className={cn('h-2 w-8 rounded-full transition-colors', i === currentStep ? 'bg-accent' : 'bg-bg-tertiary')} />
          ))}
        </div>
        <div className="space-y-3">
          <Button fullWidth onClick={() => {
            if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1)
            else navigate('/home')
          }}>
            {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
          </Button>
          {currentStep < steps.length - 1 && (
            <Button variant="ghost" fullWidth onClick={() => navigate('/home')}>Skip</Button>
          )}
        </div>
      </div>
    </div>
  )
}
