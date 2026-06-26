/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useEffect, useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Edit, Trash2, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'

type PricingRow = {
  id: number
  model: string
  official: string
  ratio: string
  price: string
  save: string
  hot: boolean
}

type HomePricingSectionProps = {
  enabled: boolean
  data: string
}

const pricingSchema = z.object({
  model: z
    .string()
    .min(1, 'Model is required')
    .max(100, 'Model must be less than 100 characters'),
  official: z.string().max(100).optional(),
  ratio: z.string().max(100).optional(),
  price: z.string().max(100).optional(),
  save: z.string().max(100).optional(),
  hot: z.boolean().optional(),
})

type PricingFormValues = z.infer<typeof pricingSchema>

export function HomePricingSection({ enabled, data }: HomePricingSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const [rows, setRows] = useState<PricingRow[]>([])
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [hasChanges, setHasChanges] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingRow, setEditingRow] = useState<PricingRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<'single' | 'batch'>('single')

  const form = useForm<PricingFormValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      model: '',
      official: '',
      ratio: '',
      price: '',
      save: '',
      hot: false,
    },
  })

  useEffect(() => {
    try {
      const parsed = JSON.parse(data || '[]')
      if (Array.isArray(parsed)) {
        setRows(
          parsed.map((item, idx) => ({
            id: item.id || idx + 1,
            model: item.model ?? '',
            official: item.official ?? '',
            ratio: item.ratio ?? '',
            price: item.price ?? '',
            save: item.save ?? '',
            hot: Boolean(item.hot),
          }))
        )
      }
    } catch {
      setRows([])
    }
  }, [data])

  useEffect(() => {
    setIsEnabled(enabled)
  }, [enabled])

  const handleToggleEnabled = async (checked: boolean) => {
    try {
      await updateOption.mutateAsync({
        key: 'console_setting.home_pricing_enabled',
        value: checked,
      })
      setIsEnabled(checked)
      toast.success(t('Setting saved'))
    } catch {
      toast.error(t('Failed to update setting'))
    }
  }

  const handleAdd = () => {
    setEditingRow(null)
    form.reset({
      model: '',
      official: '',
      ratio: '',
      price: '',
      save: '',
      hot: false,
    })
    setShowDialog(true)
  }

  const handleEdit = (row: PricingRow) => {
    setEditingRow(row)
    form.reset({
      model: row.model,
      official: row.official,
      ratio: row.ratio,
      price: row.price,
      save: row.save,
      hot: row.hot,
    })
    setShowDialog(true)
  }

  const handleDelete = (row: PricingRow) => {
    setEditingRow(row)
    setDeleteTarget('single')
    setShowDeleteDialog(true)
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      toast.error(t('Please select items to delete'))
      return
    }
    setDeleteTarget('batch')
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (deleteTarget === 'single' && editingRow) {
      setRows((prev) => prev.filter((item) => item.id !== editingRow.id))
      setHasChanges(true)
    } else if (deleteTarget === 'batch') {
      setRows((prev) => prev.filter((item) => !selectedIds.includes(item.id)))
      setSelectedIds([])
      setHasChanges(true)
    }
    setShowDeleteDialog(false)
    setEditingRow(null)
  }

  const handleSubmitForm = (values: PricingFormValues) => {
    const normalized = {
      model: values.model,
      official: values.official ?? '',
      ratio: values.ratio ?? '',
      price: values.price ?? '',
      save: values.save ?? '',
      hot: Boolean(values.hot),
    }
    if (editingRow) {
      setRows((prev) =>
        prev.map((item) =>
          item.id === editingRow.id ? { ...item, ...normalized } : item
        )
      )
    } else {
      const newId = Math.max(...rows.map((item) => item.id), 0) + 1
      setRows((prev) => [...prev, { id: newId, ...normalized }])
    }
    setHasChanges(true)
    setShowDialog(false)
  }

  const handleSaveAll = async () => {
    try {
      await updateOption.mutateAsync({
        key: 'console_setting.home_pricing',
        value: JSON.stringify(
          rows.map(({ id: _id, ...rest }) => rest)
        ),
      })
      setHasChanges(false)
      toast.success(t('Saved successfully'))
    } catch {
      toast.error(t('Failed to save'))
    }
  }

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? rows.map((item) => item.id) : [])
  }

  const toggleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id)
    )
  }

  return (
    <SettingsSection
      title={t('模型定价')}
      description={t('Maintain the model pricing table shown on the home page')}
    >
      <div className='space-y-4'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='flex flex-wrap items-center gap-2'>
            <Button onClick={handleAdd} size='sm'>
              <Plus className='mr-2 h-4 w-4' />
              {t('Add')}
            </Button>
            <Button
              onClick={handleBatchDelete}
              size='sm'
              variant='destructive'
              disabled={selectedIds.length === 0}
            >
              <Trash2 className='mr-2 h-4 w-4' />
              {t('Delete (')}
              {selectedIds.length})
            </Button>
            <Button
              onClick={handleSaveAll}
              size='sm'
              variant='secondary'
              disabled={!hasChanges || updateOption.isPending}
            >
              <Save className='mr-2 h-4 w-4' />
              {updateOption.isPending ? t('Saving...') : t('Save Settings')}
            </Button>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground text-sm'>
              {t('Enabled')}
            </span>
            <Switch checked={isEnabled} onCheckedChange={handleToggleEnabled} />
          </div>
        </div>

        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-12'>
                  <Checkbox
                    checked={
                      selectedIds.length === rows.length && rows.length > 0
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>{t('模型')}</TableHead>
                <TableHead>{t('官方价格 ($/1M TOK)')}</TableHead>
                <TableHead>{t('倍率')}</TableHead>
                <TableHead>{t('本站价格 (¥/1M TOK)')}</TableHead>
                <TableHead>{t('节省')}</TableHead>
                <TableHead className='w-32'>{t('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='h-24 text-center'>
                    {t('No entries yet.')}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(row.id)}
                        onCheckedChange={(checked) =>
                          toggleSelectOne(row.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className='font-medium'>
                      {row.model}
                      {row.hot && (
                        <span className='ml-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400'>
                          HOT
                        </span>
                      )}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {row.official}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {row.ratio}
                    </TableCell>
                    <TableCell>{row.price}</TableCell>
                    <TableCell className='text-muted-foreground'>
                      {row.save}
                    </TableCell>
                    <TableCell>
                      <div className='flex gap-2'>
                        <Button
                          onClick={() => handleEdit(row)}
                          size='sm'
                          variant='ghost'
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          onClick={() => handleDelete(row)}
                          size='sm'
                          variant='ghost'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>
              {editingRow ? t('Edit') : t('Add')}
            </DialogTitle>
            <DialogDescription>
              {t('Configure a model pricing row for the home page')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmitForm)}
              className='space-y-4'
            >
              <FormField
                control={form.control}
                name='model'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('模型')}</FormLabel>
                    <FormControl>
                      <Input placeholder='GPT-5.5' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='official'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('官方价格 ($/1M TOK)')}</FormLabel>
                    <FormControl>
                      <Input placeholder='$5.00 / $30.00' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='ratio'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('倍率')}</FormLabel>
                    <FormControl>
                      <Input placeholder='0.35' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='price'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('本站价格 (¥/1M TOK)')}</FormLabel>
                    <FormControl>
                      <Input placeholder='¥1.75 / ¥10.50' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='save'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('节省')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('约省 95%')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='hot'
                render={({ field }) => (
                  <FormItem className='flex items-center justify-between rounded-md border p-3'>
                    <div className='space-y-0.5'>
                      <FormLabel>HOT</FormLabel>
                      <FormDescription>
                        {t('Show a HOT badge next to the model name')}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setShowDialog(false)}
                >
                  {t('Cancel')}
                </Button>
                <Button type='submit'>
                  {editingRow ? t('Update') : t('Add')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget === 'single'
                ? t('This entry will be removed from the list.')
                : t('Selected entries will be removed from the list.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {t('Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsSection>
  )
}
