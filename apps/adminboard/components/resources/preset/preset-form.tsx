import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form-legacy';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PresetFormSchema } from '@/types/definitions';
import capitalize from 'lodash.capitalize';
import { pathologies } from '@/data/static/pathologies';
import { type PresetForm } from '@/types/models';
import { ReactNode } from 'react';
import ComboSelect from '@/components/ui/combo-select';

const PresetForm = ({
  values,
  onSubmit,
  SubmitBtn,
}: {
  values?: PresetForm;
  onSubmit: (values: PresetForm) => void;
  SubmitBtn?: ReactNode;
}) => {
  const form = useForm<PresetForm>({
    resolver: zodResolver(PresetFormSchema),
    defaultValues: {
      presetName: '',
      description: '',
      pathology: '',
      start: '',
      end: '',
    },
    values,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField
          name='presetName'
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name='description'
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{capitalize(field.name)}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name='pathology'
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{capitalize(field.name)}</FormLabel>
              <FormControl>
                <ComboSelect
                  value={field.value}
                  term='pathology'
                  onChange={field.onChange}
                  options={pathologies}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='flex flex-col gap-2'>
          <div className='flex items-center justify-between'>
            <FormField
              name='start'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period start</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder='0'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name='end'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period end</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder='2'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <p className='text-muted-foreground text-sm'>
            {'Refers to the specific period of the program [ex. week 0 - 2]'}
          </p>
        </div>
        {SubmitBtn}
      </form>
    </Form>
  );
};

export default PresetForm;
