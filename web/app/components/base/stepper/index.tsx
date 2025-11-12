import React, {useState, useEffect} from 'react'

interface StepperProps{
    totalSteps: Record<string,any>[],
    currentStep: number
}

const Stepper:React.FC<StepperProps> = ({
    totalSteps,
    currentStep
})=>{
    // const [isActive, setIsActive] = useState(false)
    return (

        <div className="flex w-full items-center justify-between relative">
      
        {totalSteps.map((step, index) => {
            const isActive = index===(currentStep-1) || (currentStep-1)>index
            return (
          <div key={index} className="flex flex-col items-center w-full">
            <div className='relative flex w-full items-center justify-center'>
                <div className={` w-100 ${index===totalSteps.length-1?"right-1/2":"left-1/2"} ${index<(currentStep-1) || currentStep === (totalSteps.length) ? "bg-primary-500" : "bg-gray-300"} absolute top-1/2 transform -z-10 w-full h-1`}>
                </div>
    
                {/* Step Circle */}
                <div className={`z-10 flex items-center justify-center w-8 h-8 rounded-full system-sm-semibold
                    transition-all duration-300 ease-in-out
                    ${isActive ? 'bg-primary-500 text-white' : 'text-text-tertiary bg-white border border-primary-500'}
                `}>
                {index + 1}
                </div>
            </div>
            
  
            {/* Step Name */}
            <p className={`mt-2 system-2xs-semibold-uppercase text-center
                ${isActive ? 'text-primary-500' : 'text-text-tertiary'}
              `}>
              {step.name}
            </p>
  
          </div>
        
        )}
        
        )}
  
      </div>
        
    )
}

export default React.memo(Stepper)