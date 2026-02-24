import { Step } from '@virtality/react-joyride'

export const steps = [
  {
    target: '#dropdown-menu',
    title: 'Welcome to Virtality! 👋',
    content: (
      <>
        <p> Let’s get you started.</p>
        <p>
          In the top-right corner, you’ll find your <b>Avatar.</b>
        </p>
        <p>
          By clicking it, it opens this dropdown menu where you can access your{' '}
          <b>Profile</b>, <b>Settings</b>, and the <b>Logout</b> button.
        </p>
      </>
    ),
    disableBeacon: true,
    data: {
      description:
        'Thank you for choosing Virtality to power your physiotherapy experience!',
    },
    styles: {
      arrow: {
        color: '#000',
      },
    },
  },
  {
    target: '#user-profile',
    title: 'Let’s pair your VR headset 🎮',
    content: (
      <>
        <p>
          {
            'To do this, head to Profile > Devices and follow the instructions to connect your headset'
          }
        </p>
        <p>
          This ensures everything is set up for your patients to begin their
          sessions.
        </p>
      </>
    ),
    placement: 'left',
    data: {
      description: 'Before using the app, you’ll need to pair a new VR headset',
    },
    styles: {
      arrow: {
        color: '#000',
      },
    },
  },
  {
    target: '#add-new-device',
    title: 'Add your first VR headset ➕',
    content: (
      <>
        <p>
          To pair a new VR headset, simply{' '}
          <b>click the card with the plus (+) icon</b> in the center.
        </p>
      </>
    ),
    placement: 'right',
    locale: { next: 'Create' },
    data: { description: "You're now in the Devices tab." },
    styles: {
      arrow: {
        color: '#000',
      },
    },
  },
  {
    target: '#patients',
    title: 'Access your Patients 🧑‍🤝‍🧑',
    content: (
      <>
        <p>{'On the left sidebar, you’ll find the “Patients” section.'}</p>
        <p>
          Clicking it will take you to your full list of patients, where you can{' '}
          <b>view profiles, track progress, and manage sessions</b> everything
          you need, all in one place.
        </p>
      </>
    ),
    placement: 'right',
    styles: {
      arrow: {
        color: '#000',
      },
    },
  },
  {
    title: 'Add a New Patient 📝',
    target: '#new-patient',
    content: (
      <>
        <p>Ready to get started?</p>
        <p>
          Click the “New Patient” button to create your first patient profile.
        </p>
        <p>
          {
            'You’ll be able to enter their details, assign a personalized rehab program, and begin tracking their progress right away.'
          }
        </p>
      </>
    ),
    placement: 'left',
    locale: { next: 'Create' },
  },
  { target: '#', content: '' },
] as Step[]
