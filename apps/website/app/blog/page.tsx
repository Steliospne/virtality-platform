import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import placeholder from '@/public/placeholder.svg'

const blogPosts = [
  {
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
    image: '/conf_img.png',
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
  },
]

const BlogPage = () => {
  const featuredPost = blogPosts.find((post) => post.featured)
  return (
    <div>
      <div className='bg-gradient-to-b from-teal-50 to-white py-16'>
        <div className='container mx-auto px-4 text-center'>
          <div className='inline-block bg-teal-100 text-teal-800 px-4 py-2 rounded-full text-sm font-medium mb-6'>
            INSIGHTS & RESEARCH
          </div>
          <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4 text-balance'>
            VR Healthcare Blog
          </h1>
          <p className='text-xl text-gray-600 max-w-2xl mx-auto text-pretty'>
            Stay updated with the latest developments in virtual reality
            therapy, patient success stories, and medical research.
          </p>
        </div>
      </div>

      {featuredPost && (
        <section className='mb-16 container mx-auto'>
          <h2 className='text-2xl font-bold text-gray-900 mb-8'>
            Featured Article
          </h2>
          <Card className=' border-teal-200 shadow-lg py-0  overflow-hidden'>
            <div className='md:flex'>
              <div className='md:max-w-1/2'>
                <Image
                  width={200}
                  height={200}
                  src={featuredPost.image || placeholder}
                  alt={featuredPost.title}
                  className='w-full h-64 md:h-full object-cover'
                />
              </div>
              <div className='md:w-1/2 p-8'>
                <div className='flex items-center gap-4 mb-4'>
                  <Badge className='bg-teal-100 text-teal-800 hover:bg-teal-200'>
                    {featuredPost.category}
                  </Badge>
                  <span className='text-sm text-gray-500'>
                    {featuredPost.date}
                  </span>
                  <span className='text-sm text-gray-500'>•</span>
                  <span className='text-sm text-gray-500'>
                    {featuredPost.readTime}
                  </span>
                </div>
                <h3 className='text-2xl font-bold text-gray-900 mb-4 text-balance'>
                  {featuredPost.title}
                </h3>
                <p className='text-gray-600 mb-6 text-pretty'>
                  {featuredPost.excerpt}
                </p>
                <Link href={`/blog/${featuredPost.id}`}>
                  <Button variant='primary'>Read Full Article</Button>
                </Link>
              </div>
            </div>
          </Card>
        </section>
      )}
    </div>
  )
}

export default BlogPage
