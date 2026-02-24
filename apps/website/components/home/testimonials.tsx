const Testimonials = () => {
  return (
    <section id='testimonials' className='py-20 bg-gray-50 dark:bg-zinc-900'>
      <div className='container mx-auto px-4 md:px-8'>
        <div className='text-center max-w-3xl mx-auto mb-16'>
          <h2 className='text-3xl md:text-4xl font-bold mb-4'>
            Trusted by Leading Medical Professionals
          </h2>
          <p className='text-lg text-gray-600 dark:text-gray-300'>
            Hear what doctors and rehabilitation specialists have to say about
            our VR solution.
          </p>
        </div>

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
          * Testimonial 1 * * Testimonial 2 * * Testimonial 3 *
        </div>
      </div>
    </section>
  )
}

export default Testimonials
