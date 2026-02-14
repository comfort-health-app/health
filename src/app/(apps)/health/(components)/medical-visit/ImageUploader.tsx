'use client'

import {useState, useRef} from 'react'
import {basePath} from '@cm/lib/methods/common'
import {MedicalVisitImageType} from '@prisma/client'

type Props = {
  medicalVisitId: number
  imageType?: MedicalVisitImageType
  onUploaded: () => void
}

const MAX_UPLOAD_FILES = 10

export default function ImageUploader({medicalVisitId, imageType = 'AFTER', onUploaded}: Props) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
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
    setUploadProgress(`0/${files.length}件 アップロード中...`)

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setUploadProgress(`${i + 1}/${files.length}件 アップロード中...`)

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('medicalVisitId', medicalVisitId.toString())
        formData.append('imageType', imageType)

        const response = await fetch(`${basePath}/health/api/medical-visit/${medicalVisitId}/image`, {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (result.success) {
          successCount++
        } else {
          errorCount++
          console.error(`アップロードエラー (${file.name}):`, result.error)
        }
      } catch (error) {
        errorCount++
        console.error(`アップロードエラー (${file.name}):`, error)
      }
    }

    setIsUploading(false)
    setUploadProgress('')

    if (errorCount > 0) {
      alert(`${successCount}件成功、${errorCount}件失敗しました`)
    }

    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    onUploaded()
  }

  const borderColor = imageType === 'BEFORE' ? 'border-purple-300' : 'border-green-300'
  const textColor = imageType === 'BEFORE' ? 'text-purple-500' : 'text-green-500'

  return (
    <div className={`border-2 border-dashed ${borderColor} rounded-lg p-4 text-center`}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
        id={`file-upload-${medicalVisitId}-${imageType}`}
      />
      <label
        htmlFor={`file-upload-${medicalVisitId}-${imageType}`}
        className={`cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isUploading ? (
          <div className="text-gray-500">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
            <div>{uploadProgress}</div>
          </div>
        ) : (
          <div className={textColor}>
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div>クリックして画像を選択</div>
            <div className="text-xs mt-1">複数選択可能（最大10枚）</div>
          </div>
        )}
      </label>
    </div>
  )
}
