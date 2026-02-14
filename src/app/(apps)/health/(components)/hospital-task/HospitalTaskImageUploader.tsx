'use client'

import {useState, useRef} from 'react'
import {basePath} from '@cm/lib/methods/common'

type Props = {
  hospitalTaskId: number
  onUploaded: () => void
}

const MAX_UPLOAD_FILES = 10

export default function HospitalTaskImageUploader({hospitalTaskId, onUploaded}: Props) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // 10枚制限チェック
    if (files.length > MAX_UPLOAD_FILES) {
      alert(`一度にアップロードできる画像は${MAX_UPLOAD_FILES}枚までです。\n${files.length}枚選択されています。`)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setIsUploading(true)

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('hospitalTaskId', hospitalTaskId.toString())

        await fetch(`${basePath}/health/api/hospital-task/${hospitalTaskId}/image`, {
          method: 'POST',
          body: formData,
        })
      } catch (error) {
        console.error(`アップロードエラー (${file.name}):`, error)
      }
    }

    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onUploaded()
  }

  return (
    <div className="border border-dashed border-gray-300 rounded p-2 text-center">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
        id={`task-file-${hospitalTaskId}`}
      />
      <label
        htmlFor={`task-file-${hospitalTaskId}`}
        className={`cursor-pointer text-xs ${isUploading ? 'text-gray-400' : 'text-gray-500'}`}
      >
        {isUploading ? 'アップロード中...' : 'クリックして画像を選択（最大10枚）'}
      </label>
    </div>
  )
}

