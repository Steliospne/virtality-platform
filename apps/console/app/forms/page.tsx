import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from '@/components/ui/item'
import { H1, H2, H3, P } from '@/components/ui/typography'
import { CircleQuestionMark } from 'lucide-react'
import { ReactNode } from 'react'
import Instructions from '@/app/(pages)/form/instructions.mdx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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

function FormItemDialog({
  children,
  formItem,
}: {
  children: ReactNode
  formItem: { title: string; url: string }
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='flex h-9/10 max-w-3/5! flex-col max-xl:max-w-9/10!'>
        <DialogHeader>
          <DialogTitle></DialogTitle>
        </DialogHeader>
        <div className='flex-1'>
          <iframe src={formItem.url} width='auto' className='size-full'>
            Loading…
          </iframe>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function HelpDialog({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='flex h-9/10 max-w-3/5! flex-col max-xl:max-w-9/10!'>
        <DialogHeader>
          <DialogTitle></DialogTitle>
        </DialogHeader>
        <div className='flex-1 space-y-3 overflow-auto'>
          <Instructions
            components={{
              h2: H2,
              h3: H3,
              p: P,
              ul: ({ children }: { children: ReactNode }) => (
                <ul className='[&_li]:list-inside [&_li]:list-disc'>
                  {children}
                </ul>
              ),
              ol: ({ children }: { children: ReactNode }) => (
                <ol className='[&_li]:list-inside [&_li]:list-decimal'>
                  {children}
                </ol>
              ),
              table: ({ children }: { children: ReactNode }) => (
                <Table>{children}</Table>
              ),
              thead: ({ children }: { children: ReactNode }) => (
                <TableHeader>{children}</TableHeader>
              ),
              tbody: ({ children }: { children: ReactNode }) => (
                <TableBody>{children}</TableBody>
              ),
              th: ({ children }: { children: ReactNode }) => (
                <TableHead>{children}</TableHead>
              ),
              tr: ({ children }: { children: ReactNode }) => (
                <TableRow>{children}</TableRow>
              ),
              td: ({ children }: { children: ReactNode }) => (
                <TableCell>{children}</TableCell>
              ),
            }}
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
