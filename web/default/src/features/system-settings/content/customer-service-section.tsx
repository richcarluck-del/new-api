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
import { useEffect, useRef, useState } from 'react'
import { Plus, Save, Trash2, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'

type ServiceItem = {
  label: string
  image: string
}

type CustomerServiceSectionProps = {
  enabled: boolean
  data: string
}

const MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2 MB

export function CustomerServiceSection({
  enabled,
  data,
}: CustomerServiceSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const fileInputs = useRef<(HTMLInputElement | null)[]>([])

  const [isEnabled, setIsEnabled] = useState(enabled)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<ServiceItem[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    try {
      const parsed = JSON.parse(data || '{}')
      setTitle(typeof parsed.title === 'string' ? parsed.title : '')
      setDescription(
        typeof parsed.description === 'string' ? parsed.description : ''
      )
      setItems(
        Array.isArray(parsed.items)
          ? parsed.items.map((item: ServiceItem) => ({
              label: item.label ?? '',
              image: item.image ?? '',
            }))
          : []
      )
    } catch {
      setTitle('')
      setDescription('')
      setItems([])
    }
  }, [data])

  useEffect(() => {
    setIsEnabled(enabled)
  }, [enabled])

  const handleToggleEnabled = async (checked: boolean) => {
    try {
      await updateOption.mutateAsync({
        key: 'console_setting.customer_service_enabled',
        value: checked,
      })
      setIsEnabled(checked)
      toast.success(t('Setting saved'))
    } catch {
      toast.error(t('Failed to update setting'))
    }
  }

  const handleAddItem = () => {
    setItems((prev) => [...prev, { label: '', image: '' }])
    setHasChanges(true)
  }

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
    setHasChanges(true)
  }

  const handleItemLabelChange = (index: number, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, label: value } : item))
    )
    setHasChanges(true)
  }

  const handleImageUpload = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(t('图片大小不能超过 2 MB'))
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      const result =
        typeof loadEvent.target?.result === 'string'
          ? loadEvent.target.result
          : ''
      setItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, image: result } : item))
      )
      setHasChanges(true)
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleSaveAll = async () => {
    try {
      await updateOption.mutateAsync({
        key: 'console_setting.customer_service',
        value: JSON.stringify({ title, description, items }),
      })
      setHasChanges(false)
      toast.success(t('Saved successfully'))
    } catch {
      toast.error(t('Failed to save'))
    }
  }

  return (
    <SettingsSection
      title={t('联系客服')}
      description={t('Configure the customer service contact popup')}
    >
      <div className='space-y-4'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <Button
            onClick={handleSaveAll}
            size='sm'
            variant='secondary'
            disabled={!hasChanges || updateOption.isPending}
          >
            <Save className='mr-2 h-4 w-4' />
            {updateOption.isPending ? t('Saving...') : t('Save Settings')}
          </Button>
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground text-sm'>
              {t('Enabled')}
            </span>
            <Switch checked={isEnabled} onCheckedChange={handleToggleEnabled} />
          </div>
        </div>

        <div className='space-y-2'>
          <Label>{t('客服标题')}</Label>
          <Input
            value={title}
            placeholder={t('联系客服')}
            onChange={(e) => {
              setTitle(e.target.value)
              setHasChanges(true)
            }}
          />
        </div>

        <div className='space-y-2'>
          <Label>{t('客服说明')}</Label>
          <Textarea
            value={description}
            rows={2}
            placeholder={t('扫码添加客服或加入交流群')}
            onChange={(e) => {
              setDescription(e.target.value)
              setHasChanges(true)
            }}
          />
        </div>

        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <Label>{t('二维码')}</Label>
            <Button onClick={handleAddItem} size='sm' variant='outline'>
              <Plus className='mr-2 h-4 w-4' />
              {t('Add')}
            </Button>
          </div>

          {items.length === 0 ? (
            <div className='text-muted-foreground rounded-md border border-dashed py-8 text-center text-sm'>
              {t('No entries yet.')}
            </div>
          ) : (
            <div className='grid gap-4 sm:grid-cols-2'>
              {items.map((item, index) => (
                <div
                  key={index}
                  className='flex flex-col gap-3 rounded-lg border p-3'
                >
                  <div className='flex items-start gap-3'>
                    <div className='bg-muted/30 flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-md border'>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.label || t('二维码')}
                          className='size-full object-contain'
                        />
                      ) : (
                        <span className='text-muted-foreground/50 text-xs'>
                          {t('无图')}
                        </span>
                      )}
                    </div>
                    <div className='flex flex-1 flex-col gap-2'>
                      <Input
                        value={item.label}
                        placeholder={t('如：QQ 交流群')}
                        onChange={(e) =>
                          handleItemLabelChange(index, e.target.value)
                        }
                      />
                      <input
                        ref={(el) => {
                          fileInputs.current[index] = el
                        }}
                        type='file'
                        accept='image/png,image/jpeg,image/webp'
                        className='hidden'
                        onChange={(e) => handleImageUpload(index, e)}
                      />
                      <div className='flex gap-2'>
                        <Button
                          type='button'
                          size='sm'
                          variant='outline'
                          className='flex-1'
                          onClick={() => fileInputs.current[index]?.click()}
                        >
                          <Upload className='mr-2 h-4 w-4' />
                          {item.image ? t('更换') : t('上传')}
                        </Button>
                        <Button
                          type='button'
                          size='sm'
                          variant='ghost'
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SettingsSection>
  )
}
