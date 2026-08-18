'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@virtality/ui/components/button'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from '@/components/ui/item'
import { H1 } from '@/components/ui/typography'
import { CircleQuestionMark } from 'lucide-react'
import usePageViewTracking from '@/hooks/analytics/use-page-view-tracking'
import { FormItemDialog } from './_components/form-item-dialog'
import { HelpDialog } from './_components/help-dialog'

type Questioner = { title: string; url: string }

const doctorList: Questioner[] = [
  {
    title: 'Ερωτηματολόγιο πριν τη θεραπεία.',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSeCY5_by7rR1NOaf9uCfTm6LgG2S6i85dGvOV_Q-UB975Zvbw/viewform?embedded=true',
  },
  {
    title: 'Ερωτηματολόγιο μετά τη θεραπεία.',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSeh-9a_uWOGRvvzgC7-vdetjswT1CT-d2qhb0gAqz_DyWmtMA/viewform?embedded=true',
  },
]

const mainGroupList: Questioner[] = [
  {
    title: 'Ερωτηματολόγιο πριν τη θεραπεία.',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSfHpThUv1nb8Z8_sit77bbhKd-TrYVacdWufWU_VeVeGTM33g/viewform?embedded=true',
  },
  {
    title: 'Ερωτηματολόγιο μετά τη θεραπεία.',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSeoq09Dx1XKg0mRYtWExssufH9wvOvDJwcuU-bVkLnKRZB4GA/viewform?embedded=true',
  },
  {
    title: 'Ερωτηματολόγιο πριν τη συνεδρία.',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSfA5yZ64PDCoi2KSaYGnNfMLABqesf_18vuKbxMjfKqAVn-Eg/viewform?embedded=true',
  },
  {
    title: 'Ερωτηματολόγιο μετά τη συνεδρία.',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSeEVEAH5ziwvWVH_odJlZEvjDOQiWZGzz9GiExR5UJrqINLNQ/viewform?embedded=true',
  },
  {
    title: '(EN) Ερωτηματολόγιο πριν τη θεραπεία.',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSe2N0_-g3LQVtw6DEbOkMBHrVd9NDY6QKiStRYrPppEgYelAg/viewform?embedded=true',
  },
  {
    title: '(EN) Ερωτηματολόγιο μετά τη θεραπεία.',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSedmftagfuDz4vcqAmCkc6hR-q1EN8uKwogbhgotnKtuO0kgg/viewform?embedded=true',
  },
  {
    title: '(EN) Ερωτηματολόγιο πριν τη συνεδρία.',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSfy1h2CLt-f9_x0IPaYwX1UcjcviHUBJCzQLjUeRdudo2aC4g/viewform?embedded=true',
  },
  {
    title: '(EN) Ερωτηματολόγιο μετά τη συνεδρία.',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSeQGoiXcg-2IwlZcr_OrWplibuiCxLG-Q3xUlzFGH7Fu_XVng/viewform?embedded=true',
  },
]

const controlGroupList: Questioner[] = [
  {
    title: 'Ερωτηματολόγιο πριν τη θεραπεία.',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSePeGsRvV0gIwjkydYSdYlqAzk3jredDL2YQdQs3Q2PXS__EA/viewform?embedded=true',
  },
  {
    title: 'Ερωτηματολόγιο μετά τη θεραπεία.',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSc9JvWsQc1o1tF_3-7ddLdWYY9_6P0h1rLYQB6ANdFchJxbOQ/viewform?embedded=true',
  },
  {
    title: '(EN) Ερωτηματολόγιο πριν τη θεραπεία',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSeTvwgoyQQPjExsIyYkLaYfVqeVGCgxzhZInP1ZZ-VCozGivA/viewform?embedded=true',
  },
  {
    title: '(EN) Ερωτηματολόγιο μετά τη θεραπεία.',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSfFutbegAgazlJe8cwuKNFpAmPUIbS_9qEWwgNTgRfrF2CEQA/viewform?embedded=true',
  },
]

const FormsPage = () => {
  usePageViewTracking({
    props: { route_group: 'user' },
  })
  return (
    <div className='h-screen-with-header'>
      <Accordion
        type='single'
        collapsible
        className='m-auto max-w-3xl py-6 max-lg:max-w-xl'
      >
        <H1 className='flex items-center gap-3'>
          Forms
          <HelpDialog>
            <Button size='icon' variant='ghost'>
              <CircleQuestionMark />
            </Button>
          </HelpDialog>
        </H1>
        <AccordionItem value='item-1'>
          <AccordionTrigger>Doctors</AccordionTrigger>
          <AccordionContent>
            <ItemGroup className='space-y-6 py-6'>
              {doctorList.map((item, index) => (
                <Item key={index} variant='outline'>
                  <ItemContent>
                    <ItemTitle>{item.title}</ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <FormItemDialog formItem={item}>
                      <Button>Open</Button>
                    </FormItemDialog>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value='item-2'>
          <AccordionTrigger>Patients (Main Group)</AccordionTrigger>
          <AccordionContent>
            <ItemGroup className='space-y-6 py-6'>
              {mainGroupList.map((item, index) => (
                <Item key={index} variant='outline'>
                  <ItemContent>
                    <ItemTitle>{item.title}</ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <FormItemDialog formItem={item}>
                      <Button>Open</Button>
                    </FormItemDialog>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value='item-3'>
          <AccordionTrigger>Patients (Control Group)</AccordionTrigger>
          <AccordionContent>
            <ItemGroup className='space-y-6 py-6'>
              {controlGroupList.map((item, index) => (
                <Item key={index} variant='outline'>
                  <ItemContent>
                    <ItemTitle>{item.title}</ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <FormItemDialog formItem={item}>
                      <Button>Open</Button>
                    </FormItemDialog>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export default FormsPage
