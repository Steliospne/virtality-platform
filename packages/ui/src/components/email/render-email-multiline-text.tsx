import { Fragment } from 'react'

export const renderEmailMultilineText = (text: string) => {
  const lines = text.split(/\r?\n/)

  return lines.map((line, index) => (
    <Fragment key={index}>
      {line}
      {index < lines.length - 1 ? <br /> : null}
    </Fragment>
  ))
}
