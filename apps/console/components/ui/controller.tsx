import {
  Control,
  Controller,
  ControllerFieldState,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from './field'
import { FieldMeta } from '@virtality/shared/types'

type FieldMetaPath<TFieldValues extends FieldValues> = FieldPath<TFieldValues> &
  keyof FieldMeta<TFieldValues>

type ControllerFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldMetaPath<TFieldValues>,
> = {
  name: TName
  meta: FieldMeta<TFieldValues>[TName]
  control: Control<TFieldValues>
  children: (props: {
    field: ControllerRenderProps<TFieldValues, TName>
    fieldState: ControllerFieldState
  }) => React.ReactElement
}

type ControllerFieldFn = <
  TFieldValues extends FieldValues,
  TName extends FieldMetaPath<TFieldValues>,
>(
  props: ControllerFieldProps<TFieldValues, TName>,
) => React.ReactElement

export const ControllerField: ControllerFieldFn = ({
  name,
  control,
  meta,
  children,
}) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldSet className='relative'>
            <FieldLabel htmlFor={field.name} className='text-xl font-bold'>
              {meta.label}
            </FieldLabel>
          </FieldSet>
          <FieldLegend>{meta.description}</FieldLegend>

          {children({ field, fieldState })}
          {meta.hint && <FieldDescription>{meta.hint}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
