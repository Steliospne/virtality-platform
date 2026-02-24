import { BookingForm } from '@/components/demo/booking-form'

const DemoPage = () => {
  return (
    <section className='min-h-screen-with-nav flex flex-col bg-gray-50 py-12 px-4'>
      <div className='text-center mb-8 m-auto lg:w-[750px] h-full'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          Book an Appointment
        </h1>
        <BookingForm />
      </div>
    </section>
  )
}

export default DemoPage
