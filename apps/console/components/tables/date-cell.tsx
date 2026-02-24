import { CoreColumn, Row } from '@tanstack/react-table'
import { format } from 'date-fns'

interface DateCellProps<TData, TValue> {
  row: Row<TData>
  id: CoreColumn<TData, TValue>['id']
}

const DateCell = <TData, TValue>({ row, id }: DateCellProps<TData, TValue>) => {
  if (!id) return
  const date: Date = row.getValue(id)
  const formatted = date === null ? 'NULL' : format(date, 'PPP')
  return <div>{formatted}</div>
}

export default DateCell
