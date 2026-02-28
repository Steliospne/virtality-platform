'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import placeholder from '@/public/placeholder.svg'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  SiFacebook,
  SiLinkedin,
  SiReddit,
  SiWhatsapp,
  SiX,
} from '@icons-pack/react-simple-icons'
import { useParams } from 'next/navigation'
import { Share } from 'lucide-react'
import { WEBSITE_URL, WEBSITE_URL_LOCAL } from '@virtality/shared/types'

const post = {
  id: 1,
  author: 'Katerina Tsiraki',
  authorSpecialty: 'Cognitive Engineer',
  authorImage: '/kate_auth_img.jpg',
  title:
    'The Future of Rehabilitation - Interactive Technology for Sports Injuries | Conference Talk',
  excerpt:
    'This conference talk explores how Virtual Reality (VR) is transforming physical rehabilitation by engaging the brain’s neuroplasticity. Through immersive and interactive environments, VR enhances motor recovery, reduces pain, supports cognitive and psychological well-being, and enables personalized, remote therapy. More than a supplementary tool, VR integrates mind and body into a unified approach, making rehabilitation more effective and engaging.',
  category: 'Technology',
  date: 'September 19, 2025',
  readTime: '8 min read',
  image: '/conf_image.png',
  featured: true,
  content: `
  <article>
  <p>
    Η Εικονική Πραγματικότητα (VR) αποτελεί μία από τις πιο καινοτόμες τεχνολογίες που έχουν εισέλθει στον χώρο της υγείας. 
    Μέσα από την αισθητηριακή εμβύθιση σε τρισδιάστατα και δυναμικά περιβάλλοντα, ο χρήστης μπορεί όχι μόνο να βιώνει με 
    ρεαλισμό το εικονικό περιβάλλον, αλλά και να αλληλεπιδρά σε πραγματικό χρόνο, λαμβάνοντας άμεση ανατροφοδότηση. Αυτά τα 
    χαρακτηριστικά επιτρέπουν την αξιοποίηση και εφαρμογή της εικονικής πραγματικότητας και στον τομέα της φυσικής 
    αποκατάστασης καθώς μας δίνει τη δυνατότητα να σχεδιάζουμε εξατομικευμένα σενάρια, να ελέγχουμε με ακρίβεια τα ερεθίσματα 
    και να καλλιεργούμε την αίσθηση ενσάρκωσης, αυξάνοντας την εμπλοκή και την αποτελεσματικότητα των συνεδριών.
  </p>

  <p>
    Τα επιστημονικά ευρήματα δείχνουν ότι μέσα από αυτά τα προσομοιωμένα και διαδραστικά περιβάλλοντα μπορούν να καλλιεργηθούν, 
    να ενισχυθούν αλλά και να ανακτηθούν ικανότητες. Πολυεπίπεδες ικανότητες που συνδέονται και επηρεάζουν άμεσα τη σωματική 
    ανάρρωση. Σε γνωστικό επίπεδο, βοηθά στην ενίσχυση της μνήμης, της προσοχής και της λήψης αποφάσεων· σε ψυχολογικό επίπεδο, 
    μπορεί να προάγει τη χαλάρωση και την ευεξία, μειώνοντας το άγχος και τον φόβο κίνησης· ενώ σε σωματικό επίπεδο, υποστηρίζει 
    την επανάκτηση κινητικών δεξιοτήτων, την ανακούφιση από τον πόνο και την αποκατάσταση χαμένων λειτουργιών μέσω 
    επανεκπαίδευσης των νευρωνικών κυκλωμάτων.
  </p>

  <p>
    Πώς γίνεται όμως αυτό και γιατί αυτή η τεχνολογία έχει αυτή τη δυνατότητα; Η απάντηση βρίσκεται στον εγκέφαλο. Ως κεντρικός 
    διαχειριστής της αποκατάστασης, ενεργοποιεί μηχανισμούς νευροπλαστικότητας, δηλαδή της ικανότητας του εγκεφάλου να 
    αναπροσαρμόζεται, να αναδιαρθρώνει νευρωνικές συνάψεις και λειτουργίες κάθε φορά που μαθαίνουμε ή βιώνουμε μια αλλαγή. 
    Επομένως, κάθε φορά που θέλουμε να “αλλάξουμε”, δηλαδή να αποκαταστήσουμε κάποια σωματική λειτουργία, η αλλαγή δεν είναι 
    μόνο σωματική· είναι και γνωστική αλλά και αισθητικοκινητική.
  </p>

  <p>
    Η εικονική πραγματικότητα, λοιπόν, μέσα από οπτικοακουστικά ή και απτικά ερεθίσματα, έχει τη δυνατότητα να ενεργοποιεί και 
    να ενισχύει τη νευροπλαστικότητα του εγκεφάλου, καθώς έχει αποδειχθεί ότι ακόμη και μέσω απλής νοητικής απεικόνισης, 
    ο εγκέφαλος «προπονείται» σαν να εκτελεί πραγματικές κινήσεις. Επιπλέον, μέσω της ίδιας τεχνολογίας, υπάρχει η δυνατότητα 
    εξ αποστάσεως παρακολούθησης, εξατομίκευσης και αξιολόγησης της προόδου σε πραγματικό χρόνο, ενώ τα πλούσια εικονικά 
    περιβάλλοντα μπορούν να αυξήσουν το κίνητρο και να μειώσουν τη μονοτονία. Αποδεικνύεται ιδιαίτερα χρήσιμη σε δύσκολες 
    καταστάσεις, όπως ο χρόνιος πόνος, η κινησιοφοβία, οι διαταραχές ισορροπίας ή η απώλεια ιδιοδεκτικής αίσθησης, 
    προσφέροντας λύσεις που οι παραδοσιακές μέθοδοι αδυνατούν να καλύψουν.
  </p>

  <p>
    Εν κατακλείδι, η Εικονική Πραγματικότητα δεν αποτελεί απλώς ένα συμπληρωματικό εργαλείο στη φυσική αποκατάσταση. Είναι ένας 
    ολοκληρωμένος μηχανισμός που ενοποιεί το γνωστικό, το σωματικό και το ψυχολογικό επίπεδο της θεραπείας, δημιουργώντας ένα 
    ενιαίο πεδίο όπου εγκέφαλος και σώμα συνεργάζονται αρμονικά. Το γεγονός αυτό καθιστά την εικονική πραγματικότητα ιδιαίτερα 
    αποτελεσματική.
  </p>
</article>`,
}

const BlogPost = () => {
  const { id } = useParams()
  const websiteURL =
    process.env.NODE_ENV === 'production' ? WEBSITE_URL : WEBSITE_URL_LOCAL
  const url = `${websiteURL}/blog/${id}`
  const text = encodeURIComponent(post.title)

  const links = {
    twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    reddit: `https://www.reddit.com/submit?url=${url}&title=${text}`,
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
  }

  return (
    <>
      <div className='bg-gray-50 py-4'>
        <div className='container mx-auto px-4'>
          <nav className='text-sm text-zinc-600'>
            <Link href='/' className='hover:text-teal-600'>
              Home
            </Link>
            <span className='mx-2'>→</span>
            <Link href='/blog' className='hover:text-teal-600'>
              Blog
            </Link>
            <span className='mx-2'>→</span>
            <span className='text-zinc-900'>{post.title}</span>
          </nav>
        </div>
      </div>

      <main className='container mx-auto px-4 py-12'>
        <div className='max-w-4xl mx-auto'>
          {/* Article Header */}
          <header className='mb-8'>
            <div className='flex items-center gap-4 mb-6'>
              <Badge className='bg-teal-100 text-teal-800 hover:bg-teal-200'>
                {post.category}
              </Badge>
              <span className='text-sm text-zinc-500'>{post.date}</span>
              <span className='text-sm text-zinc-500'>•</span>
              <span className='text-sm text-zinc-500'>{post.readTime}</span>
            </div>

            <h1 className='text-4xl md:text-5xl font-bold text-zinc-900 mb-6 text-balance'>
              {post.title}
            </h1>

            <p className='text-xl text-zinc-600 mb-8 text-pretty'>
              {post.excerpt}
            </p>

            {/* Author Info */}
            <div className='flex items-center gap-4 pb-8 border-b'>
              <Image
                width={50}
                height={50}
                src={post?.authorImage || placeholder}
                alt={post.author}
                className='w-12 h-12 rounded-full object-cover'
              />
              <div>
                <p className='font-semibold text-zinc-900'>{post.author}</p>
                <p className='text-sm text-zinc-600'>{post.authorSpecialty}</p>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          <div className='mb-12'>
            <iframe
              width='560'
              height='315'
              src='https://www.youtube.com/embed/DibqL9OdsBw?si=cSQsVzPEmBP3u5hS'
              title='YouTube video player'
              frameBorder='0'
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
              referrerPolicy='strict-origin-when-cross-origin'
              allowFullScreen
            ></iframe>
          </div>

          {/* Article Content */}
          <article className='prose prose-lg max-w-none'>
            <div
              className='text-zinc-700 leading-rel[axed [&_article]:space-y-2'
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>

          {/* Call to Action */}
          <Card className='mt-12 bg-teal-50 border-teal-200'>
            <CardContent className='p-8 text-center'>
              <h3 className='text-2xl font-bold text-zinc-900 mb-4'>
                Ready to Transform Your Practice?
              </h3>
              <p className='text-zinc-600 mb-6 max-w-2xl mx-auto'>
                {
                  "Discover how Virtality's VR therapy solutions can enhance patient outcomes and revolutionize your rehabilitation programs."
                }
              </p>
              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                <Button
                  asChild
                  className='bg-teal-600 hover:bg-teal-700 text-white'
                >
                  <Link href='https://cal.com/virtality'>Request a Demo</Link>
                </Button>
                <Button
                  variant='outline'
                  className='border-teal-600 text-teal-600 hover:bg-teal-50 bg-transparent'
                >
                  <Link href='/'>Learn More</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className='flex justify-between items-center mt-12 pt-8 border-t'>
            <Link href='/blog'>
              <Button
                variant='ghost'
                className='text-teal-600 hover:text-teal-700 hover:bg-teal-50'
              >
                ← Back to Blog
              </Button>
            </Link>
            <div className='flex gap-4'>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex gap-2 items-center'
                  >
                    <Share />
                    Share Article
                  </Button>
                </PopoverTrigger>

                <PopoverContent align='start' className='flex flex-col w-fit'>
                  <Link
                    href={links.twitter}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex gap-2 items-center'
                  >
                    <SiX className='size-4' />
                    Twitter
                  </Link>
                  <Link
                    href={links.facebook}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex gap-2 items-center'
                  >
                    <SiFacebook className='size-4' />
                    Facebook
                  </Link>
                  <Link
                    href={links.linkedin}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex gap-2 items-center'
                  >
                    <SiLinkedin className='size-4' />
                    LinkedIn
                  </Link>
                  <Link
                    href={links.reddit}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex gap-2 items-center'
                  >
                    <SiReddit className='size-4' />
                    Reddit
                  </Link>
                  <Link
                    href={links.whatsapp}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex gap-2 items-center'
                  >
                    <SiWhatsapp className='size-4' />
                    WhatsApp
                  </Link>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default BlogPost
