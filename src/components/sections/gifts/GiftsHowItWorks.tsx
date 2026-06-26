import { HOW_IT_WORKS } from './constants'

export function GiftsHowItWorks() {
  return (
    <section className='border-b border-gray-100 bg-white'>
      <div className='max-w-7xl mx-auto px-6 py-10'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className='flex items-start gap-4'>
              <div className='shrink-0 w-10 h-10 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-xl'>
                {step.icon}
              </div>
              <div>
                <div className='flex items-center gap-2 mb-1'>
                  <span className='w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-[10px] font-black flex items-center justify-center'>{i + 1}</span>
                  <p className='text-[14px] font-bold text-gray-900'>{step.title}</p>
                </div>
                <p className='text-[13px] text-gray-500 leading-snug'>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
