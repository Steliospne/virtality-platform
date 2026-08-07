/**
 * In-repo blog catalog (Authors + Posts). Short-lived until Adminboard authoring.
 * Posts without final media stay commented out until CDN assets are ready.
 */

import type { Author, Post } from './types'

/** Stand-in until real cover / body media is uploaded. */
const MEDIA_PLACEHOLDER = '/placeholder.svg'

export const authors: Author[] = [
  {
    id: 'katerina-tsiraki',
    name: 'Katerina Tsiraki',
    role: 'CEO & Cognitive Engineer',
    image: '/kate_auth_img.jpg',
  },
  {
    id: 'virtality-team',
    name: 'Virtality',
    image: '/virtality_small_rounded.png',
  },
]

const katerina = authors[0]!

const virtalityTeam = authors[1]!

export const posts: Post[] = [
  {
    slug: 'panhellenic-physiotherapy-conference',
    title:
      'Virtality Featured as an Invited Speaker at the Panhellenic Physiotherapy Conference',
    excerpt:
      'Our first major public debut in Crete: a keynote on interactive rehab for sports injuries, a round-table with athletes, and our first exhibition booth.',
    cover: 'https://cdn.virtality.app/marketing/blogs/conf_img-r41z017u.png',
    authorId: virtalityTeam.id,
    publishedAt: '2025-09-06',
    featured: false,
    body: [
      {
        kind: 'image',
        src: 'https://cdn.virtality.app/marketing/blogs/conf_img-r41z017u.png',
        alt: 'Poster of the Panhellenic Physiotherapy Conference',
        caption: 'Poster of the Panhellenic Physiotherapy Conference.',
      },
      {
        kind: 'paragraph',
        text: 'Virtality made its first major public debut at the 2nd Scientific Physiotherapy Conference in Crete. It was a massive milestone for our team, allowing us to showcase our platform from the main stage to the exhibition floor.',
      },
      {
        kind: 'heading',
        level: 2,
        text: 'The Invited Keynote & Panel',
      },
      {
        kind: 'paragraph',
        text: 'Our CEO, Katerina Tsiraki (background in cognitive neuroscience, AI & human-machine interaction), was invited to deliver a keynote titled “The Future of Rehabilitation: Interactive Technology for Sports Injuries.” Rather than just a high-level overview, the presentation dove deep into the science, covering the brain’s role in injury and rehab, how immersive environments can activate neuroplasticity to accelerate physical recovery, which conditions can be served by VR that currently lack effective clinical tools, and evidence-based insights from key literature backing digital therapeutics.',
      },
      {
        kind: 'video',
        url: 'https://www.youtube.com/watch?v=DibqL9OdsBw',
        source: 'youtube',
        caption:
          'Keynote talk by Katerina Tsiraki at the Panhellenic Physiotherapy Conference.',
      },
      {
        kind: 'paragraph',
        text: 'Following the keynote, we joined a round-table panel alongside expert physiotherapists and two legendary guest speakers, a Paralympian and a retired Greek National Team goalkeeper. Hearing their recovery stories reinforced our core belief: technology only matters when it serves real human needs.',
      },
      {
        kind: 'image',
        src: 'https://cdn.virtality.app/marketing/blogs/panhellenic-physiotherapy-conference-photo-1-sie9j7xt.png',
        alt: 'Round-table discussion with speakers',
        caption: 'Round-table discussion with speakers.',
      },
      {
        kind: 'heading',
        level: 2,
        text: 'Live Demonstrations & Our First Pilots',
      },
      {
        kind: 'paragraph',
        text: 'While our clinical vision was being shared on stage, the rest of the Virtality team was running our very first exhibition booth. We gave live demonstrations to numerous physiotherapists, resulting in our very first market validation and securing our first cohort of pilot users who are now helping us improve Virtality in real-world clinical scenarios.',
      },
      {
        kind: 'image',
        src: 'https://cdn.virtality.app/marketing/blogs/panhellenic-physiotherapy-conference-photo-2-8dht3j0s.jpeg',
        alt: 'Physiotherapists at the Virtality booth',
        caption: 'Photo: Physiotherapists at the Virtality booth.',
      },
      {
        kind: 'paragraph',
        text: 'Initiatives like this play a vital role in unifying diverse scientific fields-advancing knowledge, fostering healthy modernization, and driving true interdisciplinary collaboration.',
      },
      {
        kind: 'paragraph',
        text: 'A huge thank you to Dr. Despoina Ignatoglou, President of the Scientific Committee, and Mr. Epameinondas Charonitis, President of the Organizing Committee and the Heraklion–Lasithi Regional Department, for the prestigious invitation, flawless organization, and excellent collaboration. We left Crete with immense market validation and a clear path forward.',
      },
    ],
  },
  {
    slug: 'piraeus-startup-accelerator-top-10',
    title: 'Virtality Named a Top 10 Team in the Piraeus Startup Accelerator',
    excerpt:
      'From over 64 applicants to the final ten, awarded a €5,000 grant at Demo Day at the Goulandris Foundation.',
    cover:
      'https://cdn.virtality.app/marketing/blogs/piraeus-startup-accelerator-top-10-1-wviloqcf.jpg',
    authorId: virtalityTeam.id,
    publishedAt: '2025-10-21',
    featured: false,
    body: [
      {
        kind: 'image',
        src: 'https://cdn.virtality.app/marketing/blogs/piraeus-startup-accelerator-top-10-1-wviloqcf.jpg',
        alt: 'Virtality presenting at the Piraeus Startup Accelerator',
        caption:
          'Photo: Virtality presenting at the Piraeus Startup Accelerator.',
      },
      {
        kind: 'paragraph',
        text: 'One stage. A few minutes. Months of hard work. We are thrilled to announce that Virtality was showcased as one of the Top 10 graduating teams of the prestigious Piraeus Startup Accelerator. What began as a highly competitive pool of over 64 applicants was narrowed down to 35 teams for the initial phase, and finally down to the top 10. Making it to the final stage marks the completion of an intensive growth journey where our commercial viability and social impact took clear shape. The grand finale took place at a high-profile Demo Day at the Basil & Eliza Goulandris Foundation Museum of Modern Art, attended by the Executive Management of Piraeus Bank, venture capital investors, academic leaders, and key stakeholders from the Greek tech ecosystem. As part of this final showcase, Virtality was awarded a €5,000 grant prize in recognition of our work, market potential and scalable tech.',
      },
      {
        kind: 'heading',
        level: 2,
        text: 'Scalability & Social Impact',
      },
      {
        kind: 'paragraph',
        text: 'The Piraeus Startup Accelerator is designed to bridge the funding gap for young innovators across regional Greece, empowering startups to transform ideas into internationally competitive products. For Virtality, this program was a catalyst. We refined our business model, proving that our vision: aligning cognitive neuroscience, AI, and VR rehabilitation is a highly scalable solution capable of disrupting the physical therapy market while driving meaningful social impact. Throughout the accelerator, we received intensive guidance from ecosystem mentors and top-tier banking executives, sharpening our market strategy and investor readiness.',
      },
      {
        kind: 'image',
        src: 'https://cdn.virtality.app/marketing/blogs/piraeus-startup-accelerator-top-10-2-zsrn8gnr.jpg',
        alt: 'Group photo of the Piraeus Startup Accelerator finalists',
        caption:
          'Photo: Group photo of the Piraeus Startup Accelerator finalists.',
      },
      {
        kind: 'heading',
        level: 2,
        text: 'Acknowledgments',
      },
      {
        kind: 'paragraph',
        text: 'This achievement wouldn’t have been possible without an incredible support system. We extend our deepest gratitude to Piraeus Bank & the Equall Initiative for prioritizing innovation, supporting the next generation of founders, and providing an unparalleled platform for growth. Point of Synergy (POS4work Innovation Hub) & Nasos Koskinas: for setting exceptionally high program standards, providing hands-on support, and delivering multidimensional empowerment throughout this journey.',
      },
    ],
  },
  {
    slug: 'innodays-crete',
    title: 'Virtality Showcases Next-Gen Rehab Platform at InnoDays Crete',
    excerpt:
      'From a hackathon idea to booth Δ07: live demos, investor conversations, and strong talent interest at InnoDays Crete.',
    cover: 'https://cdn.virtality.app/marketing/blogs/innodays-1-zvwwy3r3.jpg',
    authorId: virtalityTeam.id,
    publishedAt: '2025-11-29',
    featured: false,
    body: [
      {
        kind: 'image',
        src: 'https://cdn.virtality.app/marketing/blogs/innodays-1-zvwwy3r3.jpg',
        alt: 'InnoDays booth Δ07',
        caption: 'Photo: Booth Δ07.',
      },
      {
        kind: 'paragraph',
        text: 'Are you ready to try the future? Virtality made a powerful return to InnoDays Crete, setting up booth Δ07 to showcase the future of physical rehabilitation. For our team, this event was deeply symbolic: at the previous InnoDays, we were there with nothing more than a raw idea at a hackathon. This year, we returned as an established startup with our own dedicated exhibition booth.',
      },
      {
        kind: 'heading',
        level: 2,
        text: 'High Traction & Talent Magnet',
      },
      {
        kind: 'paragraph',
        text: 'The energy at booth Δ07 was unmatched. Over the course of the event, we achieved incredible milestones: dozens of attendees, clinicians, and tech enthusiasts tried our VR platform firsthand; we connected and opened dialogues with key investors excited about our scaling potential; and the excitement around Virtality was so strong that multiple professionals handed us their CVs, eager to join our team and mission.',
      },
      {
        kind: 'image',
        src: 'https://cdn.virtality.app/marketing/blogs/innodays-2-z3cjp14z.jpg',
        alt: 'Live VR demo at the booth',
        caption: 'Photo: Live VR demo at the booth.',
      },
      {
        kind: 'paragraph',
        text: 'Seeing how far we’ve come reinforces our execution speed. We didn’t just build a prototype; we built a company. Thank you to everyone who stopped by, tested our tech, and shared their feedback!',
      },
    ],
  },
  {
    slug: 'piraeus-startup-accelerator-xanthi',
    title:
      'Virtality Invited as Alumni Speaker at Piraeus Startup Accelerator Kickoff in Xanthi',
    excerpt:
      'Back on stage as a previous winner, sharing founder growth lessons with the next accelerator cohort in Xanthi.',
    cover:
      'https://cdn.virtality.app/marketing/blogs/piraeus-startup-accelerator-xanthi-1-sfss19po.jpeg',
    authorId: virtalityTeam.id,
    publishedAt: '2026-02-06',
    featured: false,
    body: [
      {
        kind: 'image',
        src: 'https://cdn.virtality.app/marketing/blogs/piraeus-startup-accelerator-xanthi-1-sfss19po.jpeg',
        alt: 'Xanthi panel speaking photo',
        caption: 'Photo: Speaking on the panel at the event venue.',
      },
      {
        kind: 'paragraph',
        text: 'Virtality was recently honored to return to the Piraeus Startup Accelerator stage, this time as a previous winner and alumni panelist for the flagship kickoff event in Xanthi. As the accelerator traveled across the country to launch its next cycle, our team was invited alongside selected top teams from the previous cohort to share our journey, the impact of the program, and what lies ahead for Virtality.',
      },
      {
        kind: 'heading',
        level: 2,
        text: 'The Core Lesson: Founder Growth Drives Startup Growth',
      },
      {
        kind: 'paragraph',
        text: 'Reflecting on our journey from initial applicants to becoming one of the final Top 10 winning teams, the experience underscored a fundamental truth in entrepreneurship: the growth of a startup begins with the growth of the people behind it. During the panel, we discussed how navigating the accelerator forced us to learn, adapt, and expand our thinking, ultimately making us better at making critical decisions, overcoming complex market challenges, and moving forward with absolute clinical and business clarity.',
      },
      {
        kind: 'image',
        src: 'https://cdn.virtality.app/marketing/blogs/piraeus-startup-accelerator-xanthi-2-ae1kwsda.jpg',
        alt: 'Piraeus startup accelerator alumni panel',
        caption: 'Photo: Piraeus startup accelerator alumni panel.',
      },
      {
        kind: 'heading',
        level: 2,
        text: 'The Power of Ecosystem Support',
      },
      {
        kind: 'paragraph',
        text: 'An accelerator is only as good as the people running it. This event gave us the perfect opportunity to publicly recognize the mentors who created an environment that pushed our limits and helped us see further than we could on our own. We extend our sincere thanks to Nasos Koskinas, the team at POS4work, and the mentors at Piraeus Bank for the invitation and their continued multi-dimensional support. This is exactly the kind of ecosystem backing young entrepreneurs in Greece need to build internationally competitive companies.',
      },
      {
        kind: 'paragraph',
        text: 'Virtality moves forward with immense gratitude for our roots and a sharp focus on our next scaling milestones.',
      },
    ],
  },
  {
    slug: 'physiotherapy-seminar-acl',
    title: 'Virtality Presents VR Rehabilitation at Clinical Student Seminar',
    excerpt:
      'Invited by a pilot clinic to present how VR and AI support ACL recovery, then live demos for the next generation of physiotherapists.',
    cover:
      'https://cdn.virtality.app/marketing/blogs/physiotherapy-seminar-acl-1-mjqhpiu6.jpg',
    authorId: virtalityTeam.id,
    publishedAt: '2026-03-27',
    featured: false,
    body: [
      {
        kind: 'image',
        src: 'https://cdn.virtality.app/marketing/blogs/physiotherapy-seminar-acl-1-mjqhpiu6.jpg',
        alt: 'Seminar photo',
        caption: 'Photo: ACL seminar poster and featured speakers.',
      },
      {
        kind: 'paragraph',
        text: 'Virtality was recently invited to present at a specialized seminar focused on anterior cruciate ligament (ACL) rupture and rehabilitation. The event was hosted by one of our key pilot clinics, highlighting a proud and growing collaboration. While leading experts in physiotherapy and orthopedics presented the traditional clinical aspects of managing ACL injuries, our team took the stage to introduce how virtual reality (VR) and artificial intelligence (AI) can actively support, track, and enhance the physical recovery process.',
      },
      {
        kind: 'heading',
        level: 2,
        text: 'Educating the Future of Physical Therapy',
      },
      {
        kind: 'paragraph',
        text: 'This seminar provided a valuable opportunity to connect directly with the next generation of clinicians. During our session, we covered the foundation of VR technology, neuroscience, and its intersection with physical rehabilitation; how targeted VR environments improve patient compliance, manage pain perception, and deliver the precise stimuli needed to safely accelerate rehabilitation across different recovery stages, including complex cases like ACL injuries; and how intelligent data insights can help therapists monitor progress and safely tailor recovery protocols.',
      },
      {
        kind: 'heading',
        level: 2,
        text: 'Live Technology Demonstration',
      },
      {
        kind: 'paragraph',
        text: 'Following the presentation, students had the opportunity to experience Virtality firsthand. We ran live demonstrations of our platform, giving future physiotherapists a hands-on look at how immersive tech integrates smoothly into real-world clinical workflows.',
      },
      {
        kind: 'paragraph',
        text: 'We want to extend our sincere thanks to George Trantas, one of our current clinic partners, for the invitation and for championing innovation in physical therapy education.',
      },
    ],
  },
  {
    slug: 'delphi-economic-forum',
    title: 'Virtality Invited as Guest Speaker at Delphi Economic Forum XI',
    excerpt:
      'On the EQUALL panel at Delphi, sharing what founder growth looks like when building a high-impact health-tech company.',
    cover:
      'https://cdn.virtality.app/marketing/blogs/delphi-economic-forum-1-l833dhwq.jpg',
    coverFocusY: 30,
    authorId: virtalityTeam.id,
    publishedAt: '2026-04-24',
    featured: false,
    body: [
      {
        kind: 'image',
        src: 'https://cdn.virtality.app/marketing/blogs/delphi-economic-forum-1-l833dhwq.jpg',
        alt: 'Delphi Economic Forum stage photo',
        caption: 'Photo: On stage at the Delphi Economic Forum.',
      },
      {
        kind: 'paragraph',
        text: 'Virtality was recently honored on one of the most prestigious stages for global dialogue, business, and innovation: the Delphi Economic Forum XI. Our CEO and Founder, Katerina Tsiraki, was invited by Piraeus Bank to join the high-profile panel “EQUALL in Action: People’s Stories of Growth” at the Amalia Hotel (Ermis Hall). Representing the entrepreneurial spirit of the Piraeus Startup Accelerator initiative, Virtality took the stage to share key insights on building a high-impact health-tech company and what true growth looks like in the startup ecosystem.',
      },
      {
        kind: 'heading',
        level: 2,
        text: 'Defining Growth in the Startup Journey',
      },
      {
        kind: 'paragraph',
        text: 'During the panel, we highlighted that building a successful startup goes far beyond product development or hitting commercial milestones: it is fundamentally about human evolution. Katerina shared her perspective on how founders must constantly learn to navigate uncertainty, adapt to rigorous feedback, and develop the resilient mindset required to lead. Through Virtality’s journey, we showcased how the right ecosystem support accelerates a founder’s path to gaining operational clarity, confidence, and strategic direction.',
      },
      {
        kind: 'image',
        src: 'https://cdn.virtality.app/marketing/blogs/delphi-economic-forum-2-zbagzyj1.jpg',
        alt: 'Delphi panel photo',
        caption: 'Photo: Panel at the Delphi Economic Forum.',
      },
      {
        kind: 'heading',
        level: 2,
        text: 'A Shared Focus on Impact',
      },
      {
        kind: 'paragraph',
        text: 'The event brought together vital cross-sector discussions spanning healthcare, education, tech, and culture. It underscored a core belief we hold at Virtality: true innovation only happens when different industries and perspectives collide around a shared focus on human impact.',
      },
      {
        kind: 'paragraph',
        text: 'We would like to extend our warmest thanks to prominent journalist Margarita Pournara for her exceptional coordination and insightful interview style as the panel’s moderator. Finally, our deepest gratitude goes to Piraeus Bank for this exclusive invitation and continuous backing, as well as to POS4work for their dedicated guidance. Initiatives like these are vital because they create the essential spaces where people, paradigm-shifting ideas, and real-world impact meet.',
      },
    ],
  },
  {
    slug: 'we4g-2026-top-10',
    title:
      'Virtality Named a Top 10 Laureate in the International WE4G 2026 Program',
    excerpt:
      'Selected from 335 international projects and 56 countries, entering the HEC Paris Incubator as a WE4G Top 10 Laureate.',
    cover:
      'https://cdn.virtality.app/marketing/blogs/women-entrepreneurs-4-good-vlg21lno.png',
    authorId: virtalityTeam.id,
    publishedAt: '2026-05-05',
    featured: false,
    body: [
      {
        kind: 'image',
        src: 'https://cdn.virtality.app/marketing/blogs/women-entrepreneurs-4-good-vlg21lno.png',
        alt: 'WE4G program photo',
        caption: 'Photo: WE4G final top 10 winners.',
      },
      {
        kind: 'paragraph',
        text: 'Out of 335 international projects and 56 countries, Virtality has been selected as one of the final Top 10 Laureates for the prestigious WomenEntrepreneurs4Good (WE4G) 2026 program. Organized by the Women’s Forum for the Economy & Society, Bank of America, and the HEC Paris Innovation & Entrepreneurship Institute (consistently ranked among the absolute top business schools globally), the WE4G initiative is an elite accelerator backing purposeful ventures capable of driving real-world health and social impact. The rigorous global selection process narrowed the field down to 88 semi-finalists, ultimately recognizing just 10 exceptional projects from 8 countries as this year’s official laureates.',
      },
      {
        kind: 'heading',
        level: 2,
        text: 'The 72-Hour Design Sprint',
      },
      {
        kind: 'paragraph',
        text: 'A defining milestone of the program was an intensive, 72-hour digital Design Sprint. This high-pressure environment challenged our team to deeply stress-test our approach, transforming raw patient insights and clinical feedback into a highly validated framework that addresses the real-world daily challenges faced by therapists. The sprint provided an invaluable opportunity to revisit critical strategic questions, ensuring that Virtality remains seamlessly integrated into modern clinical workflows while delivering absolute therapeutic clarity. We extend our deepest gratitude to Mathias Abramovicz and Remi Rivas for guiding us through the sprint with such a structured and effective framework.',
      },
      {
        kind: 'heading',
        level: 2,
        text: 'The Global Roadmap: HEC Paris Incubator & Paris Pitch',
      },
      {
        kind: 'paragraph',
        text: 'By securing our place as a WE4G Laureate, Virtality’s international validation takes a massive leap forward. Our team has officially entered the HEC Paris Incubator for four months of intensive online support, tailored mentorship, and strategic development. Following the incubation phase, Virtality will travel to Paris to showcase our virtual reality solution (specifically designed to help physiotherapists accelerate the recovery of patients with mobility impairments) at the Women’s Forum Annual Event.',
      },
      {
        kind: 'paragraph',
        text: 'We are incredibly proud to represent Greece on this global stage alongside a community of purpose-driven innovators. Virtality moves forward into this next chapter ready to scale our platform and deliver advanced, evidence-based recovery tools to clinics worldwide.',
      },
    ],
  },
  {
    slug: 'panathenea-startup-showcase',
    title: 'Virtality Featured by Piraeus Bank at Panathēnea Startup Showcase',
    excerpt:
      'Live VR demos at the Piraeus Bank pavilion, bringing clinical rehab tech into a public festival setting.',
    cover:
      'https://cdn.virtality.app/marketing/blogs/panathenea-startup-showcase-1-nv4rant8.jpg',
    authorId: virtalityTeam.id,
    publishedAt: '2026-05-29',
    featured: false,
    body: [
      {
        kind: 'image',
        src: 'https://cdn.virtality.app/marketing/blogs/panathenea-startup-showcase-1-nv4rant8.jpg',
        alt: 'Panathēnea booth photo',
        caption: 'Photo: Team at the Piraeus Bank booth.',
      },
      {
        kind: 'paragraph',
        text: 'Virtality was recently featured by Piraeus Bank at the beautifully organized Panathēnea festival, joining a curated group of top-performing startups selected from the Piraeus Startup Accelerator. Hosted directly at the Piraeus Bank pavilion, the event was a phenomenal success. It provided our team with a vibrant, public platform to connect with industry leaders, clinicians, and individuals who are deeply passionate about the future of healthcare.',
      },
      {
        kind: 'heading',
        level: 2,
        text: 'Public Engagement & Live Testing',
      },
      {
        kind: 'paragraph',
        text: 'Throughout the festival, we ran live, hands-on demonstrations of our platform, giving attendees and physical therapy professionals the opportunity to step into our virtual reality environment and see the system in action. Stepping out of the clinical setting and into a vibrant public space like Panathēnea is invaluable. It allowed us to introduce our technology to a broader audience, observe first-hand how users interact with the interface in a high-stimulus environment, and spark meaningful conversations about our ultimate goal: making physical therapy more effective for patients and more efficient for clinicians.',
      },
      {
        kind: 'image',
        src: 'https://cdn.virtality.app/marketing/blogs/panathenea-startup-showcase-2-nju7jmxv.jpg',
        alt: 'Visitor trying VR headset',
        caption: 'Photo: Visitor trying the Virtality VR headset.',
      },
      {
        kind: 'heading',
        level: 2,
        text: 'Strategic Partnership & Ecosystem Support',
      },
      {
        kind: 'paragraph',
        text: 'Sharing the pavilion with fellow forward-thinking teams reminded us of the immense power of a thriving startup ecosystem. Seeing the collective energy of innovators pushing boundaries and proving what is possible reinforces our drive to keep moving forward. We extend our deepest gratitude to the entire Piraeus Bank team for hosting us at their booth, highlighting Virtality as a success story of their accelerator program, and providing continuous, multi-dimensional support.',
      },
      {
        kind: 'paragraph',
        text: 'With our technology validated on the public stage, Virtality moves forward into its next phase of clinical deployment with unwavering determination.',
      },
    ],
  },
  {
    slug: 'beyond-expo-2026',
    title: 'Virtality Secures Dual-Booth Presence at BEYOND Expo 2026',
    excerpt:
      'Two booths in Athens (Startup Village and the Region of Crete pavilion) while the team also ran VivaTech in Paris.',
    cover:
      'https://cdn.virtality.app/marketing/blogs/beyond-expo-2026-1-uno3epb5.webp',
    coverFocusY: 30,
    authorId: virtalityTeam.id,
    publishedAt: '2026-06-19',
    featured: false,
    body: [
      {
        kind: 'image',
        src: 'https://cdn.virtality.app/marketing/blogs/beyond-expo-2026-1-uno3epb5.webp',
        alt: 'BEYOND Expo booth photo',
        caption: 'Photo: BEYOND Expo booth.',
      },
      {
        kind: 'paragraph',
        text: 'June 2026 proved to be an extraordinary month of growth and visibility for Virtality. While our team was concurrently managing an international presence at Viva Technology in Paris, we were simultaneously out in full force in Athens for an unforgettable three-day run at the BEYOND Expo 2026 (June 17–19). Reflecting our strong traction within the ecosystem, Virtality was uniquely invited by two separate entities, allowing us to establish a dual-booth presence across the expo floor. Visitors, partners, and clinicians could find us live in action at both the Startup Village (Hall 3) and hosted directly within the official Region of Crete pavilion.',
      },
      {
        kind: 'heading',
        level: 2,
        text: 'Double the Footprint, Double the Impact',
      },
      {
        kind: 'paragraph',
        text: 'An exhibition of this scale highlights the immense power of structured ecosystem backing. Operating two distinct hubs allowed us to maximize our reach, serving as highly active touchpoints for launching our presence, building high-value connections, and demonstrating our platform to a massive audience. We loved sharing our vision with everyone who dropped by both locations, engaging in deeply meaningful conversations with physical therapy professionals and tech innovators who care about the future of digital health. Spaces like BEYOND are invaluable because innovation grows exponentially faster when it is surrounded by people who are open to new solutions and driven by real progress.',
      },
      {
        kind: 'image',
        src: 'https://cdn.virtality.app/marketing/blogs/beyond-expo-2026-2-ns6ii2sg.jpeg',
        alt: 'Speaking at BEYOND TV',
        caption: 'Photo: Speaking at BEYOND TV.',
      },
      {
        kind: 'heading',
        level: 2,
        text: 'Deep Gratitude to Our Partners',
      },
      {
        kind: 'paragraph',
        text: 'We want to extend our sincere gratitude to POS4work for their continuous guidance and backing in the Startup Village, as well as the Region of Crete for inviting us to share their pavilion and providing the physical platform to showcase what Virtality is building. We walked away from the expo floor with incredible momentum, a significantly expanded clinical network, and an unwavering determination to bring advanced, evidence-based recovery tools to clinics worldwide.',
      },
    ],
  },
  {
    slug: 'vivatech-2026',
    title:
      'Virtality Steps Onto the Global Stage at Viva Technology 2026 in Paris',
    excerpt:
      'As a WE4G Top 10 Laureate, Virtality presented on the VivaTech stage and left Paris with HEC Paris Incubator momentum.',
    cover:
      'https://cdn.virtality.app/marketing/blogs/vivatech-2026-1-w0txvk4q.png',
    authorId: virtalityTeam.id,
    publishedAt: '2026-06-26',
    featured: true,
    body: [
      {
        kind: 'image',
        src: 'https://cdn.virtality.app/marketing/blogs/vivatech-2026-1-w0txvk4q.png',
        alt: 'VivaTech stage presentation photo',
        caption: 'Photo: Presenting on the VivaTech stage.',
      },
      {
        kind: 'paragraph',
        text: 'June reached an unforgettable international climax for Virtality as our team traveled to Paris to step onto the global stage at Viva Technology 2026, Europe’s largest and most prestigious innovation and technology conference. As a newly named Top 10 Global Laureate of the WomenEntrepreneurs4Good (WE4G) program, Virtality was selected to present our platform directly to an international audience of impact investors, healthcare pioneers, and global tech leaders.',
      },
      {
        kind: 'heading',
        level: 2,
        text: 'Democratizing Complex Science and Technology for the Clinic Next Door',
      },
      {
        kind: 'paragraph',
        text: 'When we founded Virtality, our core mission was clear: to revolutionize the speed and quality of patient recovery by merging advanced virtual reality with neuroscience. Crucially, our goal has always been to democratize not only complex science but also the technology itself, transforming what could be an intimidating digital system into a practical, intuitive tool that any physical therapy clinic can deploy effortlessly. Taking the stage at VivaTech was a profound validation that our mission is resonating globally. More importantly, the unprecedented acceleration in recovery timelines and clinical impact we are already delivering across our partner clinics prove that this technology is ready for the international market.',
      },
      {
        kind: 'image',
        src: 'https://cdn.virtality.app/marketing/blogs/vivatech-2026-2-t5p9i7n3.jpeg',
        alt: 'VivaTech floor photo',
        caption: 'Photo: Virtality at VivaTech.',
      },
      {
        kind: 'heading',
        level: 2,
        text: 'Global Inspiration and Scaling Traction',
      },
      {
        kind: 'paragraph',
        text: 'Beyond presenting on stage, walking the exhibition floor at VivaTech provided an inspiring look into the global future of technology. Witnessing groundbreaking innovations from around the world has reinforced our determination to keep pushing the boundaries of digital health. We extend our deepest gratitude to HEC Paris, the Women’s Forum for the Economy & Society, and Bank of America. Going above and beyond to bring this year’s top 10 cohort directly to the main Viva Technology stage was an exceptional, high-impact initiative.',
      },
      {
        kind: 'heading',
        level: 2,
        text: 'Accelerating Growth with the HEC Paris Incubator',
      },
      {
        kind: 'paragraph',
        text: 'We left Paris with massive international momentum. Moving forward, backed by the elite support and strategic mentorship of the HEC Paris Incubator, our team is fully focused on scaling our clinical traction to reach even more patients worldwide.',
      },
      {
        kind: 'paragraph',
        text: 'If you are a clinical director or physical therapy professional who missed us in Paris but wants to learn how Virtality is shaping the future of physical rehabilitation, please reach out to us directly. We are just getting started.',
      },
    ],
  },
]
