import type { HighlightCardListItem } from '@virtality/shared/types'
import HighlightCard from './highlight-card'

type HighlightCardsGridProps = {
  cards: HighlightCardListItem[]
}

const HighlightCardsGrid = ({ cards }: HighlightCardsGridProps) => {
  return (
    <div className='mx-auto grid max-w-7xl gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3'>
      {cards.map((card, index) => (
        <HighlightCard
          key={card.id}
          title={card.title}
          body={card.body}
          iconName={card.iconName}
          index={index}
        />
      ))}
    </div>
  )
}

export default HighlightCardsGrid
