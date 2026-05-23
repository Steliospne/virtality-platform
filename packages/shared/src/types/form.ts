type FieldValues = {
  [x: string]: any
}

export type FieldMeta<T extends FieldValues> = {
  [K in Extract<keyof T, string>]: {
    label: HumanizedLabel<K>
    placeholder?: string
    description?: string
    hint?: string
  }
}

type CamelCaseToWords<S extends string> = S extends `${infer C}${infer R}`
  ? R extends Uncapitalize<R>
    ? `${C}${CamelCaseToWords<R>}`
    : `${C} ${CamelCaseToWords<R>}`
  : S

export type HumanizedLabel<S extends string> = Capitalize<CamelCaseToWords<S>>
