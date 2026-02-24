import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from './field'
import { Input } from './input'
import React, { ChangeEventHandler, ReactNode } from 'react'
import { Textarea } from './textarea'
import { Select, SelectContent, SelectTrigger, SelectValue } from './select'
import { Checkbox } from './checkbox'

type FormControlProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> = {
  name: TName
  label: ReactNode
  description?: ReactNode
  control: ControllerProps<TFieldValues, TName, TTransformedValues>['control']
}

type FormBaseProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> = FormControlProps<TFieldValues, TName, TTransformedValues> & {
  horizontal?: boolean
  controlFirst?: boolean
  className?: string
  children: (
    field: Parameters<
      ControllerProps<TFieldValues, TName, TTransformedValues>['render']
    >[0]['field'] & {
      'aria-invalid': boolean
      id: string
    },
  ) => ReactNode
}

type FormControlFunc<
  ExtraProps extends Record<string, unknown> = Record<never, never>,
> = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>(
  props: FormControlProps<TFieldValues, TName, TTransformedValues> & ExtraProps,
) => ReactNode

function FormBase<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  children,
  control,
  label,
  name,
  description,
  controlFirst,
  horizontal,
  className,
}: FormBaseProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const labelElement = (
          <>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            {description && <FieldDescription>{description}</FieldDescription>}
          </>
        )

        const control = children({
          ...field,
          id: field.name,
          'aria-invalid': fieldState.invalid,
        })

        const errorElem = fieldState.invalid && (
          <FieldError errors={[fieldState.error]} />
        )

        return (
          <Field
            data-invalid={fieldState.invalid}
            orientation={horizontal ? 'horizontal' : undefined}
            className={className}
          >
            {controlFirst ? (
              <>
                {control}
                <FieldContent>
                  {labelElement}
                  {errorElem}
                </FieldContent>
              </>
            ) : (
              <>
                <FieldContent>{labelElement}</FieldContent>
                {control}
                {errorElem}
              </>
            )}
          </Field>
        )
      }}
    />
  )
}

export const FormInput: FormControlFunc<{
  type?: React.ComponentProps<'input'>['type']
  placeholder?: React.ComponentProps<'input'>['placeholder']
}> = (props) => {
  return (
    <FormBase {...props}>
      {(field) => <Input type={props.type} {...props} {...field} />}
    </FormBase>
  )
}

export const FormFileInput: FormControlFunc<{
  onChange?: (url: string) => void
}> = (props) => {
  return (
    <FormBase {...props}>
      {(field) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { value, ...rest } = field

        const handleFileUpload: ChangeEventHandler<HTMLInputElement> = (e) => {
          if (e.target.files) {
            const file = e.target.files[0]
            field.onChange(file)
            if (props.onChange) {
              props.onChange(URL.createObjectURL(file))
            }
          }
        }
        return <Input type='file' {...rest} onChange={handleFileUpload} />
      }}
    </FormBase>
  )
}

export const FormTextarea: FormControlFunc<{
  className?: string
  disabled?: HTMLTextAreaElement['disabled']
}> = (props) => {
  return (
    <FormBase {...props} className={props.className}>
      {(field) => <Textarea {...field} disabled={props.disabled} />}
    </FormBase>
  )
}

export const FormSelect: FormControlFunc<{ children: ReactNode }> = ({
  children,
  ...props
}) => {
  return (
    <FormBase {...props}>
      {({ onChange, onBlur, ...field }) => (
        <Select {...field} onValueChange={onChange}>
          <SelectTrigger
            aria-invalid={field['aria-invalid']}
            id={field.id}
            onBlur={onBlur}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>{children}</SelectContent>
        </Select>
      )}
    </FormBase>
  )
}

export const FormCheckbox: FormControlFunc<{
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}> = ({ checked, onCheckedChange, ...props }) => {
  return (
    <FormBase {...props} horizontal controlFirst>
      {({ onChange, value, ...field }) => {
        const actualChecked = checked ?? value

        const handleCheckedChange = (nextChecked: boolean) => {
          onChange(nextChecked)
          onCheckedChange?.(nextChecked)
        }

        return (
          <Checkbox
            {...field}
            checked={actualChecked}
            onCheckedChange={handleCheckedChange}
          />
        )
      }}
    </FormBase>
  )
}
