export interface Guide {
  title: string
  description: string
  imageURL: string
  videoURL: string
  metaData?: {
    [key: string]: string
  }
}

export const guides: Guide[] = [
  {
    title: 'Unboxing and Setup',
    description:
      'In this video we show step-by-step how to unbox and setup your VR headset.',
    imageURL: '',
    videoURL: 'https://www.youtube.com/watch?v=6dSDTrP9NaM',
    metaData: {
      additionalInfoURL:
        'https://www.meta.com/en-gb/help/quest/463504908043519/',
    },
  },
  {
    title: 'Charging, maintenance and care for your Meta Quest 3S',
    description:
      'In this video we show step-by-step how to charge, maintain and care for your Meta Quest 3S.',
    imageURL: '',
    videoURL: 'https://www.youtube.com/watch?v=09J7RTrnJek',
    metaData: {
      additionalInfoURL:
        'https://www.meta.com/en-gb/help/quest/463504908043519/',
    },
  },
  {
    title: 'How to setup Guardian',
    description: 'In this video we show step-by-step how to setup Guardian.',
    imageURL: '',
    videoURL: 'https://www.youtube.com/watch?v=zh5ldprM5Mg',
    metaData: {
      additionalInfoURL:
        'https://www.meta.com/en-gb/help/quest/463504908043519/',
    },
  },
  {
    title: 'How to create a device',
    description:
      'In this video we show step-by-step how to create a new device.',
    imageURL: '/new_device_thumbnail.png',
    videoURL: 'https://www.youtube.com/embed/ADfpcTZqzVs?si=nZrijFzdoteJPwOx',
  },
  {
    title: 'How to create a patient',
    description:
      'In this video we show step-by-step how to create a new patient.',
    imageURL: '/new_patient_thumbnail.png',
    videoURL: 'https://www.youtube.com/embed/Ohdb9Tih8J0?si=jbtURt5Cz3WI9vEx',
  },
  {
    title: 'How to create a program',
    description:
      'In this video we show step-by-step how to create a new program.',
    imageURL: '/new_program_thumbnail.png',
    videoURL: 'https://www.youtube.com/embed/eadj_e8KnVM?si=gmry3j9okTmtROYL',
  },
]
