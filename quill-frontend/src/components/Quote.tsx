'use client'
const Quote = () => {
  return (
    <div className="h-screen flex justify-center items-center bg-[#E3D0D8] dark:bg-[#2e1b24] flex-col text-left">
      <div className="flex flex-col max-w-md">
        <span className="text-3xl text-foreground">We write to taste life twice, in the moment and in retrospect.</span>
      <span className="text-md mt-3 mb-1 text-foreground">
        -- Anaïs Nin
      </span>
      <span className="text-xs text-muted-foreground">Writer and philosopher</span>
      </div>
      
    </div>
  )
}

export default Quote